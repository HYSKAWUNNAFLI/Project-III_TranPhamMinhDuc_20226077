import { useMemo, useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Checkout.css";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import paymentService, {
  type Payment,
  type PaymentProvider,
} from "../services/paymentService";
import orderService, { type Order } from "../services/orderService";
import { API_BASE_URL } from "../services/api";
import { QRCodeCanvas } from "qrcode.react";

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation() as {
    state?: {
      orderId?: number;
      deliveryFee?: number;
      total?: number;
      order?: Order;
    };
  };
  const storedOrderId = Number(localStorage.getItem("currentOrderId"));
  const resolvedOrderId = Number.isFinite(storedOrderId)
    ? storedOrderId
    : undefined;
  const orderId = location.state?.orderId ?? resolvedOrderId;
  const deliveryFee = location.state?.deliveryFee ?? 15000;
  const { lines, subtotal, clear } = useCart();
  const { showToast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFail, setShowFail] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [orderSnapshot, setOrderSnapshot] = useState<Order | null>(
    location.state?.order ?? null,
  );
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null);
  const [paymentLinkId, setPaymentLinkId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [qrImageError, setQrImageError] = useState(false);
  const [paymentProvider, setPaymentProvider] =
    useState<PaymentProvider>("VIETQR");
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [isSwitchingProvider, setIsSwitchingProvider] = useState(false);
  const [vietQrExpiresAt, setVietQrExpiresAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const autoCancelRef = useRef(false);
  const suppressFailureRef = useRef(false);

  const orderPaymentMinutes = orderSnapshot?.paymentMinutes ?? 5;
  const fallbackVietQrDurationMs = orderPaymentMinutes * 60 * 1000;

  // Use orderId directly for display
  const displayOrderCode = orderId ? String(orderId) : "--";

  const formatVnd = (value: number | null | undefined) =>
    `${Math.max(0, Math.round(value ?? 0)).toLocaleString("vi-VN")} VND`;

  const formatCountdown = (seconds: number | null) => {
    if (seconds == null) {
      return "--:--";
    }
    const safeSeconds = Math.max(0, seconds);
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const parseExpiryMs = (value?: string | null) => {
    if (!value) {
      return null;
    }
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const orderExpiresAtMs = useMemo(() => {
    const createdAt = parseExpiryMs(orderSnapshot?.createdAt ?? null);
    if (createdAt == null) {
      return null;
    }
    return createdAt + orderPaymentMinutes * 60 * 1000;
  }, [orderSnapshot?.createdAt, orderPaymentMinutes]);

  const totals = useMemo(() => {
    const subtotalAmount = orderSnapshot?.totalBeforeVat ?? subtotal;
    const shipping = orderSnapshot?.shippingFee ?? deliveryFee;
    const totalWithVat = orderSnapshot?.totalWithVat;
    const vatAmount =
      totalWithVat != null
        ? Math.max(0, totalWithVat - subtotalAmount - shipping)
        : subtotalAmount * 0.1;
    const finalTotal = totalWithVat ?? subtotalAmount + shipping + vatAmount;
    return {
      subtotalAmount,
      shippingFee: shipping,
      vatAmount,
      totalWithVat: finalTotal,
    };
  }, [orderSnapshot, subtotal, deliveryFee]);

  const statusLabelMap: Record<string, string> = {
    PAID: "Đã thanh toán",
    SUCCESSFULL: "Đã thanh toán",
    CAPTURED: "Đã thanh toán",
    PENDING: "Đang chờ",
    CANCELLED: "Đã hủy",
    FAILED: "Thất bại",
    EXPIRED: "Hết hạn",
  };
  const isPaid =
    paymentStatus === "PAID" ||
    paymentStatus === "SUCCESSFULL" ||
    paymentStatus === "CAPTURED";
  const statusText = paymentStatus
    ? statusLabelMap[paymentStatus] || paymentStatus
    : paymentProvider === "PAYPAL"
      ? "Đang chờ PayPal"
      : "Đang chờ";

  const buildPaymentRequest = (provider: PaymentProvider) => ({
    orderId: Number(orderId),
    provider,
    amount: totals.totalWithVat,
    currency: "VND",
    successReturnUrl: `${window.location.origin}/payment/success`,
    cancelReturnUrl: `${window.location.origin}/payment/cancel`,
  });

  const applyPaymentResult = (
    provider: PaymentProvider,
    payment: Partial<Payment>,
  ) => {
    const transactionId =
      typeof payment?.transactionId === "number"
        ? payment.transactionId
        : typeof payment?.id === "number"
          ? payment.id
          : null;
    if (transactionId != null) {
      setPaymentId(transactionId);
      localStorage.setItem("currentPaymentId", String(transactionId));
    }
    setPaymentStatus(payment?.status ?? null);
    setShowFail(false);
    setShowSuccess(false);
    if (provider === "PAYPAL") {
      setApprovalUrl(payment?.approvalUrl ?? null);
      setQrCodeUrl(null);
      setPaymentLinkId(null);
      setQrImageError(false);
      setVietQrExpiresAt(null);
      setRemainingSeconds(null);
      return;
    }
    setQrCodeUrl(payment?.qrContent ?? null);
    setPaymentLinkId(payment?.providerReference ?? null);
    setApprovalUrl(null);
    suppressFailureRef.current = false;
    if (orderExpiresAtMs != null) {
      setVietQrExpiresAt(orderExpiresAtMs);
      return;
    }
    const startAt = Date.now();
    localStorage.setItem(
      `vietqrStartAt_${orderId ?? "unknown"}`,
      String(startAt),
    );
    setVietQrExpiresAt(startAt + fallbackVietQrDurationMs);
  };

  const createPaymentForProvider = async (provider: PaymentProvider) => {
    const request = buildPaymentRequest(provider);
    const payment = await paymentService.createPayment(request);
    applyPaymentResult(provider, payment);
    setPaymentProvider(provider);
  };

  const handleSelectProvider = async (nextProvider: PaymentProvider) => {
    if (nextProvider === paymentProvider) {
      return;
    }
    if (!orderId) {
      showToast("Không tìm thấy đơn hàng để thanh toán.", "error");
      return;
    }
    setIsSwitchingProvider(true);
    if (paymentProvider === "VIETQR" && nextProvider === "PAYPAL") {
      suppressFailureRef.current = true;
    }
    try {
      if (paymentId && !isPaid) {
        await paymentService.cancelPayment(
          paymentId,
          "User switched payment method",
        );
      }
      await createPaymentForProvider(nextProvider);
    } catch (error) {
      console.error("Failed to switch payment provider:", error);
      showToast(
        "Không thể đổi phương thức thanh toán. Vui lòng thử lại.",
        "error",
      );
      suppressFailureRef.current = false;
    } finally {
      setIsSwitchingProvider(false);
    }
  };

  const triggerAutoCancel = () => {
    if (autoCancelRef.current) {
      return;
    }
    if (!orderId || isPaid) {
      return;
    }
    autoCancelRef.current = true;
    const url = `${API_BASE_URL}/orders/${orderId}/cancel`;
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, "");
      return;
    }
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {
      // Silent fallback for unload scenario.
    });
  };

  useEffect(() => {
    if (!orderId) {
      return;
    }
    let active = true;
    orderService
      .getOrder(orderId)
      .then((order) => {
        if (active) {
          setOrderSnapshot(order);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch order details:", error);
      });
    return () => {
      active = false;
    };
  }, [orderId]);

  // Handle payment result from order details
  useEffect(() => {
    if (orderSnapshot) {
      console.log("PaymentPage: Order loaded", orderSnapshot);
    }
    if (orderSnapshot?.paymentResult) {
      console.log(
        "PaymentPage: Payment Result found",
        orderSnapshot.paymentResult,
      );
      const {
        transactionId,
        qrContent,
        providerReference,
        status,
        approvalUrl: nextApprovalUrl,
      } = orderSnapshot.paymentResult;
      if (qrContent) {
        console.log("PaymentPage: Setting QR Content", qrContent);
        setQrCodeUrl(qrContent);
      } else if (!nextApprovalUrl) {
        console.warn("PaymentPage: No QR Content in payment result");
      }
      if (nextApprovalUrl) {
        setApprovalUrl(nextApprovalUrl);
      }
      if (providerReference && qrContent) {
        setPaymentLinkId(providerReference);
      }
      if (transactionId && paymentId == null) {
        setPaymentId(transactionId);
        localStorage.setItem("currentPaymentId", String(transactionId));
      }
      if (qrContent && paymentProvider === "VIETQR") {
        if (orderExpiresAtMs != null) {
          setVietQrExpiresAt(orderExpiresAtMs);
        } else if (vietQrExpiresAt == null) {
          const storageKey = `vietqrStartAt_${orderId ?? "unknown"}`;
          const storedStart = Number(localStorage.getItem(storageKey));
          const startAt = Number.isFinite(storedStart)
            ? storedStart
            : Date.now();
          if (!Number.isFinite(storedStart)) {
            localStorage.setItem(storageKey, String(startAt));
          }
          setVietQrExpiresAt(startAt + fallbackVietQrDurationMs);
        }
      }
      // If status is already PAID (e.g. re-opening page), update local state
      if (status && paymentProvider === "VIETQR") {
        if (status !== "CANCELLED" || !suppressFailureRef.current) {
          setPaymentStatus(status);
        }
        if (
          status === "PAID" ||
          status === "SUCCESSFULL" ||
          status === "CAPTURED"
        ) {
          setShowSuccess(true);
        }
      }
    } else if (orderSnapshot) {
      console.warn("PaymentPage: No paymentResult in order");
    }
  }, [orderSnapshot]);

  useEffect(() => {
    if (paymentProvider !== "VIETQR" || !vietQrExpiresAt) {
      setRemainingSeconds(null);
      return;
    }
    const updateCountdown = () => {
      const diffSeconds = Math.max(
        0,
        Math.floor((vietQrExpiresAt - Date.now()) / 1000),
      );
      setRemainingSeconds(diffSeconds);
    };
    updateCountdown();
    const timerId = window.setInterval(updateCountdown, 1000);
    return () => {
      clearInterval(timerId);
    };
  }, [paymentProvider, vietQrExpiresAt]);

  useEffect(() => {
    if (paymentProvider !== "VIETQR" || remainingSeconds == null) {
      return;
    }
    if (remainingSeconds > 0 || isPaid) {
      return;
    }
    triggerAutoCancel();
    if (!showFail) {
      if (!suppressFailureRef.current) {
        setPaymentStatus("EXPIRED");
        setShowFail(true);
      }
    }
  }, [paymentProvider, remainingSeconds, isPaid, showFail]);

  // Auto-poll PayOS so users don't have to click "Tôi đã thanh toán"
  useEffect(() => {
    if (paymentProvider !== "VIETQR" || !paymentLinkId) {
      return;
    }

    let cancelled = false;
    let intervalId: number | null = null;

    const pollStatus = async () => {
      try {
        const statusResponse =
          await paymentService.checkPayOSPaymentStatus(paymentLinkId);
        if (cancelled) return;
        const status = statusResponse.status;
        if (["FAILED", "EXPIRED"].includes(status)) {
          if (!suppressFailureRef.current) {
            setPaymentStatus(status);
            setShowFail(true);
          }
          if (intervalId) {
            clearInterval(intervalId);
          }
          return;
        }
        if (status === "CANCELLED") {
          if (!suppressFailureRef.current) {
            setPaymentStatus(status);
          }
          if (intervalId) {
            clearInterval(intervalId);
          }
          return;
        }
        setPaymentStatus(status);
        if (status === "PAID") {
          if (intervalId) {
            clearInterval(intervalId);
          }
          setShowSuccess(true);
          setShowFail(false);
          setTimeout(() => {
            clear();
            navigate("/");
          }, 1200);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to poll PayOS status", error);
        }
      }
    };

    intervalId = window.setInterval(pollStatus, 3000);
    pollStatus();

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [paymentProvider, paymentLinkId, clear, navigate]);

  const isPayPal = paymentProvider === "PAYPAL";
  const paymentTitle = isPayPal ? "PAYPAL PAYMENT" : "VIETQR PAYMENT";
  const noteText = isPaid
    ? "Đã xác nhận thanh toán, đang chuyển hướng..."
    : isPayPal
      ? "Nhấn Continue to PayPal để hoàn tất thanh toán. Đừng đóng trang này cho đến khi thanh toán xong."
      : "Đừng đóng trang cho đến khi thanh toán hoàn tất.";

  const handlePayPalRedirect = () => {
    if (!approvalUrl) {
      showToast("PayPal link is not ready yet.", "error");
      return;
    }
    window.location.href = approvalUrl;
  };

  const handleCancelOrder = async () => {
    if (!orderId) {
      showToast("No order to cancel", "error");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to cancel this order? This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsCancelling(true);
    autoCancelRef.current = true;
    try {
      await orderService.cancelOrder(orderId);
      showToast(
        "Order cancelled successfully. You can modify your cart and create a new order.",
        "success",
      );
      setTimeout(() => {
        navigate("/cart");
      }, 1500);
    } catch (error: any) {
      console.error("Failed to cancel order:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to cancel order";
      showToast(errorMessage, "error");
    } finally {
      setIsCancelling(false);
    }
  };

  if (lines.length === 0) {
    return (
      <main className="checkout-shell">
        <div className="checkout-topbar">
          <Link to="/products" className="back-link">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to Products
          </Link>
        </div>
        <div className="panel empty-cart">
          <div style={{ fontSize: 48, color: "#cbd5e1" }}>👜</div>
          <div>Your cart is empty</div>
          <Link className="btn primary" to="/products">
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-shell">
      <div className="checkout-topbar">
        <button
          className="back-link"
          type="button"
          onClick={() => navigate("/checkout/delivery")}
        >
          &lt; BACK TO DELIVERY
        </button>
      </div>
      <h1>PAYMENT</h1>
      <div className="checkout-layout">
        <section className="panel">
          <div className="payment-hero">
            <div>
              <div className="eyebrow">SECURE PAYMENT</div>
              <div className="payment-title">{paymentTitle}</div>
            </div>
            <span className="status-pill">
              <span className="dot" />
              {statusText}
            </span>
          </div>

          <div className="payment-tabs">
            <button
              type="button"
              className={`payment-tab ${paymentProvider === "VIETQR" ? "active" : ""}`}
              onClick={() => handleSelectProvider("VIETQR")}
              disabled={isSwitchingProvider || isPaid}
            >
              <span className="payment-tab__icon">QR</span>
              VietQR
            </button>
            <button
              type="button"
              className={`payment-tab ${paymentProvider === "PAYPAL" ? "active" : ""}`}
              onClick={() => handleSelectProvider("PAYPAL")}
              disabled={isSwitchingProvider || isPaid}
            >
              <span className="payment-tab__icon payment-tab__icon--paypal">
                PP
              </span>
              PayPal
            </button>
          </div>

          <div className="payment-body">
            {isPayPal ? (
              <div className="payment-grid">
                <div className="payment-qr">
                  <div className="qr-frame">
                    <div className="qr-box">
                      <div className="qr-inner paypal-card">
                        <div className="paypal-logo">
                          <span>Pay</span>
                          <span>Pal</span>
                        </div>
                        <span className="paypal-subtext">Secure checkout</span>
                      </div>
                    </div>
                  </div>
                  <div className="qr-meta">
                    <span>Mã đơn hàng</span>
                    <strong>
                      {displayOrderCode ? `#${displayOrderCode}` : "--"}
                    </strong>
                  </div>
                </div>

                <div className="payment-instructions">
                  <div className="payment-steps">
                    <div className="payment-step">
                      <span className="payment-step__index">01</span>
                      <span>
                        Nhấn Continue to PayPal để chuyển sang PayPal.
                      </span>
                    </div>
                    <div className="payment-step">
                      <span className="payment-step__index">02</span>
                      <span>Đăng nhập và xác nhận thanh toán.</span>
                    </div>
                    <div className="payment-step">
                      <span className="payment-step__index">03</span>
                      <span>Quay lại trang này để hoàn tất đơn hàng.</span>
                    </div>
                  </div>

                  <div className="payment-amount">
                    {formatVnd(totals.totalWithVat)}
                  </div>
                  <p className="note-text">
                    {noteText}
                    {paymentStatus && !isPaid
                      ? ` (Trạng thái: ${paymentStatus})`
                      : ""}
                  </p>
                  <div className="payment-actions">
                    <button
                      className="btn primary"
                      type="button"
                      onClick={handlePayPalRedirect}
                      disabled={!approvalUrl || isSwitchingProvider}
                    >
                      {approvalUrl
                        ? "CONTINUE TO PAYPAL"
                        : isSwitchingProvider
                          ? "CREATING PAYPAL..."
                          : "WAITING FOR PAYPAL"}
                    </button>
                    <button
                      className="btn light"
                      type="button"
                      onClick={handleCancelOrder}
                      disabled={isCancelling}
                    >
                      {isCancelling ? "CANCELLING..." : "CANCEL ORDER"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="payment-grid">
                <div className="payment-qr">
                  <div className="qr-frame">
                    <div className="qr-box">
                      {qrCodeUrl ? (
                        <div className="qr-inner">
                          {qrCodeUrl.startsWith("data:image") &&
                          !qrImageError ? (
                            <img
                              src={qrCodeUrl}
                              alt="VietQR"
                              onError={() => setQrImageError(true)}
                            />
                          ) : (
                            <QRCodeCanvas
                              value={qrCodeUrl}
                              size={230}
                              includeMargin
                            />
                          )}
                        </div>
                      ) : (
                        <div className="qr-placeholder">
                          {orderSnapshot ? "▢▢" : "Đang tải..."}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="qr-meta">
                    <span>Mã đơn hàng</span>
                    <strong>
                      {displayOrderCode ? `#${displayOrderCode}` : "--"}
                    </strong>
                  </div>
                </div>

                <div className="payment-instructions">
                  <div className="payment-steps">
                    <div className="payment-step">
                      <span className="payment-step__index">01</span>
                      <span>Mở app ngân hàng và chọn quét mã QR.</span>
                    </div>
                    <div className="payment-step">
                      <span className="payment-step__index">02</span>
                      <span>
                        Quét mã VietQR bên cạnh và xác nhận thanh toán.
                      </span>
                    </div>
                    <div className="payment-step">
                      <span className="payment-step__index">03</span>
                      <span>Hệ thống tự kiểm tra trạng thái mỗi 3 giây.</span>
                    </div>
                  </div>
                  <div className="payment-countdown">
                    <span>Thời gian còn lại</span>
                    <strong>{formatCountdown(remainingSeconds)}</strong>
                  </div>

                  <div className="payment-amount">
                    {formatVnd(totals.totalWithVat)}
                  </div>
                  <p className="note-text">
                    {noteText}
                    {paymentStatus && !isPaid
                      ? ` (Trạng thái: ${paymentStatus})`
                      : ""}
                  </p>
                  <button
                    className="btn light"
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={isCancelling}
                  >
                    {isCancelling ? "CANCELLING..." : "CANCEL ORDER"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="panel panel--summary order-mini">
          <div className="panel-header">
            <h3>Order Summary</h3>
            <span className="panel-meta">{lines.length} items</span>
          </div>
          <div className="summary">
            <div className="summary-section">
              <div className="summary-section__title">Items</div>
              <div className="summary-items">
                {lines.map((line) => (
                  <div key={line.productId} className="summary-item">
                    <div className="summary-item__text">
                      <span className="summary-item__name">
                        {line.productName}
                      </span>
                      <span className="summary-item__qty">
                        Qty {line.quantity}
                      </span>
                    </div>
                    <span className="summary-item__price">
                      {(line.price * line.quantity).toLocaleString("vi-VN")} VND
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="summary-divider" />
            <div className="summary-section">
              <div className="summary-section__title">Charges</div>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatVnd(totals.subtotalAmount)}</span>
              </div>
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span>{formatVnd(totals.shippingFee)}</span>
              </div>
              <div className="summary-row">
                <span>VAT (10%)</span>
                <span>{formatVnd(totals.vatAmount)}</span>
              </div>
              <div
                className="summary-row"
                style={{
                  borderTop: "1px dashed #eee",
                  paddingTop: "8px",
                  marginTop: "8px",
                }}
              >
                <span>Total Products (Incl. VAT)</span>
                <span>
                  {formatVnd(totals.subtotalAmount + totals.vatAmount)}
                </span>
              </div>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span className="price">{formatVnd(totals.totalWithVat)}</span>
            </div>
            <button
              className="btn light"
              type="button"
              onClick={() => navigate("/cart")}
            >
              Thay đổi sản phẩm
            </button>
          </div>
        </aside>
      </div>

      {showSuccess && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2>PAYMENT SUCCESS</h2>
            <p>Thank you for your purchase!</p>
          </div>
        </div>
      )}

      {showFail && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2>Payment Failed</h2>
            <p>Thanh toán thất bại hoặc hết thời gian. Vui lòng thử lại.</p>
            <button
              className="btn primary"
              type="button"
              onClick={() => setShowFail(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default PaymentPage;

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./Checkout.css";
import orderService, { type Order } from "../services/orderService";
import { useToast } from "../context/ToastContext";

const OrderDetailPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setErrorMessage("Order id is missing.");
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);

    orderService
      .getOrder(orderId)
      .then((fetchedOrder) => {
        if (!active) return;
        setOrder(fetchedOrder);
        setErrorMessage(null);
      })
      .catch((error) => {
        if (!active) return;
        console.error("Failed to fetch order details:", error);
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to load order details.";
        setErrorMessage(message);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [orderId]);

  const normalizedStatus = order?.status?.toUpperCase();
  const canCancel =
    !!orderId &&
    !isCancelling &&
    normalizedStatus !== "CANCELLED" &&
    normalizedStatus !== "PAID";

  const itemsTotal = useMemo(() => {
    if (!order) return 0;
    return order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }, [order]);

  const subtotal = order?.subtotal ?? order?.totalBeforeVat ?? itemsTotal;
  const shippingFee = order?.shippingFee ?? 0;
  const total = order?.total ?? order?.totalWithVat ?? subtotal + shippingFee;

  const formatVnd = (value: number) =>
    `${Math.max(0, Math.round(value)).toLocaleString("vi-VN")} VND`;

  const handleCancelOrder = async () => {
    if (!orderId) {
      showToast("Missing order id.", "error");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to cancel this order? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsCancelling(true);
    try {
      const cancelledOrder = await orderService.cancelOrder(orderId);
      if (cancelledOrder) {
        setOrder(cancelledOrder);
      } else if (order) {
        setOrder({ ...order, status: "CANCELLED" });
      }
      showToast("Order cancelled successfully.", "success");
    } catch (error: any) {
      console.error("Failed to cancel order:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to cancel order.";
      showToast(message, "error");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <main className="checkout-shell">
        <div
          className="panel"
          style={{ textAlign: "center", maxWidth: 720, margin: "0 auto" }}
        >
          <p className="muted">Loading order details...</p>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="checkout-shell">
        <div
          className="panel"
          style={{ textAlign: "center", maxWidth: 720, margin: "0 auto" }}
        >
          <div style={{ fontSize: 54, color: "#ef4444" }}>!</div>
          <h1>Order Detail</h1>
          <p className="muted">{errorMessage}</p>
          <div style={{ marginTop: 24 }}>
            <Link className="btn primary" to="/home">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="checkout-shell">
        <div
          className="panel"
          style={{ textAlign: "center", maxWidth: 720, margin: "0 auto" }}
        >
          <h1>Order Detail</h1>
          <p className="muted">No order details found.</p>
          <div style={{ marginTop: 24 }}>
            <Link className="btn primary" to="/home">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-shell">
      <div className="checkout-topbar">
        <Link to="/home" className="back-link">
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
          Back to Home
        </Link>
      </div>
      <h1>Order Detail</h1>
      <div className="checkout-layout">
        <section className="panel">
          <div className="panel-header">
            <h3>Order Info</h3>
            <span className="panel-meta">
              {order.status ? order.status : "Pending"}
            </span>
          </div>
          <div className="summary-row">
            <span>Order ID</span>
            <span>#{order.id}</span>
          </div>
          {order.orderNumber && (
            <div className="summary-row">
              <span>Order Number</span>
              <span>{order.orderNumber}</span>
            </div>
          )}
          {order.createdAt && (
            <div className="summary-row">
              <span>Placed On</span>
              <span>{new Date(order.createdAt).toLocaleString()}</span>
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <h3>Delivery</h3>
            <p style={{ margin: "8px 0 4px" }}>{order.customerName}</p>
            <p className="muted" style={{ margin: "4px 0" }}>
              {order.addressLine}
            </p>
            <p className="muted" style={{ margin: "4px 0" }}>
              {order.city}, {order.province} {order.postalCode}
            </p>
            <p className="muted" style={{ margin: "4px 0" }}>
              Phone: {order.phone}
            </p>
            <p className="muted" style={{ margin: "4px 0" }}>
              Email: {order.customerEmail}
            </p>
          </div>

          <div style={{ marginTop: 24 }}>
            <h3>Items</h3>
            {order.items.map((item) => (
              <div key={item.productId} className="summary-row">
                <span>
                  {item.productTitle} x {item.quantity}
                </span>
                <span>{formatVnd(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </section>

        <aside className="panel panel--summary">
          <div className="panel-header">
            <h3>Summary</h3>
            <span className="panel-meta">{order.items.length} items</span>
          </div>
          <div className="summary">
            <div className="summary-section">
              <div className="summary-section__title">Charges</div>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatVnd(subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping Fee</span>
                <span>{formatVnd(shippingFee)}</span>
              </div>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span className="price">{formatVnd(total)}</span>
            </div>
            <button
              className="btn light"
              type="button"
              onClick={handleCancelOrder}
              disabled={!canCancel}
            >
              {isCancelling
                ? "CANCELLING..."
                : normalizedStatus === "CANCELLED"
                  ? "ORDER CANCELLED"
                  : normalizedStatus === "PAID"
                    ? "ORDER PAID"
                    : "CANCEL ORDER"}
            </button>
            <button
              className="btn primary"
              type="button"
              onClick={() => navigate("/home")}
            >
              Approve Order
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
};

export default OrderDetailPage;

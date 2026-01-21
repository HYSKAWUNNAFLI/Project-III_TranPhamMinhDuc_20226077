import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import paymentService from "../services/paymentService";
import orderService, { Order } from "../services/orderService";
import "./Checkout.css";

/**
 * Payment Success Page
 * Handles both PayPal callback and VietQR success
 */
const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const { clear } = useCart();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  const queryOrderId = searchParams.get("orderId");
  const paypalToken = searchParams.get("token"); // PayPal order ID
  const payerId = searchParams.get("PayerID");
  const storedPaymentId = localStorage.getItem("currentPaymentId");

  const formatVnd = (value: number | null | undefined) =>
    `${Math.max(0, Math.round(value ?? 0)).toLocaleString("vi-VN")} VND`;

  useEffect(() => {
    const processPayment = async () => {
      let currentOrderId = queryOrderId;
      let currentPaymentId = storedPaymentId;

      // If no orderId in query, check localStorage
      if (!currentOrderId) {
        currentOrderId = localStorage.getItem("currentOrderId");
      }

      if (!currentOrderId) {
        setError("No order found");
        setIsProcessing(false);
        return;
      }

      try {
        // If PayPal callback (has token and PayerID)
        if (paypalToken && payerId) {
          if (!currentPaymentId) {
            currentPaymentId = localStorage.getItem("currentPaymentId");
          }
          const captureId = currentPaymentId ? Number(currentPaymentId) : Number(currentOrderId);
          await paymentService.capturePayment(captureId, paypalToken);
        }
        // For VietQR or other methods that don't require capture on return,
        // we simply fetch the order details below.

        // Fetch order details
        const orderDetails = await orderService.getOrder(currentOrderId);
        setOrder(orderDetails);

        // Clear cart and local storage order id
        clear();
        localStorage.removeItem("currentOrderId");
        localStorage.removeItem("currentPaymentId");

      } catch (err) {
        console.error("Failed to process payment:", err);
        // Even if capture fails (or already captured), try to get order
        // If getting order fails, show error
        try {
          const orderDetails = await orderService.getOrder(currentOrderId);
          setOrder(orderDetails);
        } catch (e) {
          setError("Failed to retrieve order details.");
        }
      } finally {
        setIsProcessing(false);
      }
    };

    processPayment();
  }, [queryOrderId, paypalToken, payerId, clear]);

  if (error) {
    return (
      <main className="checkout-shell">
        <div
          className="panel"
          style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}
        >
          <div style={{ fontSize: 64, color: "#ef4444" }}>✗</div>
          <h1>Payment Failed or Error</h1>
          <p className="muted">{error}</p>
          <div style={{ marginTop: 24 }}>
            <Link className="btn primary" to="/cart">
              Return to Cart
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (isProcessing && !order) {
    return (
      <main className="checkout-shell">
        <div
          className="panel"
          style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}
        >
          <div style={{ fontSize: 64, color: "#10b981" }}>⏳</div>
          <h1>Processing...</h1>
          <p className="muted">Please wait while we confirm your order.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-shell">
      <div
        className="panel"
        style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}
      >
        <div style={{ fontSize: 64, color: "#10b981" }}>✓</div>
        <h1>Order Confirmed!</h1>
        <p className="muted">Thank you for your purchase.</p>

        {order && (
          <div style={{ textAlign: "left", marginTop: 24, borderTop: "1px solid #eee", paddingTop: 24 }}>
            <h3>Order #{order.id}</h3>
            <p><strong>Customer:</strong> {order.customerName}</p>
            <p><strong>Address:</strong> {order.addressLine}, {order.city}</p>

            <div style={{ marginTop: 16 }}>
              {order.items.map((item) => (
                <div key={item.productId} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span>{item.productTitle} x {item.quantity}</span>
                  <span>{formatVnd(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, borderTop: "1px solid #eee", paddingTop: 16, display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
              <span>Total</span>
              <span>{formatVnd(order.totalWithVat)}</span>
            </div>
          </div>
        )}

        <div style={{ marginTop: 32 }}>
          <Link className="btn primary" to="/products">
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
};

export default PaymentSuccessPage;

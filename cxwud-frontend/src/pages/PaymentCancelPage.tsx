import { Link } from "react-router-dom";
import "./Checkout.css";

/**
 * PayPal Cancel Callback Page
 * This page is shown when user cancels payment on PayPal
 * URL: /payment/cancel
 */
const PaymentCancelPage = () => {
  return (
    <main className="checkout-shell">
      <div
        className="panel"
        style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}
      >
        <div style={{ fontSize: 64, color: "#f59e0b" }}>⚠</div>
        <h1>Payment Cancelled</h1>
        <p className="muted">
          You cancelled the payment process. Your order has not been completed.
        </p>
        <p className="muted" style={{ marginTop: 12 }}>
          Your cart items are still saved. You can return to complete your
          purchase.
        </p>
        <div
          style={{
            marginTop: 24,
            display: "flex",
            gap: 12,
            justifyContent: "center",
          }}
        >
          <Link className="btn light" to="/cart">
            View Cart
          </Link>
          <Link className="btn primary" to="/checkout/payment">
            Try Payment Again
          </Link>
        </div>
      </div>
    </main>
  );
};

export default PaymentCancelPage;

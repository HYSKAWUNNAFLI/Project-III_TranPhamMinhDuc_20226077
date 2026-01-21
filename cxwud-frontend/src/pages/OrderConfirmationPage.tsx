import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Checkout.css";
import orderService, { type Order } from "../services/orderService";

const OrderConfirmationPage = () => {
  const location = useLocation() as { state?: { orderId?: number } };
  const orderId = location.state?.orderId;
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setIsLoading(false);
        return;
      }

      try {
        const fetchedOrder = await orderService.getOrder(orderId);
        setOrder(fetchedOrder);
      } catch (error) {
        console.error("Failed to fetch order:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (isLoading) {
    return (
      <main className="checkout-shell">
        <div
          className="panel"
          style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}
        >
          <p className="muted">Loading order details...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-shell">
      <div className="panel" style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 64, color: "#10b981" }}>✓</div>
          <h1>Order Confirmed</h1>
          <p className="muted">
            Thank you for your order! We've sent a confirmation email with order
            details.
          </p>
        </div>

        {order ? (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h3>Order Details</h3>
              <div className="summary-row">
                <span className="muted">Order ID:</span>
                <span>#{order.id}</span>
              </div>
              {order.orderNumber && (
                <div className="summary-row">
                  <span className="muted">Order Number:</span>
                  <span>{order.orderNumber}</span>
                </div>
              )}
              <div className="summary-row">
                <span className="muted">Status:</span>
                <span style={{ color: "#f59e0b", fontWeight: 600 }}>
                  {order.status || "Pending Processing"}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h3>Delivery Information</h3>
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
            </div>

            <div style={{ marginBottom: 16 }}>
              <h3>Order Items</h3>
              {order.items.map((item, index) => (
                <div key={index} className="summary-row">
                  <span>
                    {item.productTitle} x {item.quantity}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 16 }}>
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>${order.subtotal?.toFixed(2) || "0.00"}</span>
              </div>
              <div className="summary-row">
                <span>Shipping Fee:</span>
                <span>${order.shippingFee.toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>Total:</span>
                <span className="price">
                  ${order.total?.toFixed(2) || "0.00"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <p className="muted">Order ID: {orderId || "Unknown"}</p>
            <p className="muted">
              Transaction ID: TXN-{Math.floor(Math.random() * 1000000)}
            </p>
          </div>
        )}

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <Link className="btn primary" to="/products">
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
};

export default OrderConfirmationPage;

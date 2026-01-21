import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Checkout.css";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import type { DeliveryInfo } from "../types";
import orderService from "../services/orderService";
import cartService from "../services/cartService";

const DeliveryPage = () => {
  const navigate = useNavigate();
  const { subtotal, lines } = useCart();
  const { showToast } = useToast();
  const [form, setForm] = useState<DeliveryInfo>(() => {
    const saved = localStorage.getItem("deliveryInfo");
    const defaults = {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      note: "",
    };
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  const [deliveryFee, setDeliveryFee] = useState(15000); // Default fallback
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);

  useEffect(() => {
    localStorage.setItem("deliveryInfo", JSON.stringify(form));
  }, [form]);

  // Debounced fee calculation
  useEffect(() => {
    // Immediately set to calculating state when inputs change to disable button
    setIsCalculatingFee(true);

    const timer = setTimeout(async () => {
      if (form.city && form.state) {
        try {
          // Get cart session key for accurate weight calculation
          const sessionKey = cartService.getSessionKey();
          const fee = await orderService.calculateShippingFee({
            province: form.state,
            address: form.address,
            cartValue: subtotal,
            cartSessionKey: sessionKey, // Add this to get actual weight from cart
          });
          setDeliveryFee(fee);
        } catch (error) {
          console.error("Failed to calculate shipping fee:", error);
          // Keep default or show warning? Keeping default for now to not block flow.
        } finally {
          setIsCalculatingFee(false);
        }
      } else {
        // If not enough info to calculate, stop showing loading state
        setIsCalculatingFee(false);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [form.city, form.state, form.address, subtotal]);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const vatAmount = useMemo(() => subtotal * 0.1, [subtotal]);
  const total = subtotal + deliveryFee + vatAmount;

  const onContinue = async () => {
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      address: true,
      state: true,
    });

    if (
      !form.fullName ||
      !form.email ||
      !form.phone ||
      !form.address ||
      !form.state
    ) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    setIsCreatingOrder(true);
    setIsCalculatingFee(true);

    try {
      // Calculate shipping fee first
      const sessionKey = cartService.getSessionKey();
      const fee = await orderService.calculateShippingFee({
        province: form.state,
        address: form.address,
        cartValue: subtotal,
        cartSessionKey: sessionKey,
      });
      setDeliveryFee(fee);
      setIsCalculatingFee(false);

      // Get order action from localStorage
      // Check the order action from CartPage
      const orderAction = localStorage.getItem("orderAction") as
        | "CREATE_NEW"
        | "REUSE"
        | null;
      const currentOrderId = localStorage.getItem("currentOrderId");

      let order;

      if (orderAction === "REUSE" && currentOrderId) {
        // Update existing order delivery info
        console.log("Reusing existing order:", currentOrderId);
        order = await orderService.updateDeliveryInfo(currentOrderId, {
          customerEmail: form.email,
          customerName: form.fullName,
          phone: form.phone,
          addressLine: form.address,
          city: form.city,
          province: form.state,
          provider: "VIETQR",
          currency: "VND",
          successReturnUrl: `${window.location.origin}/payment/success`,
          cancelReturnUrl: `${window.location.origin}/payment/cancel`,
        });
      } else {
        // Create new order
        console.log("Creating new order");
        const createOrderPayload = {
          customerEmail: form.email,
          customerName: form.fullName,
          phone: form.phone,
          addressLine: form.address,
          city: form.city,
          province: form.state,
          postalCode: "00000",
          cartSessionKey: sessionKey,
          shippingFee: deliveryFee,
          items: lines.map((line) => ({
            productId: Number(line.productId),
            productTitle: line.productName,
            quantity: line.quantity,
            price: line.price,
          })),
          cancelReturnUrl: `${window.location.origin}/payment/cancel`,
          successReturnUrl: `${window.location.origin}/payment/success`,
          currency: "VND",
          provider: "VIETQR",
        };
        order = await orderService.createOrder(createOrderPayload);
      }

      // Save order ID to localStorage for payment success page
      const orderAny = order as any;
      const orderId = orderAny.id || orderAny.orderId;
      localStorage.setItem("currentOrderId", String(orderId));

      // Navigate to payment with order ID
      navigate("/checkout/payment", {
        state: {
          orderId: orderId,
          order, // Pass the full order object which contains paymentResult
          deliveryInfo: form,
          deliveryFee,
          total,
        },
      });
    } catch (error: any) {
      console.error("Failed to create order:", error);

      // Check if it's a duplicate order error (cart already checked out)
      const errorMessage =
        error?.response?.data?.message || error?.message || "";

      if (
        errorMessage.includes("already been used for an order") ||
        errorMessage.includes("already checked out")
      ) {
        showToast(
          "You have a pending order with this cart. Please complete or cancel your existing order before creating a new one.",
          "warning",
        );
      } else if (
        errorMessage.includes("out of stock") ||
        errorMessage.includes("Insufficient stock")
      ) {
        showToast(
          "Some items in your cart are out of stock. Please update your cart and try again.",
          "error",
        );
      } else {
        showToast("Failed to create order. Please try again.", "error");
      }
    } finally {
      setIsCreatingOrder(false);
    }
  };

  if (lines.length === 0) {
    return (
      <main className="checkout-shell">
        <div className="checkout-topbar">
          <Link to="/cart" className="back-link">
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
            Back to Cart
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
        <Link to="/cart" className="back-link">
          &lt; Back to Bag
        </Link>
      </div>

      <h1>Delivery Information</h1>
      <div className="checkout-layout">
        <section className="panel">
          <h3>Shipping Address</h3>
          <div className="input-group">
            <label>Full Name *</label>
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              onBlur={() => setTouched((prev) => ({ ...prev, fullName: true }))}
              placeholder="John Doe"
            />
            {touched.fullName && !form.fullName && (
              <span className="warning">Bắt buộc nhập</span>
            )}
          </div>
          <div className="input-group">
            <label>Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
              placeholder="customer@example.com"
            />
            {touched.email && !form.email && (
              <span className="warning">Bắt buộc nhập</span>
            )}
            {touched.email && form.email && (
              <span className="warning">
                Email không hợp lệ (ví dụ: user@example.com)
              </span>
            )}
          </div>
          <div className="input-group">
            <label>Phone Number *</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
              placeholder="(555) 123-4567"
            />
            {touched.phone && !form.phone && (
              <span className="warning">Bắt buộc nhập</span>
            )}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: 12,
            }}
          >
            <div className="input-group">
              <label>Detailed Address *</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, address: true }))
                }
                placeholder="123 Main St"
              />
              {touched.address && !form.address && (
                <span className="warning">Bắt buộc nhập</span>
              )}
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Province *</label>
              <input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                onBlur={() => setTouched((prev) => ({ ...prev, state: true }))}
                placeholder="Hà Nội, Hồ Chí Minh, Đà Nẵng..."
              />
              {touched.state && !form.state && (
                <span className="warning">Bắt buộc nhập</span>
              )}
            </div>
          </div>
        </section>

        <aside className="panel panel--summary">
          <div className="panel-header">
            <h3>Delivery Summary</h3>
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
                <span>{subtotal.toLocaleString("vi-VN")} VND</span>
              </div>
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span>
                  {isCalculatingFee
                    ? "Calculating..."
                    : `${deliveryFee.toLocaleString("vi-VN")} VND`}
                </span>
              </div>
              <div className="summary-row">
                <span>VAT (10%)</span>
                <span>{vatAmount.toLocaleString("vi-VN")} VND</span>
              </div>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span className="price">{total.toLocaleString("vi-VN")} VND</span>
            </div>
            <button
              className="btn primary block"
              type="button"
              onClick={onContinue}
              disabled={
                isCreatingOrder ||
                isCalculatingFee ||
                !form.fullName ||
                !form.email ||
                !form.phone ||
                !form.address ||
                !form.state
              }
            >
              {isCreatingOrder ? "CREATING ORDER..." : "CONTINUE TO PAYMENT"}
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
};

export default DeliveryPage;

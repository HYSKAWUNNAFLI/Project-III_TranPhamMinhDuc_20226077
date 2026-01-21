import { Link, useNavigate } from "react-router-dom";
import "./CartPage.css";
import { useCart } from "../context/CartContext";
import cartService from "../services/cartService";
import orderService from "../services/orderService";
import { useState } from "react";
import { useToast } from "../context/ToastContext";

const CartPage = () => {
  const { lines, updateQty, removeItem, subtotal } = useCart();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [validating, setValidating] = useState(false);
  const [stockErrors, setStockErrors] = useState<Record<number, number>>({}); // productId -> availableQty

  // Hàm xử lý khi ảnh bị lỗi (không load được)
  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    e.currentTarget.src = "https://placehold.co/100x100?text=No+Image";
    e.currentTarget.onerror = null;
  };

  const handleCheckout = async () => {
    setValidating(true);
    setStockErrors({});

    try {
      const sessionKey = cartService.getSessionKey();
      const validation = await cartService.validateStock(sessionKey);

      if (validation.valid) {
        // Call check-order-state API to determine if we should create new or reuse existing order
        const sessionKey = cartService.getSessionKey();
        const orderState = await orderService.checkOrderState(
          sessionKey,
          lines.map((line) => ({
            productId: Number(line.productId),
            productTitle: line.productName,
            quantity: line.quantity,
            price: line.price,
          })),
        );

        // Store the action and orderId for DeliveryPage to use
        localStorage.setItem("orderAction", orderState.action);
        if (orderState.orderId) {
          localStorage.setItem("currentOrderId", String(orderState.orderId));
        } else {
          localStorage.removeItem("currentOrderId");
        }

        navigate("/checkout/delivery");
      } else {
        const errors: Record<number, number> = {};
        let hasError = false;

        validation.stockItems.forEach((item) => {
          if (!item.isEnough) {
            errors[item.productId] = item.quantityAvailable;
            hasError = true;
          }
        });

        if (hasError) {
          setStockErrors(errors);
          showToast(
            "Some items in your cart exceed available stock. Please update quantities.",
            "error",
          );
        } else {
          // Should not happen if validation.valid is false but no items are invalid,
          // but just in case proceed or show generic error
          navigate("/checkout/delivery");
        }
      }
    } catch (error) {
      console.error("Stock validation failed:", error);
      showToast("Store is offline or unreachable. Please try again.", "error");
    } finally {
      setValidating(false);
    }
  };

  return (
    <main className="shopping-bag-page">
      <div className="shopping-bag-container">
        <header className="bag-header-section">
          <h1>SHOPPING CART</h1>
        </header>

        {lines.length === 0 ? (
          <div className="empty-bag">
            <p>YOUR BAG IS EMPTY</p>
            <Link className="btn-continue-shopping" to="/products">
              SHOP NOW
            </Link>
          </div>
        ) : (
          <div className="bag-content">
            <div className="bag-items">
              {lines.map((line) => {
                const availableQty = stockErrors[line.productId];
                const hasStockError = availableQty !== undefined;

                return (
                  <div
                    key={line.productId}
                    className="bag-item-row"
                    style={
                      hasStockError
                        ? {
                            border: "1px solid red",
                            padding: "10px",
                            borderRadius: "4px",
                          }
                        : {}
                    }
                  >
                    <div className="item-media">
                      <img
                        src={
                          line.imageUrl ||
                          "https://placehold.co/150x200?text=Product"
                        }
                        alt={line.productName}
                        onError={handleImageError}
                        loading="lazy"
                      />
                    </div>

                    <div className="item-info-col">
                      <h3 className="item-title">
                        <Link to={`/product/${line.productId}`}>
                          {line.productName}
                        </Link>
                      </h3>
                      <div className="item-price-display">
                        {line.price.toLocaleString("vi-VN")} VND
                      </div>

                      {/* Placeholder for size/color if available */}
                      <div className="item-variant">One Size</div>

                      {hasStockError && (
                        <div
                          style={{
                            color: "red",
                            marginTop: "8px",
                            fontWeight: "bold",
                          }}
                        >
                          ⚠️ Only {availableQty} left in stock!
                        </div>
                      )}

                      <button
                        className="link-remove"
                        onClick={() => removeItem(String(line.productId))}
                      >
                        REMOVE
                      </button>
                    </div>

                    <div className="item-actions-col">
                      <div className="qty-control-minimal">
                        <button
                          onClick={() =>
                            updateQty(String(line.productId), line.quantity - 1)
                          }
                        >
                          −
                        </button>
                        <span>{line.quantity}</span>
                        <button
                          onClick={() =>
                            updateQty(String(line.productId), line.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                      {hasStockError && (
                        <div style={{ marginTop: "5px" }}>
                          <button
                            className="btn-minimal-outline"
                            style={{ fontSize: "0.8rem", padding: "4px 8px" }}
                            onClick={() => {
                              updateQty(String(line.productId), availableQty);
                              // Clear error for this item locally
                              const newErrors = { ...stockErrors };
                              delete newErrors[line.productId];
                              setStockErrors(newErrors);
                            }}
                          >
                            Set to {availableQty}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Optional: Show Total for line item if desired, or keep minimal like image */}
                  </div>
                );
              })}
            </div>

            <div className="bag-footer">
              <div className="bag-summary-section">
                <div className="subtotal-display">
                  <span>SUBTOTAL:</span>
                  <span className="amount">
                    {subtotal.toLocaleString("vi-VN")} VND
                  </span>
                </div>

                <div className="bag-buttons-stack">
                  <Link to="/products" className="btn-minimal-outline">
                    CONTINUE SHOPPING
                  </Link>
                  <button
                    onClick={handleCheckout}
                    disabled={validating}
                    className="btn-minimal-solid"
                    style={{
                      width: "100%",
                      opacity: validating ? 0.7 : 1,
                      cursor: validating ? "not-allowed" : "pointer",
                    }}
                  >
                    {validating ? "CHECKING STOCK..." : "CHECKOUT"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default CartPage;

import { useEffect, useState, type FC } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProductById } from "../services/productService";
import type { Product } from "../types";
import "./ProductDetail.css";
import { useCart } from "../context/CartContext";
import BookDetail from "../components/product-details/BookDetail";
import CDDetail from "../components/product-details/CDDetail";
import DVDDetail from "../components/product-details/DVDDetail";
import NewspaperDetail from "../components/product-details/NewspaperDetail";

const ViewProductDetail: FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState<number>(1);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError("Missing product id");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await getProductById(id);
        if (res) {
          setProduct(res);
        } else {
          setError("Product not found");
        }
      } catch (err) {
        const message =
          (err as any)?.message || (typeof err === "string" ? err : null);
        setError(message || "Unable to load product.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const changeQty = (delta: number) => {
    setQty((current) => Math.max(1, Math.min(99, current + delta)));
  };

  const addToCart = () => {
    if (!product) return;
    addItem(product.id, qty);
    alert(`Added ${qty} of "${product.title}" to cart.`);
  };

  const navigateBack = () => navigate(-1);

  if (loading) {
    return (
      <div className="content">
        <p className="muted">Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="content">
        <p className="muted">{error || "Product not found"}</p>
        <button
          className="btn light"
          type="button"
          onClick={() => navigate("/products")}
        >
          Back to list
        </button>
      </div>
    );
  }

  // Determine which view to render based on category/type
  const category = (product.category || "").toLowerCase();

  if (category === "book") {
    return (
      <BookDetail
        product={product}
        addToCart={addToCart}
        navigateBack={navigateBack}
        qty={qty}
        changeQty={changeQty}
      />
    );
  }

  if (category === "dvd") {
    return (
      <DVDDetail
        product={product}
        addToCart={addToCart}
        navigateBack={navigateBack}
        qty={qty}
        changeQty={changeQty}
      />
    );
  }

  if (category === "cd") {
    return (
      <CDDetail
        product={product}
        addToCart={addToCart}
        navigateBack={navigateBack}
        qty={qty}
        changeQty={changeQty}
      />
    );
  }

  if (category === "newspaper") {
    return (
      <NewspaperDetail
        product={product}
        addToCart={addToCart}
        navigateBack={navigateBack}
        qty={qty}
        changeQty={changeQty}
      />
    );
  }

  // Fallback to original generic view if no category matches
  // Copied logic from original file but simplified for fallback
  const total = (product.price * qty).toFixed(2);
  const typeLabel = product.typeCode || product.category;

  return (
    <div className="content">
      <div className="back-row">
        <button className="back-link" type="button" onClick={navigateBack}>
          <span>Back to Products</span>
        </button>
      </div>
      <div className="product-shell">
        <div className="product__image-card">
          <img src={product.imageUrl} alt={product.title} />
        </div>
        <div className="product__info-card">
          <span className="pill">{typeLabel}</span>
          <h1 className="title">{product.title}</h1>
          <div className="price-main">${product.price}</div>
          <p className="desc muted">{product.shortDesc}</p>
          <div className="cart-card">
            <div className="cart-row">
              <div className="qty-control">
                <button onClick={() => changeQty(-1)}>-</button>
                <span>{qty}</span>
                <button onClick={() => changeQty(1)}>+</button>
              </div>
              <div className="total">Total: ${total}</div>
            </div>
            <button
              className="btn primary block cart-button"
              onClick={addToCart}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProductDetail;

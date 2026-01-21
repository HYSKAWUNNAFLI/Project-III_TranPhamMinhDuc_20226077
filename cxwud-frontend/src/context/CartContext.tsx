import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FC,
  type ReactNode,
} from "react";
import cartService, { type CartLine } from "../services/cartService";
import { getProductById } from "../services/productService";

type CartContextValue = {
  items: CartLine[];
  addItem: (productId: string, qty?: number) => Promise<void>;
  updateQty: (productId: string, qty: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clear: () => void;
  lines: CartLine[];
  subtotal: number;
  totalItems: number;
  isLoading: boolean;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

// Helper to fetch images for cart items
const enrichCartItems = async (items: CartLine[]): Promise<CartLine[]> => {
  if (!items || items.length === 0) return [];

  const promises = items.map(async (item) => {
    try {
      // Return item as-is if it already has a valid valid http image (unlikely given backend issue)
      if (item.imageUrl && item.imageUrl.startsWith("http")) return item;

      const product = await getProductById(String(item.productId));
      if (product && product.imageUrl) {
        return { ...item, imageUrl: product.imageUrl };
      }
      return item;
    } catch (err) {
      console.warn(`Failed to enrich item ${item.productId}`, err);
      return item;
    }
  });

  return Promise.all(promises);
};

export const CartProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cartSubtotal, setCartSubtotal] = useState(0);

  const sessionKey = cartService.getSessionKey();

  const refreshCart = async () => {
    setIsLoading(true);
    try {
      const cart = await cartService.getCart(sessionKey);
      if (cart && cart.items) {
        // Enrich items with images
        const enriched = await enrichCartItems(cart.items);
        setItems(enriched);
        setCartSubtotal(cart.totalBeforeVat || 0);
      } else {
        setItems([]);
        setCartSubtotal(0);
      }
    } catch (err) {
      console.error("Failed to refresh cart:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load cart from backend on mount
  useEffect(() => {
    refreshCart();
  }, [sessionKey]);

  const addItem = async (productId: string, qty = 1) => {
    try {
      const updatedCart = await cartService.addItem(sessionKey, {
        productId: Number(productId),
        quantity: qty,
      });

      if (updatedCart.items) {
        const enriched = await enrichCartItems(updatedCart.items);
        setItems(enriched);
        setCartSubtotal(updatedCart.totalBeforeVat || 0);
      }
    } catch (err) {
      console.error("Failed to add item to cart:", err);
    }
  };

  const updateQty = async (productId: string, qty: number) => {
    if (qty <= 0) {
      return removeItem(productId);
    }

    try {
      const updatedCart = await cartService.updateItem(sessionKey, {
        productId: Number(productId),
        quantity: qty,
      });

      if (updatedCart.items) {
        const enriched = await enrichCartItems(updatedCart.items);
        setItems(enriched);
        setCartSubtotal(updatedCart.totalBeforeVat || 0);
      }
    } catch (err) {
      console.error("Failed to update cart item:", err);
    }
  };

  const removeItem = async (productId: string) => {
    try {
      const cartItemId = Number(productId);
      await cartService.removeItem(sessionKey, cartItemId);

      // Update local state immediately
      setItems((prev) => prev.filter((i) => i.productId !== Number(productId)));

      // Refresh to ensure sync
      refreshCart();
    } catch (err) {
      console.error("Failed to remove cart item:", err);
    }
  };

  const clear = () => {
    setItems([]);
    setCartSubtotal(0);
    cartService.clearSessionKey();
  };

  // lines is just items now, ensuring compatibility
  const lines = items;

  const totalItems = useMemo(
    () => items.reduce((acc, line) => acc + line.quantity, 0),
    [items],
  );

  const value: CartContextValue = {
    items,
    addItem,
    updateQty,
    removeItem,
    clear,
    lines,
    subtotal: cartSubtotal,
    totalItems,
    isLoading,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

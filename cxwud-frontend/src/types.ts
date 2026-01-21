export type Category = "Book" | "CD" | "Newspaper" | "DVD";

export type ProductTypeCode = "BOOK" | "CD" | "NEWSPAPER" | "DVD";

export type ProductStatus = "ACTIVE" | "DEACTIVATED";

export type ProductDimensions = {
  height?: number;
  width?: number;
  length?: number;
  weight?: number;
};

export type Product = {
  id: string;
  title: string;
  category: Category;
  genre: string;
  price: number; // exclude VAT
  stock: number;
  imageUrl: string;
  shortDesc: string;
  typeCode?: ProductTypeCode;
  status?: ProductStatus;
  barcode?: string;
  categoryName?: string;
  conditionLabel?: string;
  dominantColor?: string;
  returnPolicy?: string;
  originalValue?: number;
  currentPrice?: number;
  dimensions?: ProductDimensions;
  attributes?: Record<string, unknown>;
  details?: Record<string, string | number>;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  size: number;
  total: number;
};

export type CartItem = {
  productId: string;
  qty: number;
};

export type DeliveryInfo = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  note?: string;
};

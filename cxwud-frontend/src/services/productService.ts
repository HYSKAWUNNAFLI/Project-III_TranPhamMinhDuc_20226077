import { apiClient } from "./api";

import type { Paginated, Product, Category, ProductStatus } from "../types";

const PRICE_DIVISOR = 1000;

// Backend response types
type BackendProductType = "BOOK" | "CD" | "NEWSPAPER" | "DVD";

type BackendAttributes = Record<string, unknown>;

type PriceRange = "0-200000" | "200000-500000" | "500000+";

type BackendProduct = {
  id: number;
  typeCode?: BackendProductType;
  productType?: BackendProductType;
  status: string;
  barcode: string;
  title: string;
  category: string;
  conditionLabel: string;
  dominantColor?: string;
  returnPolicy?: string;
  height?: number;
  width?: number;
  length?: number;
  weight?: number;
  originalValue?: number;
  currentPrice: number;
  stock: number;
  imageUrl?: string;
  attributes?: BackendAttributes;
  bookDetail?: {
    id: number;
    authors?: string;
    coverType?: string;
    publisher?: string;
    publishDate?: string;
    pageCount?: number;
    language?: string;
    genre?: string;
  };
  newspaperDetail?: {
    id: number;
    editorInChief?: string;
    publisher?: string;
    issueDate?: string; // legacy field
    publishDate?: string; // current API field
    issueNumber?: string;
    issn?: string;
    frequency?: string;
    sections?: string;
    language?: string;
    genre?: string;
  };
  cdDetail?: {
    id: number;
    artist?: string;
    recordLabel?: string;
    releaseDate?: string;
    trackCount?: number; // not present in current API, keep for compatibility
    tracks?: string; // comma-separated from backend
    tracksList?: string; // compatibility alias
    discType?: string; // not present in current API, default Unknown
    genre?: string;
  };
  dvdDetail?: {
    id: number;
    director?: string;
    studio?: string;
    releaseDate?: string;
    runtimeMinutes?: number;
    runtime?: number; // compatibility
    discType?: string;
    language?: string;
    subtitles?: string;
    genre?: string;
  };
};

type BackendResponse = {
  success?: boolean;
  message?: string;
  data: {
    items: BackendProduct[];
    page: number;
    size?: number;
    limit?: number;
    totalElements?: number;
    totalItems?: number;
    totalPages?: number;
    total?: number;
    count?: number;
  };
};

// Map backend product type to frontend Category
const typeToCategory: Record<BackendProductType, Category> = {
  BOOK: "Book",
  CD: "CD",
  NEWSPAPER: "Newspaper",
  DVD: "DVD",
};

const categoryToTypeCode: Record<Category, BackendProductType> = {
  Book: "BOOK",
  CD: "CD",
  Newspaper: "NEWSPAPER",
  DVD: "DVD",
};

const typeCodeValues: BackendProductType[] = ["BOOK", "CD", "NEWSPAPER", "DVD"];

const resolveTypeCode = (product: BackendProduct): BackendProductType => {
  const raw = String(
    product.typeCode ?? product.productType ?? "BOOK"
  ).toUpperCase();
  return typeCodeValues.includes(raw as BackendProductType)
    ? (raw as BackendProductType)
    : "BOOK";
};

const toStringValue = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
};

const toNumberValue = (value: unknown): number | undefined => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

const toStringList = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => toStringValue(item))
      .filter((item): item is string => Boolean(item));
    return parts.length ? parts.join(", ") : undefined;
  }
  return toStringValue(value);
};

const toTrackList = (value: unknown): { list?: string; count?: number } => {
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => {
        if (typeof item === "string" || typeof item === "number") {
          return String(item);
        }
        if (item && typeof item === "object") {
          const title = toStringValue((item as { title?: unknown }).title);
          const length = toStringValue((item as { length?: unknown }).length);
          if (title && length) return `${title} (${length})`;
          return title || length;
        }
        return undefined;
      })
      .filter((item): item is string => Boolean(item));
    return {
      list: parts.length ? parts.join(", ") : undefined,
      count: value.length,
    };
  }
  if (typeof value === "string") {
    const count = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean).length;
    return { list: value, count: count || undefined };
  }
  return {};
};

const getAttribute = (attributes: BackendAttributes | undefined, key: string) =>
  attributes ? attributes[key] : undefined;

// Map backend product to frontend Product model
function mapBackendProduct(p: BackendProduct): Product {
  const typeCode = resolveTypeCode(p);
  const category = typeToCategory[typeCode] || "Book";
  const attributes = p.attributes ?? {};

  const genre =
    toStringValue(getAttribute(attributes, "genre")) ||
    toStringList(getAttribute(attributes, "sections")) ||
    p.bookDetail?.genre ||
    p.cdDetail?.genre ||
    p.dvdDetail?.genre ||
    p.newspaperDetail?.genre ||
    p.category ||
    "General";

  const details: Record<string, string | number> = {};
  const setDetail = (key: string, value: string | number | undefined) => {
    if (value === undefined || value === null || value === "") return;
    details[key] = value;
  };

  if (Object.keys(attributes).length > 0) {
    if (typeCode === "BOOK") {
      setDetail("author", toStringValue(getAttribute(attributes, "authors")));
      setDetail(
        "coverType",
        toStringValue(getAttribute(attributes, "cover_type"))
      );
      setDetail(
        "publisher",
        toStringValue(getAttribute(attributes, "publisher"))
      );
      setDetail(
        "publishDate",
        toStringValue(getAttribute(attributes, "publish_date"))
      );
      setDetail("pages", toNumberValue(getAttribute(attributes, "page_count")));
      setDetail(
        "language",
        toStringValue(getAttribute(attributes, "language"))
      );
    } else if (typeCode === "NEWSPAPER") {
      setDetail(
        "editor",
        toStringValue(getAttribute(attributes, "editor_in_chief"))
      );
      setDetail(
        "publisher",
        toStringValue(getAttribute(attributes, "publisher"))
      );
      setDetail(
        "issueDate",
        toStringValue(getAttribute(attributes, "publish_date"))
      );
      setDetail(
        "issueNumber",
        toStringValue(getAttribute(attributes, "issue_number"))
      );
      setDetail(
        "frequency",
        toStringValue(getAttribute(attributes, "frequency"))
      );
      setDetail("sections", toStringList(getAttribute(attributes, "sections")));
      setDetail(
        "language",
        toStringValue(getAttribute(attributes, "language"))
      );
      setDetail("issn", toStringValue(getAttribute(attributes, "issn")));
    } else if (typeCode === "CD") {
      const tracks = toTrackList(getAttribute(attributes, "tracks"));
      setDetail("artist", toStringValue(getAttribute(attributes, "artists")));
      setDetail(
        "label",
        toStringValue(getAttribute(attributes, "record_label"))
      );
      setDetail("tracks", tracks.count);
      setDetail("trackList", tracks.list);
      setDetail(
        "discType",
        toStringValue(getAttribute(attributes, "disc_type"))
      );
      setDetail(
        "release",
        toStringValue(getAttribute(attributes, "release_date"))
      );
    } else if (typeCode === "DVD") {
      const runtime = toNumberValue(
        getAttribute(attributes, "runtime_minutes")
      );
      setDetail(
        "discType",
        toStringValue(getAttribute(attributes, "disc_type"))
      );
      setDetail(
        "director",
        toStringValue(getAttribute(attributes, "director"))
      );
      setDetail("runtime", runtime ? `${runtime} min` : undefined);
      setDetail("studio", toStringValue(getAttribute(attributes, "studio")));
      setDetail(
        "language",
        toStringValue(getAttribute(attributes, "language"))
      );
      setDetail(
        "subtitles",
        toStringList(getAttribute(attributes, "subtitles"))
      );
      setDetail(
        "release",
        toStringValue(getAttribute(attributes, "release_date"))
      );
    }
  } else if (p.bookDetail || p.cdDetail || p.dvdDetail || p.newspaperDetail) {
    if (p.bookDetail) {
      setDetail("author", p.bookDetail.authors || "Unknown");
      setDetail("publisher", p.bookDetail.publisher || "Unknown");
      setDetail("pages", p.bookDetail.pageCount || 0);
      setDetail("language", p.bookDetail.language || "Unknown");
      setDetail("publishDate", p.bookDetail.publishDate || "Unknown");
      setDetail("coverType", p.bookDetail.coverType || "Unknown");
    } else if (p.cdDetail) {
      const trackListString =
        p.cdDetail.tracksList || p.cdDetail.tracks || "Unknown";
      const trackCount =
        p.cdDetail.trackCount ||
        (p.cdDetail.tracks || "").split(",").filter((t) => t.trim()).length ||
        0;
      setDetail("artist", p.cdDetail.artist || "Unknown");
      setDetail("label", p.cdDetail.recordLabel || "Unknown");
      setDetail("tracks", trackCount);
      setDetail("trackList", trackListString);
      setDetail("discType", p.cdDetail.discType || "Unknown");
      setDetail("release", p.cdDetail.releaseDate || "Unknown");
      setDetail("genre", p.cdDetail.genre || genre);
    } else if (p.dvdDetail) {
      const runtime = p.dvdDetail.runtimeMinutes
        ? `${p.dvdDetail.runtimeMinutes} min`
        : p.dvdDetail.runtime
        ? `${p.dvdDetail.runtime} min`
        : "Unknown";
      setDetail("director", p.dvdDetail.director || "Unknown");
      setDetail("studio", p.dvdDetail.studio || "Unknown");
      setDetail("runtime", runtime);
      setDetail("discType", p.dvdDetail.discType || "Unknown");
      setDetail("language", p.dvdDetail.language || "Unknown");
      setDetail("subtitles", p.dvdDetail.subtitles || "Unknown");
      setDetail("release", p.dvdDetail.releaseDate || "Unknown");
      setDetail("genre", p.dvdDetail.genre || genre);
    } else if (p.newspaperDetail) {
      setDetail("editor", p.newspaperDetail.editorInChief || "Unknown");
      setDetail("publisher", p.newspaperDetail.publisher || "Unknown");
      setDetail(
        "issueDate",
        p.newspaperDetail.publishDate ||
          p.newspaperDetail.issueDate ||
          "Unknown"
      );
      setDetail("issueNumber", p.newspaperDetail.issueNumber || "Unknown");
      setDetail(
        "genre",
        p.newspaperDetail.genre || p.newspaperDetail.sections || genre
      );
      setDetail("issn", p.newspaperDetail.issn || "Unknown");
      setDetail("frequency", p.newspaperDetail.frequency || "Unknown");
      setDetail("sections", p.newspaperDetail.sections || "Unknown");
      setDetail("language", p.newspaperDetail.language || "Unknown");
    }
  }

  return {
    id: String(p.id),
    title: p.title,
    category,
    categoryName: p.category,
    genre,
    price: p.currentPrice / PRICE_DIVISOR,
    stock: p.stock,
    imageUrl:
      p.imageUrl ||
      `https://via.placeholder.com/400x300/${
        p.dominantColor?.toLowerCase().replace(/\s/g, "") || "cccccc"
      }/ffffff?text=${encodeURIComponent(p.title)}`,
    shortDesc:
      p.returnPolicy ||
      `${p.conditionLabel} condition, ${category.toLowerCase()} item`,
    typeCode,
    status: p.status as ProductStatus,
    barcode: p.barcode,
    conditionLabel: p.conditionLabel,
    dominantColor: p.dominantColor,
    returnPolicy: p.returnPolicy,
    originalValue: p.originalValue,
    currentPrice: p.currentPrice,
    dimensions: {
      height: p.height,
      width: p.width,
      length: p.length,
      weight: p.weight,
    },
    attributes,
    details,
  };
}

export type ListParams = {
  page?: number;
  limit?: number;
  size?: number; // kept for compatibility with previous API
  query?: string;
  search?: string; // alias for query
  categoryName?: string;
  category?: Category | "All";
  priceRange?: PriceRange;
  minPrice?: number;
  maxPrice?: number;
  priceMin?: number; // compatibility alias
  priceMax?: number; // compatibility alias
  typeCode?: BackendProductType;
  productType?: BackendProductType;
  sort?: "title" | "priceAsc" | "priceDesc";
};

function sortProducts(items: Product[], sort?: ListParams["sort"]): Product[] {
  if (!sort) return items;
  const sorted = [...items];
  switch (sort) {
    case "priceAsc":
      return sorted.sort((a, b) => a.price - b.price);
    case "priceDesc":
      return sorted.sort((a, b) => b.price - a.price);
    case "title":
    default:
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
  }
}

export async function listProducts(
  params: ListParams = {}
): Promise<Paginated<Product>> {
  try {
    // Convert 1-based page to 0-based for backend
    const backendPage = Math.max(0, (params.page ?? 1) - 1);
    const pageSize = params.size ?? params.limit ?? 10;
    const query = params.query ?? params.search;
    const minPrice = params.minPrice ?? params.priceMin;
    const maxPrice = params.maxPrice ?? params.priceMax;
    const priceRange = params.priceRange;
    const categoryFilter =
      params.category && params.category !== "All"
        ? params.category
        : undefined;
    const typeCode =
      params.typeCode ||
      params.productType ||
      (categoryFilter
        ? categoryToTypeCode[categoryFilter as Category]
        : undefined);
    const categoryName = params.categoryName?.trim() || undefined;

    const response = await apiClient.get<BackendResponse>("/products", {
      params: {
        page: backendPage,
        size: pageSize,
        query: query?.trim() || undefined,
        category: categoryName,
        priceRange,
        minPrice,
        maxPrice,
        typeCode,
      },
    });
    console.log(
      "[productService] Đã kết nối backend thành công:",
      response.status,
      response.config?.url || "/products",
      "(baseURL:",
      apiClient.defaults.baseURL,
      ")"
    );

    const payload = response.data as BackendResponse;
    const apiData =
      payload?.data ??
      ({
        items: [],
        page: backendPage,
        size: pageSize,
      } as BackendResponse["data"]);

    const mappedItems = sortProducts(
      (apiData.items || []).map(mapBackendProduct),
      params.sort
    );

    const pageFromApi =
      typeof apiData.page === "number" ? apiData.page : backendPage;
    const sizeFromApi = apiData.size ?? apiData.limit ?? pageSize;
    const totalFromApi =
      apiData.totalElements ??
      apiData.totalItems ??
      apiData.total ??
      apiData.count ??
      mappedItems.length;

    return {
      items: mappedItems,
      page: pageFromApi + 1, // Convert 0-based to 1-based for frontend
      size: sizeFromApi,
      total: totalFromApi,
    };
  } catch (err) {
    console.error("[productService] Lỗi kết nối backend:", err);
    throw err;
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const response = await apiClient.get<BackendResponse>(`/products/${id}`);
    // Backend returns single product wrapped in same response structure
    const apiData = response.data.data;

    // If data is an object (single product), map it
    if (apiData && !Array.isArray(apiData)) {
      return mapBackendProduct(apiData as any);
    }

    // If data has items array, get first item
    if (
      apiData &&
      Array.isArray((apiData as any).items) &&
      (apiData as any).items.length > 0
    ) {
      return mapBackendProduct((apiData as any).items[0]);
    }

    return null;
  } catch (err) {
    console.error("Failed to fetch product from API:", err);
    return null;
  }
}

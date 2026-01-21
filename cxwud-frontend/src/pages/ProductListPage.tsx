import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { listProducts } from "../services/productService";
import type { ListParams } from "../services/productService";
import type { Product } from "../types";
import {
  getAllProductTypes,
  type ProductType,
} from "../services/productTypeService";
import "./ProductListPage.css";

type SortKey = "title" | "price-asc" | "price-desc";
type PriceRange = NonNullable<ListParams["priceRange"]>;
type PriceBand = "all" | PriceRange;

const itemsPerPage = 12;

const priceRanges: Array<{ label: string; value: PriceBand }> = [
  { label: "All Prices", value: "all" },
  { label: "Under 200k", value: "0-200000" },
  { label: "200k - 500k", value: "200000-500000" },
  { label: "Over 500k", value: "500000+" },
];

function priceBandToRange(band: PriceBand): {
  minPrice?: number;
  maxPrice?: number;
} {
  if (!band || band === "all")
    return { minPrice: undefined, maxPrice: undefined };
  if (band.includes("-")) {
    const [a, b] = band.split("-");
    return {
      minPrice: Number(a) || undefined,
      maxPrice: Number(b) || undefined,
    };
  }
  if (band.endsWith("+")) {
    return {
      minPrice: Number(band.slice(0, -1)) || undefined,
      maxPrice: undefined,
    };
  }
  return { minPrice: undefined, maxPrice: undefined };
}

function sortKeyToParam(sort: SortKey): "title" | "priceAsc" | "priceDesc" {
  switch (sort) {
    case "price-asc":
      return "priceAsc";
    case "price-desc":
      return "priceDesc";
    default:
      return "title";
  }
}

function formatVnd(value?: number): string {
  if (value == null || isNaN(value)) return "";
  return `${value.toLocaleString("vi-VN")} VND`;
}

const ProductListPage = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("query") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(initialQuery);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [selectedTypeCode, setSelectedTypeCode] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("title");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(itemsPerPage);
  const [priceBand, setPriceBand] = useState<PriceBand>("all");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    const fetchProductTypes = async () => {
      try {
        const types = await getAllProductTypes();
        setProductTypes(types);
      } catch (err) {
        console.error("Failed to fetch product types:", err);
      }
    };
    fetchProductTypes();
  }, []);

  useEffect(() => {
    setSearch(initialQuery);
    setPage(1);
  }, [initialQuery]);

  useEffect(() => {
    const { minPrice, maxPrice } = priceBandToRange(priceBand);
    const priceRange: ListParams["priceRange"] =
      priceBand === "all" ? undefined : priceBand;
    setLoading(true);
    setError(null);

    listProducts({
      page,
      limit: pageSize,
      query: search.trim() || undefined,
      typeCode:
        selectedTypeCode === "all" ? undefined : (selectedTypeCode as any),
      priceRange,
      minPrice,
      maxPrice,
      sort: sortKeyToParam(sort),
    })
      .then((result) => {
        setProducts(result.items);
        setTotal(result.total);
        setPageSize(result.size || itemsPerPage);
        if (result.page !== page) setPage(result.page);
      })
      .catch((err) => {
        const message = (err as any)?.message || "Unable to load products.";
        setError(message);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [page, selectedTypeCode, search, priceBand, sort, pageSize]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleAddToCart = (item: Product) => {
    addItem(item.id, quantities[item.id] || 1);
  };

  return (
    <main className="landing products-page">
      <section className="products-hero minimalist">
        <div className="products-hero__content">
          <h1>CXWUD MEDIA</h1>

          <div className="filters-bar">
            <div className="filters-top">
              <div className="filter-group search-group">
                <input
                  type="text"
                  placeholder="SEARCH PRODUCTS..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <button
                type="button"
                className={`filter-toggle${filtersOpen ? " is-open" : ""}`}
                onClick={() => setFiltersOpen((prev) => !prev)}
                aria-expanded={filtersOpen}
                aria-controls="filters-panel"
              >
                <span>FILTERS</span>
                <svg
                  className="filter-toggle__icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 7h16M7 12h10M10 17h4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div
              id="filters-panel"
              className={`filter-panel${filtersOpen ? " is-open" : ""}`}
              aria-hidden={!filtersOpen}
            >
              <div className="filter-panel__inner">
                <div className="filter-row">
                  <div className="select-wrapper">
                    <select
                      value={selectedTypeCode}
                      onChange={(e) => {
                        setSelectedTypeCode(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="all">ALL TYPES</option>
                      {productTypes.map((type) => (
                        <option key={type.code} value={type.code}>
                          {type.code}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="select-wrapper">
                    <select
                      value={priceBand}
                      onChange={(e) => {
                        setPriceBand(e.target.value as PriceBand);
                        setPage(1);
                      }}
                    >
                      {priceRanges.map((range) => (
                        <option key={range.value} value={range.value}>
                          {range.label.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="select-wrapper">
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortKey)}
                    >
                      <option value="title">NAME: A-Z</option>
                      <option value="price-asc">PRICE: LOW TO HIGH</option>
                      <option value="price-desc">PRICE: HIGH TO LOW</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="products-listing">
        {loading && <div className="state-message">Đang tải dữ liệu...</div>}
        {!loading && error && (
          <div className="state-message error">{error}</div>
        )}
        {!loading && !error && products.length === 0 && (
          <div className="state-message">Không tìm thấy sản phẩm phù hợp.</div>
        )}

        {!loading && !error && (
          <div className="grid">
            {products.map((item) => {
              const typeLabel = item.typeCode || item.category;
              const priceLabel = formatVnd(item.currentPrice);
              const currentQty = quantities[item.id] || 1;

              return (
                <article key={item.id} className="card product-card">
                  <div className="product-card__media">
                    <img src={item.imageUrl} alt={item.title} loading="lazy" />
                    <span className="product-badge">{typeLabel}</span>
                    {item.stock < 5 && (
                      <span className="stock-warning">Sắp hết!</span>
                    )}
                  </div>

                  <div className="card__body product-card__body">
                    <h3>
                      <Link to={`/product/${item.id}`}>{item.title}</Link>
                    </h3>
                    <div className="product-meta">
                      <span className="price">
                        {priceLabel || `${item.price.toLocaleString()} VND`}
                      </span>
                      <span className="stock-info">stock: {item.stock}</span>
                    </div>

                    <div className="product-footer">
                      {/* Side-by-side: Quantity | Cart | View */}
                      <div className="qty-control">
                        <button
                          className="qty-btn qty-btn--down"
                          onClick={() =>
                            setQuantities((prev) => ({
                              ...prev,
                              [item.id]: Math.max(1, (prev[item.id] || 1) - 1),
                            }))
                          }
                          aria-label="Decrease quantity"
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M6 9l6 6 6-6"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <span>{currentQty}</span>
                        <button
                          className="qty-btn qty-btn--up"
                          onClick={() =>
                            setQuantities((prev) => ({
                              ...prev,
                              [item.id]: Math.min(
                                item.stock,
                                (prev[item.id] || 1) + 1,
                              ),
                            }))
                          }
                          aria-label="Increase quantity"
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M6 15l6-6 6 6"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>

                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-cart"
                          onClick={() => handleAddToCart(item)}
                          title="ADD TO CART"
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l1.68 10.06a2 2 0 0 0 2 1.69h7.72a2 2 0 0 0 2-1.69l.6-4.06H6" />
                          </svg>
                        </button>

                        <Link
                          to={`/product/${item.id}`}
                          className="btn-icon btn-view"
                          title="VIEW DETAILS"
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="pagination">
          <button
            className="btn light"
            disabled={loading || page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Trước
          </button>
          <span className="page-info">
            Trang {page} / {totalPages}
          </span>
          <button
            className="btn light"
            disabled={loading || page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Sau →
          </button>
        </div>
      </section>
    </main>
  );
};

export default ProductListPage;

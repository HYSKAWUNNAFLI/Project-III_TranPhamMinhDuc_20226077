import { FC } from 'react';
import type { Product } from '../../types';
import '../../pages/ProductDetailVariants.css';

interface BookDetailProps {
    product: Product;
    addToCart: () => void;
    navigateBack: () => void;
    qty: number;
    changeQty: (delta: number) => void;
}

const BookDetail: FC<BookDetailProps> = ({ product, addToCart, navigateBack, qty, changeQty }) => {
    const attrs = (product.attributes as any) || {};

    // Helper functions from original ViewProductDetail
    const formatVnd = (value?: number) => {
        if (value === null || value === undefined) return undefined;
        return `${value.toLocaleString("vi-VN")} VND`;
    };

    const formatDetailValue = (value: unknown): string => {
        if (value === null || value === undefined || value === "") return "N/A";
        if (Array.isArray(value)) {
            if (value.length === 0) return "N/A";
            return value
                .map((entry) => {
                    if (typeof entry === "string" || typeof entry === "number") {
                        return String(entry);
                    }
                    if (entry && typeof entry === "object") {
                        const title = (entry as { title?: unknown }).title;
                        const length = (entry as { length?: unknown }).length;
                        if (title && length) return `${title} (${length})`;
                        if (title) return String(title);
                        if (length) return String(length);
                        return JSON.stringify(entry);
                    }
                    return String(entry);
                })
                .join(", ");
        }
        if (typeof value === "object") {
            return JSON.stringify(value);
        }
        return String(value);
    };

    const formatAttributeLabel = (key: string) =>
        key
            .replace(/_/g, " ")
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .replace(/\b\w/g, (char) => char.toUpperCase());

    // Logic for rows
    const typeLabel = product.typeCode || product.category;
    const categoryLabel = product.categoryName || product.genre || product.category;
    const priceLabel = formatVnd(product.currentPrice);
    const originalPriceLabel = formatVnd(product.originalValue);

    const baseRows = [
        { label: "Type", value: typeLabel },
        { label: "Status", value: product.status },
        { label: "Barcode", value: product.barcode },
        { label: "Category", value: categoryLabel },
        { label: "Condition", value: product.conditionLabel },
        { label: "Return Policy", value: product.returnPolicy },
        { label: "Height", value: product.dimensions?.height },
        { label: "Width", value: product.dimensions?.width },
        { label: "Length", value: product.dimensions?.length },
        { label: "Weight", value: product.dimensions?.weight },
        { label: "Original Value", value: originalPriceLabel },
        { label: "Current Price", value: priceLabel },
    ].filter((row) => row.value !== undefined && row.value !== null && row.value !== "");

    const attributeRows =
        product.attributes && Object.keys(product.attributes).length > 0
            ? Object.entries(product.attributes)
                .filter(([, value]) => value !== undefined && value !== null && value !== "")
                .map(([key, value]) => ({
                    label: formatAttributeLabel(key),
                    value,
                }))
            : [];

    const legacyDetailRows =
        product.details && Object.keys(product.details).length > 0
            ? Object.entries(product.details).map(([key, value]) => ({
                label: formatAttributeLabel(key),
                value,
            }))
            : [];

    const detailRows = attributeRows.length > 0 ? attributeRows : legacyDetailRows;

    // Combine for rendering in single table if desired, or split. 
    // Original BookDetail had one "Product Specifications" table. We'll append detailRows to baseRows.
    const allRows = [...baseRows, ...detailRows];

    return (
        <div className="book-detail-container">
            <div className="book-layout">
                <div className="book-left-col">
                    <button onClick={navigateBack} className="back-button-library" style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: '20px', fontSize: '1rem' }}>
                        Back
                    </button>
                    <div className="book-cover-section">
                        <img src={product.imageUrl} alt={product.title} className="book-cover" />
                    </div>
                </div>

                <div className="book-info-section">
                    <span className="book-author">{attrs.authors || "Unknown Author"}</span>
                    <h1>{product.title}</h1>

                    <p className="book-summary" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                        {product.shortDesc}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d4af37' }}>
                            {product.price.toLocaleString("vi-VN").replace(/\./g, '.')}.000 VND
                        </div>
                        <div className="qty-control" style={{ display: 'flex', gap: '5px' }}>
                            <button onClick={() => changeQty(-1)}>-</button>
                            <span style={{ padding: '0 10px', fontWeight: 'bold' }}>{qty}</span>
                            <button onClick={() => changeQty(1)}>+</button>
                        </div>
                        <button className="variant-btn book-btn" onClick={addToCart}>Add to Cart</button>
                    </div>

                    <div className="book-specs-card">
                        <h3>Product Specifications</h3>
                        <table className="spec-table">
                            <tbody>
                                {allRows.map((row) => (
                                    <tr key={row.label}>
                                        <td>{row.label}</td>
                                        <td>{formatDetailValue(row.value)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookDetail;
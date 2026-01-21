import { FC } from 'react';
import type { Product } from '../../types';
import '../../pages/ProductDetailVariants.css';

interface DVDDetailProps {
    product: Product;
    addToCart: () => void;
    navigateBack: () => void;
    qty: number;
    changeQty: (delta: number) => void;
}

const DVDDetail: FC<DVDDetailProps> = ({ product, addToCart, navigateBack, qty, changeQty }) => {
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

    return (
        <div className="dvd-detail-container">
            <div
                className="dvd-backdrop"
                style={{ backgroundImage: `url(${product.imageUrl})` }}
            ></div>

            <div className="dvd-content">
                <div>
                    <button onClick={navigateBack} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', marginBottom: '20px' }}>Back</button>
                    <div className="dvd-poster-wrapper">
                        <img src={product.imageUrl} alt={product.title} className="dvd-poster" />
                    </div>
                </div>

                <div className="dvd-info">
                    <span className="dvd-tagline">{attrs.genre || product.genre || "Cinema"}</span>
                    <div className="dvd-header">
                        <h1>{product.title}</h1>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
                        <span className="dvd-spec-badge" style={{ border: '1px solid #fff', padding: '2px 8px' }}>{attrs.disc_type || "DVD"}</span>
                        <span className="dvd-spec-badge" style={{ border: '1px solid #fff', padding: '2px 8px' }}>{attrs.runtime || "N/A"}</span>
                    </div>

                    <div className="dvd-price-section" style={{ display: 'flex', alignItems: 'center', gap: '20px', margin: '30px 0' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{product.price.toLocaleString("vi-VN")}.000 VND</div>
                        <div className="qty-control" style={{ background: '#000', border: '1px solid #333', color: '#fff', display: 'flex' }}>
                            <button onClick={() => changeQty(-1)} style={{ background: 'none', color: '#fff', border: 'none', padding: '5px 10px' }}>-</button>
                            <span style={{ padding: '5px 10px' }}>{qty}</span>
                            <button onClick={() => changeQty(1)} style={{ background: 'none', color: '#fff', border: 'none', padding: '5px 10px' }}>+</button>
                        </div>
                        <button className="variant-btn dvd-btn" onClick={addToCart}>Add To Cart</button>
                    </div>

                    <div className="dvd-specs-grid">
                        <div className="dvd-spec-box">
                            <h4>Movie Details</h4>
                            <table className="dvd-table">
                                <tbody>
                                    {detailRows.length > 0 ? (
                                        detailRows.map((row) => (
                                            <tr key={row.label}>
                                                <td>{row.label}</td>
                                                <td>{formatDetailValue(row.value)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={2}>No details available</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="dvd-spec-box">
                            <h4>Product Specs</h4>
                            <table className="dvd-table">
                                <tbody>
                                    {baseRows.map((row) => (
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
        </div>
    );
};

export default DVDDetail;

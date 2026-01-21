import { FC } from 'react';
import type { Product } from '../../types';
import '../../pages/ProductDetailVariants.css';

interface CDDetailProps {
    product: Product;
    addToCart: () => void;
    navigateBack: () => void;
    qty: number;
    changeQty: (delta: number) => void;
}

const CDDetail: FC<CDDetailProps> = ({ product, addToCart, navigateBack, qty, changeQty }) => {
    const attrs = (product.attributes as any) || {};
    const tracklist = attrs.tracklist
        ? (Array.isArray(attrs.tracklist) ? attrs.tracklist : [attrs.tracklist])
        : [];

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
    const allRows = [...baseRows, ...detailRows];

    return (
        <div className="cd-detail-container">
            <div className="cd-container-inner">
                {/* PHẦN HÌNH ẢNH & ĐĨA */}
                <div className="cd-visual-column">
                    <button onClick={navigateBack} className="back-button">
                        Back
                    </button>

                    <div className="cd-visual-wrapper">
                        <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="cd-cover-art"
                        />
                        <div className="cd-disc">
                            <div className="cd-disc-center"></div>
                        </div>
                    </div>
                </div>

                {/* PHẦN THÔNG TIN CHI TIẾT */}
                <div className="cd-info">
                    <h2 className="cd-artist">{attrs.artists || "Unknown Artist"}</h2>
                    <h1 className="cd-title">{product.title}</h1>
                    <div className="cd-meta">
                        {attrs.record_label} &bull; {attrs.released_date}
                    </div>

                    <div className="cd-action-row">
                        <div className="cd-price">
                            {product.price.toLocaleString("vi-VN")}.000 VND
                        </div>
                        <div className="qty-control">
                            <button onClick={() => changeQty(-1)}>-</button>
                            <span>{qty}</span>
                            <button onClick={() => changeQty(1)}>+</button>
                        </div>
                        <button className="variant-btn cd-btn" onClick={addToCart}>
                            Add To Cart
                        </button>
                    </div>

                    <div className="cd-details-section">
                        <h3>Product Details</h3>
                        <table className="cd-table">
                            <tbody>
                                <tr><th>Attribute</th><th>Value</th></tr>
                                {allRows.map((row) => (
                                    <tr key={row.label}>
                                        <td>{row.label}</td>
                                        <td>{formatDetailValue(row.value)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {tracklist.length > 0 && (
                        <div className="cd-details-section">
                            <h3>Tracklist</h3>
                            <ul className="cd-tracklist">
                                {tracklist.map((t: string, i: number) => (
                                    <li key={i}>
                                        <span className="track-number">{i + 1}.</span>
                                        <span>{t}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CDDetail;
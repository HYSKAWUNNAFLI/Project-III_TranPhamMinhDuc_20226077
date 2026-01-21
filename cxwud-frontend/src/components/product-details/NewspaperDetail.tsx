import { FC } from 'react';
import type { Product } from '../../types';
import '../../pages/ProductDetailVariants.css';

interface NewspaperDetailProps {
    product: Product;
    addToCart: () => void;
    navigateBack: () => void;
    qty: number;
    changeQty: (delta: number) => void;
}

const NewspaperDetail: FC<NewspaperDetailProps> = ({ product, addToCart, navigateBack, qty, changeQty }) => {
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
        <div className="newspaper-detail-container">
            {/* Tờ báo chính */}
            <div className="newspaper-paper">

                {/* Header Báo cổ điển */}
                <header className="newspaper-header">
                    <div className="np-top-bar">
                        <button className="np-back-btn" onClick={navigateBack}>← BACK TO ARCHIVE</button>
                        <span>PRICE: {product.price.toLocaleString("vi-VN")}.000 VND</span>
                    </div>
                    <h1 className="np-headline">THE DAILY COLLECTOR</h1>
                    <div className="np-sub-header">
                        <span>VOL. XCIII... No. 365</span>
                        <span className="np-edition">PREMIUM EDITION</span>
                        <span>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}</span>
                    </div>
                </header>

                <div className="newspaper-grid">
                    {/* BÊN TRÁI: ẢNH SẢN PHẨM */}
                    <div className="np-left-column">
                        <div className="np-image-frame">
                            <img src={product.imageUrl} alt={product.title} className="np-image" />
                            <p className="np-caption">Fig. 1 — Original archival image of "{product.title}"</p>
                        </div>
                    </div>

                    {/* BÊN PHẢI: THÔNG TIN CHI TIẾT (BỌC TRONG BORDER) */}
                    <div className="np-right-column">
                        <div className="np-info-bordered-box">
                            <span className="np-label">{attrs.genre || product.genre || "FEATURED"}</span>
                            <h2 className="np-product-title">{product.title}</h2>

                            <div className="np-meta-row">
                                <span className="np-badge">{attrs.disc_type || "EDITION"}</span>
                                <span className="np-badge">{attrs.runtime || "N/A"}</span>
                            </div>

                            {/* Dòng hành động: Giá & Mua */}
                            <div className="np-action-section">
                                <div className="np-price-tag">{product.price.toLocaleString("vi-VN")}.000 VND</div>
                                <div className="np-controls">
                                    <div className="np-qty-box">
                                        <button onClick={() => changeQty(-1)}>-</button>
                                        <span>{qty}</span>
                                        <button onClick={() => changeQty(1)}>+</button>
                                    </div>
                                    <button className="np-add-btn" onClick={addToCart}>Add To Cart</button>
                                </div>
                            </div>

                            {/* Bảng thông số: Attribute (Trái) - Value (Phải) */}
                            <div className="np-specs-wrapper">
                                <div className="np-specs-block">
                                    <h3>ARTISTIC DETAILS</h3>
                                    <table className="np-data-table">
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

                                <div className="np-specs-block">
                                    <h3>PRODUCT ARCHIVE</h3>
                                    <table className="np-data-table">
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
            </div>
        </div>
    );
};

export default NewspaperDetail;
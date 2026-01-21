import React, { useEffect, useState } from "react";
import {
  listProducts,
  deleteProduct,
  bulkDeleteProducts,
  type ProductFilterRequest,
} from "../../services/pmService";
import { ProductFormModal } from "../../components/pm";
import { DeleteConfirmModal } from "../../components/admin";
import "./ProductManagement.css";

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<ProductFilterRequest>({
    page: 0,
    size: 20,
  });
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(
    new Set(),
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadProducts = async (filterParams: ProductFilterRequest = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listProducts({ ...filters, ...filterParams });
      console.log("Loaded products data:", data);

      // Handle different response structures
      if (data && data.items) {
        // Backend 200 OK structure: { items: [...], ... }
        setProducts(data.items || []);
        setTotalPages(data.totalPages || 1);
        setPage(data.currentPage || 0); // Adjust based on actual pagination fields if any
      } else if (data && data.content) {
        // Spring Page<T> structure
        setProducts(data.content || []);
        setTotalPages(data.totalPages || 0);
        setPage(data.number || 0);
      } else if (Array.isArray(data)) {
        // Direct array
        setProducts(data);
        setTotalPages(1);
        setPage(0);
      } else {
        console.warn("Unknown data structure:", data);
        setProducts([]);
      }
    } catch (err: any) {
      console.error("Error loading products:", err);
      setError(err.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value, page: 0 };
    setFilters(newFilters);
    loadProducts(newFilters);
  };

  const handlePageChange = (newPage: number) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    loadProducts(newFilters);
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    try {
      await deleteProduct(deletingProduct.id);
      setSuccess("Product deleted/deactivated successfully");
      setDeletingProduct(null);
      loadProducts(filters);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete product");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    if (selectedProducts.size > 10) {
      setError("You can only delete up to 10 products at once");
      return;
    }

    try {
      const response: any = await bulkDeleteProducts(
        Array.from(selectedProducts),
      );
      const bulkResult = response.success ? response.data : response;
      setSuccess(
        `Bulk delete completed: ${bulkResult.deletedCount || 0} deleted, ${bulkResult.deactivatedCount || 0} deactivated`,
      );
      setSelectedProducts(new Set());
      loadProducts(filters);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to bulk delete products");
    }
  };

  const toggleProductSelection = (productId: number) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  };

  const handleFormSuccess = () => {
    setShowCreateModal(false);
    setEditingProduct(null);
    loadProducts(filters);
    setSuccess("Product saved successfully");
  };

  return (
    <div className="product-management">
      <div className="page-header">
        <div>
          <h1>Product Management</h1>
          <p className="page-description">
            Manage products: Books, CDs, DVDs, Newspapers
          </p>
        </div>
        <div className="header-actions">
          {selectedProducts.size > 0 && (
            <button
              className="btn-danger"
              onClick={handleBulkDelete}
              disabled={selectedProducts.size > 10}
            >
              🗑️ Delete Selected ({selectedProducts.size})
            </button>
          )}
          <button
            className="btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            + Add New Product
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      {selectedProducts.size > 10 && (
        <div className="alert alert-warning">
          You can only delete up to 10 products at once. Please deselect some
          products.
        </div>
      )}

      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search by title..."
          value={filters.query || ""}
          onChange={(e) => handleFilterChange("query", e.target.value)}
          className="filter-input"
        />
        <select
          value={filters.typeCode || ""}
          onChange={(e) => handleFilterChange("typeCode", e.target.value)}
          className="filter-select"
        >
          <option value="">All Types</option>
          <option value="BOOK">Books</option>
          <option value="CD">CDs</option>
          <option value="DVD">DVDs</option>
          <option value="NEWSPAPER">Newspapers</option>
        </select>
        <select
          value={filters.status || ""}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <button
          className="btn-filter-reset"
          onClick={() => {
            setFilters({ page: 0, size: 20 });
            loadProducts({ page: 0, size: 20 });
          }}
        >
          Reset Filters
        </button>
      </div>

      <div className="products-grid">
        {loading ? (
          <div className="loading-spinner">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <p>No products found</p>
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-select">
                <input
                  type="checkbox"
                  checked={selectedProducts.has(product.id)}
                  onChange={() => toggleProductSelection(product.id)}
                />
              </div>
              {product.imageUrl && (
                <div className="product-image">
                  <img src={product.imageUrl} alt={product.title} />
                </div>
              )}
              <div className="product-details">
                <h3 className="product-title">{product.title}</h3>
                <div className="product-meta">
                  <span className="product-type">{product.typeCode}</span>
                  <span
                    className={`product - status status - ${product.status?.toLowerCase()} `}
                  >
                    {product.status}
                  </span>
                </div>
                <div className="product-info">
                  <p>
                    <strong>Category:</strong> {product.category}
                  </p>
                  <p>
                    <strong>Price:</strong> ₫
                    {product.currentPrice?.toLocaleString()}
                  </p>
                  <p>
                    <strong>Stock:</strong> {product.stock}
                  </p>
                  <p>
                    <strong>Barcode:</strong> {product.barcode}
                  </p>
                </div>
                <div className="product-actions">
                  <button
                    className="btn-icon btn-edit"
                    onClick={() => setEditingProduct(product)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => setDeletingProduct(product)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn-pagination"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 0}
          >
            ← Previous
          </button>
          <span className="page-info">
            Page {page + 1} of {totalPages}
          </span>
          <button
            className="btn-pagination"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages - 1}
          >
            Next →
          </button>
        </div>
      )}

      {showCreateModal && (
        <ProductFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleFormSuccess}
        />
      )}

      {editingProduct && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSuccess={handleFormSuccess}
        />
      )}

      {deletingProduct && (
        <DeleteConfirmModal
          title="Delete Product"
          message={`Are you sure you want to delete "${deletingProduct.title}" ? ${
            deletingProduct.stock > 0
              ? "This product has stock > 0, so it will be deactivated instead of deleted."
              : "This action cannot be undone."
          } `}
          onConfirm={handleDelete}
          onCancel={() => setDeletingProduct(null)}
        />
      )}
    </div>
  );
};

export default ProductManagement;

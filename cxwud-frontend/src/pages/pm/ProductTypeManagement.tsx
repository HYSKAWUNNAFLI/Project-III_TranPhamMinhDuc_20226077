import React, { useEffect, useState } from "react";
import {
  getAllProductTypes,
  deleteProductType,
  type ProductType,
} from "../../services/productTypeService";
import ProductTypeFormModal from "../../components/pm/ProductTypeFormModal";
import "./ProductTypeManagement.css";

const ProductTypeManagement: React.FC = () => {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedType, setExpandedType] = useState<string | null>(null);

  useEffect(() => {
    fetchProductTypes();
  }, []);

  const fetchProductTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllProductTypes();
      setProductTypes(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load product types");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the product type "${code}"? This will affect all products using this type.`,
      )
    ) {
      return;
    }

    try {
      await deleteProductType(code);
      setProductTypes(productTypes.filter((type) => type.code !== code));
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete product type");
    }
  };

  const handleFormSuccess = () => {
    setShowCreateModal(false);
    fetchProductTypes();
  };

  const toggleExpanded = (code: string) => {
    setExpandedType(expandedType === code ? null : code);
  };

  if (loading) {
    return (
      <div className="content">
        <p>Loading product types...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content">
        <p className="error">{error}</p>
        <button onClick={fetchProductTypes} className="btn primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="page-header">
        <h1>Product Type Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn primary"
        >
          + Create New Type
        </button>
      </div>

      {productTypes.length === 0 ? (
        <div className="empty-state">
          <p>
            No product types found. Create your first product type to get
            started.
          </p>
        </div>
      ) : (
        <div className="product-types-list">
          {productTypes.map((type) => (
            <div key={type.code} className="product-type-card">
              <div className="type-header">
                <div className="type-info">
                  <h3>{type.code}</h3>
                  <span className="attribute-count">
                    {type.attributes.length} attribute
                    {type.attributes.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="type-actions">
                  <button
                    onClick={() => toggleExpanded(type.code)}
                    className="btn light"
                  >
                    {expandedType === type.code ? "Hide" : "Show"} Attributes
                  </button>
                  <button
                    onClick={() => handleDelete(type.code)}
                    className="btn danger"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {expandedType === type.code && (
                <div className="attributes-section">
                  <h4>Attributes</h4>
                  <div className="attributes-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Key</th>
                          <th>Label</th>
                          <th>Data Type</th>
                          <th>Required</th>
                        </tr>
                      </thead>
                      <tbody>
                        {type.attributes.map((attr) => (
                          <tr key={attr.id}>
                            <td>
                              <code>{attr.key}</code>
                            </td>
                            <td>{attr.label}</td>
                            <td>
                              <span className="data-type-badge">
                                {attr.dataType}
                              </span>
                            </td>
                            <td>
                              {attr.isRequired ? (
                                <span className="badge required">Yes</span>
                              ) : (
                                <span className="badge optional">No</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <ProductTypeFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default ProductTypeManagement;

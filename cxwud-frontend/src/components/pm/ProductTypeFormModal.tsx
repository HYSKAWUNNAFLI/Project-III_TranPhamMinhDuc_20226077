import React, { useState } from "react";
import {
  createProductType,
  type TypeAttributeRequest,
  type CreateProductTypeRequest,
} from "../../services/productTypeService";
import "../admin/UserFormModal.css";
import "./ProductTypeFormModal.css";

interface ProductTypeFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ProductTypeFormModal: React.FC<ProductTypeFormModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [code, setCode] = useState("");
  const [attributes, setAttributes] = useState<TypeAttributeRequest[]>([
    {
      key: "",
      label: "",
      dataType: "string",
      isRequired: false,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addAttributeField = () => {
    setAttributes([
      ...attributes,
      {
        key: "",
        label: "",
        dataType: "string",
        isRequired: false,
      },
    ]);
  };

  const removeAttributeField = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const updateAttribute = (
    index: number,
    field: keyof TypeAttributeRequest,
    value: any,
  ) => {
    const updated = [...attributes];
    updated[index] = { ...updated[index], [field]: value };
    setAttributes(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError("Product type code is required");
      return;
    }

    if (!/^[A-Z_]+$/.test(code)) {
      setError("Code must contain only uppercase letters and underscores");
      return;
    }

    if (attributes.length === 0) {
      setError("At least one attribute is required");
      return;
    }

    for (const attr of attributes) {
      if (!attr.key.trim() || !attr.label.trim()) {
        setError("All attributes must have a key and label");
        return;
      }
      if (!/^[a-z_]+$/.test(attr.key)) {
        setError(
          `Attribute key "${attr.key}" must contain only lowercase letters and underscores`,
        );
        return;
      }
    }

    setLoading(true);
    try {
      const request: CreateProductTypeRequest = {
        code: code.toUpperCase(),
        attributes,
      };

      await createProductType(request);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create product type");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-large"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Create New Product Type</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-sections">
            <div className="form-section">
              <h3 className="section-title">Type Information</h3>

              <div className="form-group">
                <label>Type Code *</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g., ELECTRONICS, CLOTHING"
                  required
                  disabled={loading}
                />
                <small className="form-help">
                  Uppercase letters and underscores only (e.g., NEW_TYPE)
                </small>
              </div>
            </div>

            <div className="form-section">
              <div className="section-header">
                <h3 className="section-title">Attributes</h3>
                <button
                  type="button"
                  className="btn light"
                  onClick={addAttributeField}
                  disabled={loading}
                >
                  + Add Attribute
                </button>
              </div>

              {attributes.map((attr, index) => (
                <div key={index} className="attribute-group">
                  <div className="attribute-row">
                    <div className="form-group">
                      <label>Key *</label>
                      <input
                        type="text"
                        value={attr.key}
                        onChange={(e) =>
                          updateAttribute(
                            index,
                            "key",
                            e.target.value.toLowerCase(),
                          )
                        }
                        placeholder="e.g., screen_size"
                        required
                        disabled={loading}
                      />
                      <small className="form-help">
                        Lowercase letters and underscores only
                      </small>
                    </div>

                    <div className="form-group">
                      <label>Label *</label>
                      <input
                        type="text"
                        value={attr.label}
                        onChange={(e) =>
                          updateAttribute(index, "label", e.target.value)
                        }
                        placeholder="e.g., Screen Size"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label>Data Type *</label>
                      <select
                        value={attr.dataType}
                        onChange={(e) =>
                          updateAttribute(index, "dataType", e.target.value)
                        }
                        required
                        disabled={loading}
                      >
                        <option value="string">String</option>
                        <option value="integer">Integer</option>
                        <option value="date">Date</option>
                        <option value="array">Array</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={attr.isRequired}
                          onChange={(e) =>
                            updateAttribute(
                              index,
                              "isRequired",
                              e.target.checked,
                            )
                          }
                          disabled={loading}
                        />
                        Required
                      </label>
                    </div>

                    {attributes.length > 1 && (
                      <button
                        type="button"
                        className="btn danger"
                        onClick={() => removeAttributeField(index)}
                        disabled={loading}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn light"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? "Creating..." : "Create Product Type"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductTypeFormModal;

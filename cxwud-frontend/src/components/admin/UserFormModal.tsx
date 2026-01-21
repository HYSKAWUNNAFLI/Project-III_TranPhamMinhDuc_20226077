import React, { useState } from 'react';
import { createUser, updateUser, updateUserRoles, type User } from '../../services/adminService';
import './UserFormModal.css';

interface UserFormModalProps {
    user?: User;
    onClose: () => void;
    onSuccess: () => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ user, onClose, onSuccess }) => {
    const [formData, setFormData] = useState<{
        email: string;
        password: string;
        status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
        roles: string[];
    }>({
        email: user?.email || '',
        password: '',
        status: (user?.status as "ACTIVE" | "INACTIVE" | "SUSPENDED") || 'ACTIVE',
        roles: user?.roles || [],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRoleToggle = (role: string) => {
        setFormData((prev) => ({
            ...prev,
            roles: prev.roles.includes(role)
                ? prev.roles.filter((r) => r !== role)
                : [...prev.roles, role],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (user) {
                // Check if core details (email, status) have changed
                const isCoreDetailsChanged =
                    formData.email !== user.email ||
                    formData.status !== user.status ||
                    !!formData.password;

                if (isCoreDetailsChanged) {
                    // Backend constraint: UserRequest requires 'password' @NotBlank
                    if (!formData.password) {
                        setError('Due to system security, you must enter the password to update Email or Status.');
                        setLoading(false);
                        return;
                    }

                    const updateData = {
                        email: formData.email,
                        status: formData.status as any,
                        password: formData.password
                    };

                    console.log("Updating user details:", updateData);
                    await updateUser(user.id, updateData);
                }

                // Update roles separately if needed (or always to be safe)
                const isRolesChanged = JSON.stringify(formData.roles.sort()) !== JSON.stringify(user.roles.sort());
                if (isRolesChanged || isCoreDetailsChanged) {
                    console.log("Updating user roles:", formData.roles);
                    await updateUserRoles(user.id, formData.roles);
                }
            } else {
                // Create new user
                if (!formData.password) {
                    setError('Password is required for new users');
                    setLoading(false);
                    return;
                }

                const createData = {
                    email: formData.email,
                    password: formData.password,
                    status: formData.status as any,
                    roles: formData.roles,
                };

                console.log("Creating user with data:", createData);
                await createUser(createData);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || `Failed to ${user ? 'update' : 'create'} user`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{user ? 'Edit User' : 'Create New User'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        ×
                    </button>
                </div>

                {error && <div className="modal-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email *</label>
                        <input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            disabled={!!user}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">
                            Password {!user && '*'}
                            {user && <span className="field-hint">(leave blank to keep current)</span>}
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required={!user}
                            minLength={6}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="status">Status *</label>
                        <select
                            id="status"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as "ACTIVE" | "INACTIVE" | "SUSPENDED" })}
                            required
                        >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="SUSPENDED">Suspended</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Roles *</label>
                        <div className="checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.roles.includes('ADMIN')}
                                    onChange={() => handleRoleToggle('ADMIN')}
                                />
                                <span>Administrator</span>
                            </label>
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.roles.includes('PRODUCT_MANAGER')}
                                    onChange={() => handleRoleToggle('PRODUCT_MANAGER')}
                                />
                                <span>Product Manager</span>
                            </label>
                        </div>
                        {formData.roles.length === 0 && (
                            <p className="field-error">At least one role must be selected</p>
                        )}
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading || formData.roles.length === 0}
                        >
                            {loading ? 'Saving...' : user ? 'Update User' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserFormModal;

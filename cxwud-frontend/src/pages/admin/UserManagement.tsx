import React, { useEffect, useState } from 'react';
import { listUsers, deleteUser, lockUser, unlockUser, type User } from '../../services/adminService';
import { UserFormModal, DeleteConfirmModal } from '../../components/admin';
import './UserManagement.css';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadUsers = async (pageNum: number = 0) => {
        setLoading(true);
        setError(null);
        try {
            const response: any = await listUsers(pageNum, 20);
            console.log("Loaded users data:", response);

            // Handle different response structures
            if (response && response.items) {
                // Backend 200 OK structure: { items: [...], ... }
                setUsers(response.items || []);
                setTotalPages(response.totalPages || 1);
                setPage(pageNum);
            } else if (response && response.content) {
                // Spring Page<T> structure
                setUsers(response.content || []);
                setTotalPages(response.totalPages || 0);
                setPage(pageNum);
            } else if (Array.isArray(response)) {
                // Direct array
                setUsers(response);
                setTotalPages(1);
                setPage(0);
            } else {
                console.warn("Unknown user response structure:", response);
                setUsers([]);
            }
        } catch (err: any) {
            console.error("Error loading users:", err);
            setError(err.response?.data?.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleDelete = async () => {
        if (!deletingUser) return;
        try {
            await deleteUser(deletingUser.id);
            setDeletingUser(null);
            loadUsers(page);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete user');
        }
    };

    const handleLockToggle = async (user: User) => {
        try {
            if (user.status === 'ACTIVE') {
                await lockUser(user.id);
            } else {
                await unlockUser(user.id);
            }
            loadUsers(page);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update user status');
        }
    };

    const handleFormSuccess = () => {
        setShowCreateModal(false);
        setEditingUser(null);
        loadUsers(page);
    };

    return (
        <div className="user-management">
            <div className="page-header">
                <div>
                    <h1>User Management</h1>
                    <p className="page-description">Manage system users, roles, and permissions</p>
                </div>
                <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                    + Create New User
                </button>
            </div>

            {error && (
                <div className="alert alert-error">
                    {error}
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            <div className="users-table-container">
                {loading ? (
                    <div className="loading-spinner">Loading users...</div>
                ) : (
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Roles</th>
                                <th>Created At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td className="email-cell">{user.email}</td>
                                    <td>
                                        <span className={`status-badge status-${user.status?.toLowerCase()}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="roles-cell">
                                            {user.roles?.map((role) => (
                                                <span key={role} className="role-tag">
                                                    {role}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="btn-icon btn-edit"
                                                onClick={() => setEditingUser(user)}
                                                title="Edit user"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className={`btn-icon ${user.status === 'ACTIVE' ? 'btn-lock' : 'btn-unlock'}`}
                                                onClick={() => handleLockToggle(user)}
                                                title={user.status === 'ACTIVE' ? 'Lock user' : 'Unlock user'}
                                            >
                                                {user.status === 'ACTIVE' ? '🔒' : '🔓'}
                                            </button>
                                            <button
                                                className="btn-icon btn-delete"
                                                onClick={() => setDeletingUser(user)}
                                                title="Delete user"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {!loading && users.length === 0 && (
                    <div className="empty-state">
                        <p>No users found</p>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="btn-pagination"
                        onClick={() => loadUsers(page - 1)}
                        disabled={page === 0}
                    >
                        ← Previous
                    </button>
                    <span className="page-info">
                        Page {page + 1} of {totalPages}
                    </span>
                    <button
                        className="btn-pagination"
                        onClick={() => loadUsers(page + 1)}
                        disabled={page >= totalPages - 1}
                    >
                        Next →
                    </button>
                </div>
            )}

            {showCreateModal && (
                <UserFormModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleFormSuccess}
                />
            )}

            {editingUser && (
                <UserFormModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSuccess={handleFormSuccess}
                />
            )}

            {deletingUser && (
                <DeleteConfirmModal
                    title="Delete User"
                    message={`Are you sure you want to delete user "${deletingUser.email}"? This action cannot be undone.`}
                    onConfirm={handleDelete}
                    onCancel={() => setDeletingUser(null)}
                />
            )}
        </div>
    );
};

export default UserManagement;

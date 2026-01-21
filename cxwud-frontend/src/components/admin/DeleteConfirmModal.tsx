import React from 'react';
import './DeleteConfirmModal.css';

interface DeleteConfirmModalProps {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    title,
    message,
    onConfirm,
    onCancel,
}) => {
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-icon">⚠️</div>
                <h2>{title}</h2>
                <p>{message}</p>
                <div className="confirm-actions">
                    <button className="btn-cancel" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="btn-confirm-delete" onClick={onConfirm}>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;

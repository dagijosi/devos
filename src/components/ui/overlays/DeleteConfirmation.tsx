import React from 'react';
import Modal from './Modal';
import Button from '../forms/Button';
import { FaExclamationTriangle } from 'react-icons/fa';

interface DeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  isLoading?: boolean;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  itemName,
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={onConfirm} 
            isLoading={isLoading}
          >
            Delete
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <FaExclamationTriangle className="text-red-500" size={20} />
          </div>
          <div className="flex-1">
            <p className="text-theme-text/80">
              {message}
            </p>
            {itemName && (
              <p className="mt-2 text-sm font-medium text-theme-text">
                Item: <span className="text-theme-icon">{itemName}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmation;

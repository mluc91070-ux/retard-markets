import { useEffect } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning'
}: ConfirmModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getTypeColor = () => {
    switch (type) {
      case 'danger':
        return '#ff0000';
      case 'warning':
        return '#ffff00';
      case 'info':
        return '#00ff00';
      default:
        return '#ffff00';
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-black border-4 max-w-md w-full p-6" style={{ borderColor: getTypeColor() }}>
        {/* Title */}
        <h2 className="text-2xl font-bold font-mono mb-4" style={{ color: getTypeColor() }}>
          {title}
        </h2>

        {/* Message */}
        <p className="text-white font-mono mb-6 whitespace-pre-line">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 bg-black text-white border-4 border-white px-6 py-3 font-mono font-bold hover:bg-white hover:text-black transition-colors whitespace-nowrap cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 bg-black border-4 px-6 py-3 font-mono font-bold transition-colors whitespace-nowrap cursor-pointer"
            style={{ 
              borderColor: getTypeColor(),
              color: getTypeColor()
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = getTypeColor();
              e.currentTarget.style.color = '#000000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#000000';
              e.currentTarget.style.color = getTypeColor();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

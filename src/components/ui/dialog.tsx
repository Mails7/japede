import React from 'react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({ 
  isOpen, 
  onClose, 
  children, 
  title,
  className = '' 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className={`relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 ${className}`}>
        {/* Header */}
        {title && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        )}
        
        {/* Content */}
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export const DialogTrigger: React.FC<{ children: React.ReactNode; onClick: () => void }> = ({ 
  children, 
  onClick 
}) => {
  return (
    <button onClick={onClick} className="inline-flex items-center justify-center">
      {children}
    </button>
  );
};

export const DialogContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const DialogHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="mb-4">{children}</div>;
};

export const DialogTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <h3 className="text-lg font-semibold">{children}</h3>;
};

export const DialogDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <p className="text-sm text-gray-600 mt-1">{children}</p>;
};

export const DialogFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="flex justify-end space-x-2 mt-4">{children}</div>;
}; 
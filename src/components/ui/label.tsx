import React from 'react';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  className?: string;
}

export const Label: React.FC<LabelProps> = ({ className = '', ...props }) => (
  <label className={`block text-sm font-medium text-gray-700 ${className}`} {...props} />
);

export default Label; 
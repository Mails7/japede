import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
}

export const Select: React.FC<SelectProps> = ({ className = '', children, ...props }) => (
  <select className={`border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary ${className}`} {...props}>
    {children}
  </select>
);

export const SelectTrigger: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

export const SelectValue: React.FC<{ placeholder?: string; children?: React.ReactNode }> = ({ placeholder, children }) => (
  <span>{children || placeholder}</span>
);

export const SelectContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

export const SelectItem: React.FC<React.OptionHTMLAttributes<HTMLOptionElement>> = ({ children, ...props }) => (
  <option {...props}>{children}</option>
);

export default Select; 
'use client';

import React from 'react';

const PrimaryButton = ({ 
  children, 
  onClick, 
  type = 'button', 
  disabled = false, 
  className = '', 
  size = 'md',
  fullWidth = false,
  ...props 
}) => {
  const baseClasses = 'btn';
  
  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg'
  };
  
  const widthClass = fullWidth ? 'w-100' : '';
  
  const buttonClasses = `${baseClasses} ${sizeClasses[size]} ${widthClass} ${className}`.trim();

  const buttonStyle = {
    backgroundColor: '#0f01ff',
    borderColor: '#0f01ff',
    color: 'white',
    height: '48px',
    padding: '0 1rem',
    borderRadius: '2px',
    fontSize: '1rem',
    fontWeight: '600',
    border: 'none',
    transition: 'all 0.3s ease',
    ...(disabled && {
      backgroundColor: '#6c757d',
      borderColor: '#6c757d',
      opacity: 0.65
    })
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      style={buttonStyle}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;

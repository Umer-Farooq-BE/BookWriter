'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary', 
  message = '',
  className = '' 
}) => {
  const sizeClass = styles[size] || styles.medium;
  const colorClass = styles[color] || styles.primary;

  return (
    <div className={`${styles.container} ${className}`}>
      <Icon 
        icon="ph:spinner" 
        className={`${styles.spinner} ${sizeClass} ${colorClass}`}
      />
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

export default LoadingSpinner;

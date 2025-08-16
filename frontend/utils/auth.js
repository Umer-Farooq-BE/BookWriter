import { STORAGE_KEYS } from '../constants/storage';

/**
 * Authentication utility functions
 */

/**
 * Set user authentication data
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {string} userId - User ID (optional)
 */
export const setUserAuth = (email, name, userId = null) => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);
  localStorage.setItem(STORAGE_KEYS.USER_NAME, name);
  
  if (userId) {
    localStorage.setItem('userId', userId);
  }
  
  // Trigger auth status change event
  window.dispatchEvent(new Event('authStatusChanged'));
};

/**
 * Clear user authentication data
 */
export const clearUserAuth = () => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
  localStorage.removeItem(STORAGE_KEYS.USER_NAME);
  localStorage.removeItem('userId');
  
  // Trigger auth status change event
  window.dispatchEvent(new Event('authStatusChanged'));
};

/**
 * Check if user is authenticated
 * @returns {boolean} - Whether user is authenticated
 */
export const isUserAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  
  const email = localStorage.getItem(STORAGE_KEYS.USER_EMAIL);
  const name = localStorage.getItem(STORAGE_KEYS.USER_NAME);
  
  return !!(email && name);
};

/**
 * Get current user data
 * @returns {object} - User data object
 */
export const getCurrentUser = () => {
  if (typeof window === 'undefined') return { email: null, name: null, userId: null };
  
  return {
    email: localStorage.getItem(STORAGE_KEYS.USER_EMAIL),
    name: localStorage.getItem(STORAGE_KEYS.USER_NAME),
    userId: localStorage.getItem('userId')
  };
};

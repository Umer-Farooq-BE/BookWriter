import { useState, useEffect } from 'react';
import { Icon } from "@iconify/react";
import styles from './UserMenu.module.css';
import { STORAGE_KEYS } from '../../../constants/storage';

const UserMenu = ({ className }) => {
  const [userData, setUserData] = useState({ email: null, name: null });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem(STORAGE_KEYS.USER_EMAIL);
    const name = localStorage.getItem(STORAGE_KEYS.USER_NAME);
    setUserData({ email, name });
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.user-menu-wrapper')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
    localStorage.removeItem(STORAGE_KEYS.USER_NAME);
    setUserData({ email: null, name: null });
    window.location.href = '/';
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className={`user-menu-wrapper ${className}`}>
      <button
        className={styles.userAvatar}
        onClick={() => setIsDropdownOpen(prev => !prev)}
        aria-label="User menu"
        aria-expanded={isDropdownOpen}
      >
        <div className={styles.avatarContainer}>
          <div className={styles.avatarCircle}>
            {getInitials(userData.name)}
          </div>
        </div>
        <div className={styles.userInfo}>
          <div className={styles.name}>{userData.name || 'User'}</div>
          <div className={styles.plan}>Free</div>
        </div>
      </button>

      {isDropdownOpen && (
        <div className={styles.dropdown}>
          <button 
            className={styles.dropdownItem} 
            onClick={() => console.log('Settings clicked')}
            aria-label="Open settings"
          >
            <Icon icon="ph:gear-bold" aria-hidden="true" /> Settings
          </button>
          <button 
            className={`${styles.dropdownItem} ${styles.logoutItem}`} 
            onClick={handleLogout}
            aria-label="Logout"
          >
            <Icon icon="ph:sign-out" aria-hidden="true" /> Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;

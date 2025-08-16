'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import logo from '../../../public/assets/logo.png';
import './Header.css';

const Header = () => {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [userData, setUserData] = useState({ email: null, name: null });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const email = localStorage.getItem('userEmail');
    const name = localStorage.getItem('userName');
    setUserData({ email, name });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDrawerOpen && !event.target.closest('.dropdown') && !event.target.closest('.mobile-drawer')) {
        setIsDrawerOpen(false);
      }
    };

    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isDrawerOpen]);

  const isActive = (path) => {
    return pathname === path;
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    setUserData({ email: null, name: null });
    window.location.href = '/';
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="bg-white shadow-sm border-bottom">
      <nav className="navbar navbar-light">
        <div className="container">
          {/* Logo and Brand */}
          <Link href="/" className="navbar-brand">
            <Image 
              src={logo} 
              alt="Book Writer Pro" 
              width={140} 
              height={45}
              priority
            />
          </Link>

          {/* User Actions */}
            <div className="d-flex gap-2 align-items-end">
              {isClient && (
                <>
                  {userData.email && userData.name ? (
                    <div className="dropdown">
                      <button 
                        className="btn btn-link avatar-button"
                        type="button"
                        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                        aria-expanded={isDrawerOpen}
                      >
                        <div className="avatar-circle">
                          <span className="avatar-text">{getInitials(userData.name)}</span>
                        </div>
                      </button>
                      {isDrawerOpen && (
                        <div className="mobile-drawer">
                          <div className="drawer-header">
                            <div className="user-info">
                              <div className="avatar-circle">
                                <span className="avatar-text">{getInitials(userData.name)}</span>
                              </div>
                              <div className="user-details">
                                <p className="user-name">{userData.name}</p>
                                <p className="user-email">{userData.email}</p>
                              </div>
                            </div>
                          </div>
                          <div className="drawer-content">
                            <Link href="/" className={`drawer-link ${isActive('/') ? 'active' : ''}`}>
                              Home
                            </Link>
                            <Link href="/books" className={`drawer-link ${isActive('/books') ? 'active' : ''}`}>
                              My Books
                            </Link>
                            <button className="drawer-link text-danger" onClick={handleLogout}>
                              Logout
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <Link 
                        href="/signup" 
                        className="btn btn-primary signupButton"
                      >
                        Sign Up
                      </Link>
                      <Link 
                        href="/login" 
                        className="btn btn-outline-primary loginButton"
                      >
                        Sign In
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
      </nav>
    </header>
  );
};

export default Header;

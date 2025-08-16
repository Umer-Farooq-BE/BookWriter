'use client';

import React, { useState } from 'react';
import './PasswordField.css';

const PasswordField = ({ label, name, register, errors, placeholder, value, onChange, id }) => {
  const [isVisible, setIsVisible] = useState(false);
  const inputId = id || name;
  const hasError = errors && name && errors[name];

  return (
    <div className="input-field-container password-field-container">
      <label className="input-label" htmlFor={inputId}>
        {label}
      </label>
      <div className="password-input-wrapper">
        <input
          id={inputId}
          type={isVisible ? 'text' : 'password'}
          name={name}
          placeholder={placeholder}
          {...(register ? register(name) : {})}
          value={value !== undefined ? value : undefined}
          onChange={onChange}
          className={`input-field ${hasError ? 'input-error' : ''} has-toggle`}
        />
        <button
          type="button"
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          className="password-toggle"
          onClick={() => setIsVisible((v) => !v)}
        >
          {isVisible ? (
            // Eye-off icon
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10.58 10.58C10.21 11 10 11.48 10 12C10 13.1 10.9 14 12 14C12.52 14 13 13.79 13.42 13.42M9.9 5.05C10.58 4.87 11.28 4.77 12 4.77C16.5 4.77 20.27 7.54 21.5 12C21.16 13.2 20.61 14.29 19.9 15.22M6.11 6.11C4.45 7.25 3.13 8.93 2.5 12C3.73 16.46 7.5 19.23 12 19.23C13.64 19.23 15.17 18.86 16.54 18.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            // Eye icon
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M1 12C2.73 7.61 7 4.77 12 4.77C17 4.77 21.27 7.61 23 12C21.27 16.39 17 19.23 12 19.23C7 19.23 2.73 16.39 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 12C15 13.66 13.66 15 12 15C10.34 15 9 13.66 9 12C9 10.34 10.34 9 12 9C13.66 9 15 10.34 15 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>
      {hasError && (
        <p className="error-message">{errors[name]?.message}</p>
      )}
    </div>
  );
};

export default PasswordField;

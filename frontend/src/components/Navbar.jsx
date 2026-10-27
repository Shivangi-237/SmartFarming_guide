import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { lang, toggleLanguage, t } = useLanguage();
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src="/leaf.svg"
            alt="Leaf Logo"
            style={{ width: '34px', height: '34px', filter: 'drop-shadow(0 2px 4px rgba(16,185,129,0.3))' }}
          />
          <span style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #065f46, #10b981)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>
            {t.appTitle}
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px'
        }}>
          <Link
            to="/"
            style={{
              fontWeight: isActive('/') ? '600' : '500',
              color: isActive('/') ? 'var(--primary)' : 'var(--text-muted)',
              transition: 'color 0.2s ease'
            }}
          >
            {t.navHome}
          </Link>
          <Link
            to="/weather"
            style={{
              fontWeight: isActive('/weather') ? '600' : '500',
              color: isActive('/weather') ? 'var(--primary)' : 'var(--text-muted)',
              transition: 'color 0.2s ease'
            }}
          >
            {t.navWeather}
          </Link>
          <Link
            to="/tips"
            style={{
              fontWeight: isActive('/tips') ? '600' : '500',
              color: isActive('/tips') ? 'var(--primary)' : 'var(--text-muted)',
              transition: 'color 0.2s ease'
            }}
          >
            {t.navTips}
          </Link>

          {/* Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            title="Switch Language (English / हिंदी)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: '600',
              color: 'var(--text-main)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <i className="fa-solid fa-language" style={{ color: 'var(--primary)', fontSize: '1rem' }}></i>
            {lang === 'en' ? 'English (EN)' : 'हिंदी (HI)'}
          </button>

          {/* Authentication Badge */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: 'var(--primary-dark)',
                background: 'var(--primary-light)',
                padding: '4px 12px',
                borderRadius: '16px'
              }}>
                <i className="fa-solid fa-user-check" style={{ marginRight: '6px' }}></i>
                {user.username}
              </span>
              <button
                onClick={logout}
                style={{
                  fontSize: '0.85rem',
                  color: '#ef4444',
                  background: 'transparent',
                  fontWeight: '600'
                }}
              >
                {t.navLogout}
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn-primary"
              style={{ padding: '7px 18px', fontSize: '0.88rem' }}
            >
              <i className="fa-solid fa-right-to-bracket"></i>
              {t.navLogin}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar() {
  const { lang, toggleLanguage, t } = useLanguage();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
      boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)'
    }}>
      <div style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand Logo & Name */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
          }}>
            <img
              src="/leaf.svg"
              alt="Smart Farming Guide Logo"
              style={{ width: '24px', height: '24px' }}
            />
          </div>
          <div>
            <span style={{
              fontSize: '1.25rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.025em',
              display: 'block',
              lineHeight: '1.2'
            }}>
              Smart Farming Guide
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {lang === 'hi' ? 'एआई कृषि मंच' : 'AI Agricultural Platform'}
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Link
            to="/"
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              fontWeight: isActive('/') ? '700' : '500',
              color: isActive('/') ? '#059669' : '#475569',
              background: isActive('/') ? '#ecfdf5' : 'transparent',
              fontSize: '0.92rem',
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fa-solid fa-house" style={{ marginRight: '6px', fontSize: '0.85rem' }}></i>
            {t.navHome}
          </Link>

          <Link
            to="/weather"
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              fontWeight: isActive('/weather') ? '700' : '500',
              color: isActive('/weather') ? '#0284c7' : '#475569',
              background: isActive('/weather') ? '#f0f9ff' : 'transparent',
              fontSize: '0.92rem',
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fa-solid fa-cloud-sun-rain" style={{ marginRight: '6px', fontSize: '0.85rem' }}></i>
            {t.navWeather}
          </Link>

          <Link
            to="/tips"
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              fontWeight: isActive('/tips') ? '700' : '500',
              color: isActive('/tips') ? '#d97706' : '#475569',
              background: isActive('/tips') ? '#fffbeb' : 'transparent',
              fontSize: '0.92rem',
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fa-solid fa-lightbulb" style={{ marginRight: '6px', fontSize: '0.85rem' }}></i>
            {t.navTips}
          </Link>

          {/* Bilingual Language Switcher Pill */}
          <button
            onClick={toggleLanguage}
            title="Toggle Language (English / हिंदी)"
            style={{
              marginLeft: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '20px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: '700',
              color: '#065f46',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}
          >
            <i className="fa-solid fa-globe" style={{ color: '#10b981' }}></i>
            {lang === 'en' ? 'EN | हिंदी' : 'हिंदी | EN'}
          </button>
        </nav>
      </div>
    </header>
  );
}

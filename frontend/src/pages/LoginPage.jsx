import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError('');

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '60px auto', padding: '0 20px' }}>
      <div className="glass-card" style={{ padding: '36px 28px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            fontSize: '1.6rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <i className="fa-solid fa-lock"></i>
          </div>
          <h2 style={{ fontSize: '1.7rem', color: '#064e3b' }}>
            {lang === 'hi' ? 'किसान खाता लॉगिन' : 'Farmer Portal Login'}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {lang === 'hi' ? 'अपने खाते में सुरक्षित लॉगिन करें' : 'Sign in to access personalized farming insights'}
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            color: '#b91c1c',
            fontSize: '0.88rem',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="fa-solid fa-circle-exclamation"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              {lang === 'hi' ? 'उपयोगकर्ता नाम (Username)' : 'Username'}
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. shivangi"
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              {lang === 'hi' ? 'पासवर्ड' : 'Password'}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '1rem', marginTop: '8px' }}
          >
            {loading ? (
              <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', margin: 0 }}></div>
            ) : (
              <>
                <i className="fa-solid fa-arrow-right-to-bracket"></i>
                {lang === 'hi' ? 'लॉगिन करें' : 'Sign In'}
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: '#64748b' }}>
          {lang === 'hi' ? 'नया खाता बनाना चाहते हैं?' : "Don't have an account yet?"}{' '}
          <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: '600' }}>
            {lang === 'hi' ? 'साइन अप करें' : 'Create Account'}
          </Link>
        </div>
      </div>
    </div>
  );
}

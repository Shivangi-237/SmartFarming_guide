import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function SignupPage() {
  const { signup } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password || !email) return;
    if (password !== confirmPassword) {
      setError(lang === 'hi' ? 'पासवर्ड मेल नहीं खाते हैं।' : 'Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await signup(username, password, email);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '50px auto', padding: '0 20px' }}>
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
            <i className="fa-solid fa-user-plus"></i>
          </div>
          <h2 style={{ fontSize: '1.7rem', color: '#064e3b' }}>
            {lang === 'hi' ? 'नया किसान खाता बनाएं' : 'Create Farmer Account'}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {lang === 'hi' ? 'स्मार्ट कृषि मंच से जुड़ें' : 'Join the digital smart farming community'}
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
              {lang === 'hi' ? 'ईमेल पता' : 'Email Address'}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
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

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              {lang === 'hi' ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'}
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
                <i className="fa-solid fa-user-plus"></i>
                {lang === 'hi' ? 'खाता बनाएं' : 'Create Account'}
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: '#64748b' }}>
          {lang === 'hi' ? 'पहले से खाता है?' : 'Already have an account?'}{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>
            {lang === 'hi' ? 'लॉगिन करें' : 'Sign In'}
          </Link>
        </div>
      </div>
    </div>
  );
}

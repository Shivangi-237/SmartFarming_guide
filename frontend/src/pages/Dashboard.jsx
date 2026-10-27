import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import DiseaseModal from '../components/DiseaseModal';
import SeedModal from '../components/SeedModal';

export default function Dashboard() {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [diseaseModalOpen, setDiseaseModalOpen] = useState(false);
  const [seedModalOpen, setSeedModalOpen] = useState(false);

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        position: 'relative',
        padding: '80px 24px 60px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(248, 250, 252, 0) 100%)'
      }}>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--primary-light)',
            color: 'var(--primary-dark)',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '0.88rem',
            fontWeight: '600',
            marginBottom: '20px'
          }}>
            🌱 {lang === 'hi' ? 'आधुनिक स्मार्ट कृषि मंच' : 'Next-Gen Smart Agriculture Platform'}
          </span>

          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.25rem)',
            color: '#064e3b',
            lineHeight: '1.2',
            marginBottom: '16px',
            fontWeight: '800'
          }}>
            {t.heroTitle}
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: 'var(--text-muted)',
            lineHeight: '1.6',
            marginBottom: '32px'
          }}>
            {t.heroSubtitle}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                const el = document.getElementById('features-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-primary"
              style={{ padding: '12px 28px', fontSize: '1rem' }}
            >
              <i className="fa-solid fa-compass"></i>
              {t.exploreBtn}
            </button>
            <button
              onClick={() => navigate('/weather')}
              className="btn-secondary"
              style={{ padding: '12px 26px', fontSize: '1rem' }}
            >
              <i className="fa-solid fa-cloud-sun-rain" style={{ color: '#10b981', marginRight: '6px' }}></i>
              {t.navWeather}
            </button>
          </div>
        </div>
      </section>

      {/* 4 Feature Action Cards */}
      <section id="features-section" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
          gap: '24px'
        }}>
          {/* Card 1: Disease Detection */}
          <div className="glass-card" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#ecfdf5',
              color: '#10b981',
              fontSize: '1.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <i className="fa-solid fa-leaf"></i>
            </div>
            <h3 style={{ fontSize: '1.35rem', color: '#064e3b', marginBottom: '10px' }}>
              {t.cardDiseaseTitle}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', flex: 1, marginBottom: '24px' }}>
              {t.cardDiseaseDesc}
            </p>
            <button
              onClick={() => setDiseaseModalOpen(true)}
              className="btn-primary"
              style={{ width: '100%' }}
            >
              <i className="fa-solid fa-microscope"></i>
              {t.cardDiseaseBtn}
            </button>
          </div>

          {/* Card 2: Seed Identification */}
          <div className="glass-card" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#ecfdf5',
              color: '#10b981',
              fontSize: '1.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <i className="fa-solid fa-seedling"></i>
            </div>
            <h3 style={{ fontSize: '1.35rem', color: '#064e3b', marginBottom: '10px' }}>
              {t.cardSeedTitle}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', flex: 1, marginBottom: '24px' }}>
              {t.cardSeedDesc}
            </p>
            <button
              onClick={() => setSeedModalOpen(true)}
              className="btn-primary"
              style={{ width: '100%' }}
            >
              <i className="fa-solid fa-magnifying-glass"></i>
              {t.cardSeedBtn}
            </button>
          </div>

          {/* Card 3: Weather Forecast */}
          <div className="glass-card" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#f0f9ff',
              color: '#0284c7',
              fontSize: '1.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <i className="fa-solid fa-cloud-sun"></i>
            </div>
            <h3 style={{ fontSize: '1.35rem', color: '#075985', marginBottom: '10px' }}>
              {t.cardWeatherTitle}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', flex: 1, marginBottom: '24px' }}>
              {t.cardWeatherDesc}
            </p>
            <button
              onClick={() => navigate('/weather')}
              className="btn-primary"
              style={{ width: '100%', background: 'linear-gradient(135deg, #0284c7, #0369a1)' }}
            >
              <i className="fa-solid fa-temperature-half"></i>
              {t.cardWeatherBtn}
            </button>
          </div>

          {/* Card 4: Farming Tips */}
          <div className="glass-card" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#fef3c7',
              color: '#d97706',
              fontSize: '1.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <i className="fa-solid fa-lightbulb"></i>
            </div>
            <h3 style={{ fontSize: '1.35rem', color: '#92400e', marginBottom: '10px' }}>
              {t.cardTipsTitle}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', flex: 1, marginBottom: '24px' }}>
              {t.cardTipsDesc}
            </p>
            <button
              onClick={() => navigate('/tips')}
              className="btn-primary"
              style={{ width: '100%', background: 'linear-gradient(135deg, #d97706, #b45309)' }}
            >
              <i className="fa-solid fa-book-open"></i>
              {t.cardTipsBtn}
            </button>
          </div>
        </div>
      </section>

      {/* Modals */}
      <DiseaseModal isOpen={diseaseModalOpen} onClose={() => setDiseaseModalOpen(false)} />
      <SeedModal isOpen={seedModalOpen} onClose={() => setSeedModalOpen(false)} />

      {/* Footer */}
      <footer style={{
        background: '#064e3b',
        color: '#ffffff',
        padding: '40px 24px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>🌾 {t.appTitle}</h3>
          <p style={{ fontSize: '0.9rem', color: '#a7f3d0', marginBottom: '16px' }}>
            {t.rights}
          </p>
          <div style={{ fontSize: '0.85rem', color: '#6ee7b7' }}>
            Built with React, Node.js, Python, TensorFlow & Google Gemini AI
          </div>
        </div>
      </footer>
    </div>
  );
}

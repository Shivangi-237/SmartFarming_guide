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
        padding: '70px 24px 50px',
        textAlign: 'center',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Live Status Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #bbf7d0',
            padding: '6px 18px',
            borderRadius: '9999px',
            boxShadow: '0 2px 10px rgba(16, 185, 129, 0.12)',
            marginBottom: '24px'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 10px #10b981'
            }}></span>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#065f46', letterSpacing: '0.02em' }}>
              {lang === 'hi' ? 'एआई-संचालित स्मार्ट कृषि मंच • पूर्णतः निःशुल्क' : 'AI-Powered Smart Agriculture • Instant & Free'}
            </span>
          </div>

          {/* Main Hero Headline */}
          <h1 style={{
            fontSize: 'clamp(2.2rem, 5.5vw, 3.8rem)',
            color: '#064e3b',
            lineHeight: '1.15',
            marginBottom: '20px',
            fontWeight: '800'
          }}>
            {t.heroTitle}
          </h1>

          <p style={{
            fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
            color: '#475569',
            lineHeight: '1.6',
            maxWidth: '720px',
            margin: '0 auto 36px',
            fontWeight: '400'
          }}>
            {t.heroSubtitle}
          </p>

          {/* Dual Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setDiseaseModalOpen(true)}
              className="btn-modern-primary"
              style={{ padding: '14px 30px', fontSize: '1rem', borderRadius: '14px' }}
            >
              <i className="fa-solid fa-microscope"></i>
              {t.cardDiseaseBtn}
            </button>
            <button
              onClick={() => setSeedModalOpen(true)}
              className="btn-modern-secondary"
              style={{ padding: '14px 28px', fontSize: '1rem', borderRadius: '14px' }}
            >
              <i className="fa-solid fa-seedling" style={{ color: '#10b981' }}></i>
              {t.cardSeedBtn}
            </button>
          </div>

          {/* Stat Pills */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            marginTop: '42px',
            fontSize: '0.85rem',
            color: '#64748b',
            fontWeight: '600'
          }}>
            <span className="pill-badge pill-green">
              <i className="fa-solid fa-check"></i> 23 Plant Disease Classes
            </span>
            <span className="pill-badge pill-amber">
              <i className="fa-solid fa-check"></i> 7 Crop Seed Types
            </span>
            <span className="pill-badge pill-blue">
              <i className="fa-solid fa-cloud-sun"></i> Live Weather Advisories
            </span>
            <span className="pill-badge pill-green">
              <i className="fa-solid fa-robot"></i> Gemini 2.5 AI Assistant
            </span>
          </div>
        </div>
      </section>

      {/* 4 Feature Action Cards */}
      <section style={{ maxWidth: '1240px', margin: '0 auto', padding: '30px 24px 80px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
          gap: '24px'
        }}>
          {/* Card 1: Disease Detection */}
          <div className="glass-panel" style={{ padding: '32px 26px', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
              color: '#059669',
              fontSize: '1.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: '0 4px 12px rgba(16,185,129,0.15)'
            }}>
              <i className="fa-solid fa-leaf"></i>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Computer Vision
            </div>
            <h3 style={{ fontSize: '1.4rem', color: '#064e3b', marginBottom: '10px' }}>
              {t.cardDiseaseTitle}
            </h3>
            <p style={{ color: '#475569', fontSize: '0.94rem', lineHeight: '1.55', flex: 1, marginBottom: '24px' }}>
              {t.cardDiseaseDesc}
            </p>
            <button
              onClick={() => setDiseaseModalOpen(true)}
              className="btn-modern-primary"
              style={{ width: '100%', borderRadius: '12px' }}
            >
              <i className="fa-solid fa-upload"></i>
              {t.cardDiseaseBtn} →
            </button>
          </div>

          {/* Card 2: Seed Identification */}
          <div className="glass-panel" style={{ padding: '32px 26px', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
              color: '#059669',
              fontSize: '1.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: '0 4px 12px rgba(16,185,129,0.15)'
            }}>
              <i className="fa-solid fa-seedling"></i>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Seed Recognition
            </div>
            <h3 style={{ fontSize: '1.4rem', color: '#064e3b', marginBottom: '10px' }}>
              {t.cardSeedTitle}
            </h3>
            <p style={{ color: '#475569', fontSize: '0.94rem', lineHeight: '1.55', flex: 1, marginBottom: '24px' }}>
              {t.cardSeedDesc}
            </p>
            <button
              onClick={() => setSeedModalOpen(true)}
              className="btn-modern-primary"
              style={{ width: '100%', borderRadius: '12px' }}
            >
              <i className="fa-solid fa-magnifying-glass"></i>
              {t.cardSeedBtn} →
            </button>
          </div>

          {/* Card 3: Weather Forecast */}
          <div className="glass-panel" style={{ padding: '32px 26px', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
              color: '#0284c7',
              fontSize: '1.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: '0 4px 12px rgba(2,132,199,0.15)'
            }}>
              <i className="fa-solid fa-cloud-sun"></i>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Hyperlocal GPS
            </div>
            <h3 style={{ fontSize: '1.4rem', color: '#075985', marginBottom: '10px' }}>
              {t.cardWeatherTitle}
            </h3>
            <p style={{ color: '#475569', fontSize: '0.94rem', lineHeight: '1.55', flex: 1, marginBottom: '24px' }}>
              {t.cardWeatherDesc}
            </p>
            <button
              onClick={() => navigate('/weather')}
              className="btn-modern-primary"
              style={{ width: '100%', borderRadius: '12px', background: 'linear-gradient(135deg, #0284c7, #0369a1)' }}
            >
              <i className="fa-solid fa-temperature-half"></i>
              {t.cardWeatherBtn} →
            </button>
          </div>

          {/* Card 4: Farming Tips */}
          <div className="glass-panel" style={{ padding: '32px 26px', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
              color: '#d97706',
              fontSize: '1.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: '0 4px 12px rgba(217,119,6,0.15)'
            }}>
              <i className="fa-solid fa-lightbulb"></i>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Agronomic Knowledge
            </div>
            <h3 style={{ fontSize: '1.4rem', color: '#92400e', marginBottom: '10px' }}>
              {t.cardTipsTitle}
            </h3>
            <p style={{ color: '#475569', fontSize: '0.94rem', lineHeight: '1.55', flex: 1, marginBottom: '24px' }}>
              {t.cardTipsDesc}
            </p>
            <button
              onClick={() => navigate('/tips')}
              className="btn-modern-primary"
              style={{ width: '100%', borderRadius: '12px', background: 'linear-gradient(135deg, #d97706, #b45309)' }}
            >
              <i className="fa-solid fa-book-open"></i>
              {t.cardTipsBtn} →
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
        padding: '50px 24px 40px',
        textAlign: 'center',
        marginTop: 'auto'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <img src="/leaf.svg" alt="Leaf" style={{ width: '28px', height: '28px' }} />
            <h3 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Smart Farming Guide</h3>
          </div>
          <p style={{ fontSize: '0.92rem', color: '#a7f3d0', marginBottom: '20px', lineHeight: '1.6' }}>
            {t.rights}
          </p>
          <div style={{
            fontSize: '0.82rem',
            color: '#6ee7b7',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            Powered by React, Node.js, Python, TensorFlow & Google Gemini AI
          </div>
        </div>
      </footer>
    </div>
  );
}

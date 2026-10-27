import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { predictCropSeed } from '../services/api';

export default function SeedModal({ isOpen, onClose }) {
  const { lang, t } = useLanguage();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError('');
    }
  };

  const handleIdentify = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await predictCropSeed(selectedFile);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Error identifying seed image.');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setResult(null);
    setError('');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={resetModal}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ padding: '28px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem'
            }}>
              <i className="fa-solid fa-seedling"></i>
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#064e3b' }}>
                {t.modalSeedTitle}
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Supported: Apple, Wheat, Rice, Corn, Pomegranate, Soybean, Sunflower
              </span>
            </div>
          </div>
          <button
            onClick={resetModal}
            style={{
              background: '#f1f5f9',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b'
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Upload Area */}
        <div style={{
          border: '2px dashed #94a3b8',
          borderRadius: '16px',
          padding: '24px 16px',
          textAlign: 'center',
          background: '#f8fafc',
          cursor: 'pointer',
          marginBottom: '20px'
        }}>
          <input
            type="file"
            accept="image/*"
            id="seed-file-input"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="seed-file-input" style={{ cursor: 'pointer', display: 'block' }}>
            {previewUrl ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={previewUrl}
                  alt="Selected Seed"
                  style={{
                    maxHeight: '180px',
                    maxWidth: '100%',
                    borderRadius: '12px',
                    objectFit: 'cover',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <span style={{
                  display: 'block',
                  marginTop: '8px',
                  fontSize: '0.8rem',
                  color: '#059669',
                  fontWeight: '600'
                }}>
                  Click to choose different image
                </span>
              </div>
            ) : (
              <div>
                <i className="fa-solid fa-wheat-awn" style={{ fontSize: '2.5rem', color: '#10b981', marginBottom: '8px' }}></i>
                <p style={{ fontWeight: '700', color: '#1e293b', marginBottom: '4px', fontSize: '0.98rem' }}>
                  {t.modalSeedPrompt}
                </p>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                  Select or drag & drop a clear photo of seeds
                </span>
              </div>
            )}
          </label>
        </div>

        {/* File name info */}
        {selectedFile && (
          <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', marginBottom: '16px' }}>
            <i className="fa-regular fa-image" style={{ marginRight: '6px' }}></i>
            {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
          </p>
        )}

        {/* Identify Button */}
        <button
          onClick={handleIdentify}
          disabled={!selectedFile || loading}
          className="btn-modern-primary"
          style={{
            width: '100%',
            padding: '13px',
            fontSize: '1rem',
            opacity: (!selectedFile || loading) ? 0.55 : 1,
            cursor: (!selectedFile || loading) ? 'not-allowed' : 'pointer',
            borderRadius: '12px'
          }}
        >
          {loading ? (
            <>
              <div className="spinner-pulse" style={{ width: '20px', height: '20px', borderWidth: '2.5px' }}></div>
              {t.identifying}
            </>
          ) : (
            <>
              <i className="fa-solid fa-magnifying-glass"></i>
              {t.cardSeedBtn}
            </>
          )}
        </button>

        {/* Error Alert */}
        {error && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            borderRadius: '12px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="fa-solid fa-circle-exclamation"></i>
            {error}
          </div>
        )}

        {/* Identification Result */}
        {result && (
          <div style={{ marginTop: '20px', animation: 'fadeIn 0.3s ease' }}>
            {result.is_recognized === false || parseFloat(result.confidence) < 25.0 ? (
              <div style={{
                padding: '18px',
                borderRadius: '16px',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                color: '#92400e'
              }}>
                <h4 style={{ fontSize: '1.05rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  {lang === 'hi' ? 'अज्ञात या असमर्थित बीज' : 'Unrecognized Seed'}
                </h4>
                <p style={{ fontSize: '0.88rem', lineHeight: '1.5' }}>
                  {lang === 'hi'
                    ? `एआई सटीकता कम है (${result.confidence}% संभावना ${result.seed} के लिए)। कृपया बीज की एक स्पष्ट फोटो अपलोड करें।`
                    : `Confidence is low (${result.confidence}% for ${result.seed}). Please ensure the seed is well-lit and matches supported crops: Apple, Wheat, Rice, Corn, Pomegranate, Soybean, Sunflower.`}
                </p>
              </div>
            ) : (
              <div style={{
                padding: '20px',
                borderRadius: '16px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span className="pill-badge pill-green">
                    <i className="fa-solid fa-circle-check"></i>
                    {lang === 'hi' ? 'पहचाना गया बीज' : 'Identified Seed'}
                  </span>
                  <span style={{
                    background: '#059669',
                    color: '#ffffff',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '0.85rem',
                    fontWeight: '700'
                  }}>
                    {result.confidence}% {lang === 'hi' ? 'सटीकता' : 'Confidence'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.4rem', color: '#064e3b', marginBottom: '6px' }}>
                  🌱 {result.seed}
                  {result.scientific && (
                    <span style={{ fontSize: '0.95rem', fontWeight: '500', fontStyle: 'italic', color: '#059669', marginLeft: '10px' }}>
                      ({result.scientific})
                    </span>
                  )}
                </h3>

                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #bbf7d0' }}>
                  <h5 style={{ fontSize: '0.92rem', color: '#15803d', fontWeight: '700', marginBottom: '4px' }}>
                    🌾 {t.recommendation}:
                  </h5>
                  <p style={{ fontSize: '0.92rem', color: '#14532d', lineHeight: '1.55' }}>
                    {lang === 'hi' ? (result.planting_hi || result.planting_en) : (result.planting_en || result.planting_hi)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

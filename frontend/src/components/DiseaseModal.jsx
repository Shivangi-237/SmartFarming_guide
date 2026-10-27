import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { predictPlantDisease } from '../services/api';

export default function DiseaseModal({ isOpen, onClose }) {
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

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await predictPlantDisease(selectedFile);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Error analyzing leaf image.');
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

  // Format label: "Tomato___Early_blight" -> "Tomato: Early Blight"
  const formatLabel = (raw) => {
    if (!raw) return '';
    const parts = raw.split('___');
    const crop = parts[0]?.replace(/_/g, ' ') || '';
    const condition = parts[1]?.replace(/_/g, ' ') || 'Healthy';
    return `${crop} — ${condition}`;
  };

  return (
    <div className="modal-overlay" onClick={resetModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.35rem', color: '#065f46', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-virus" style={{ color: '#10b981' }}></i>
            {t.modalDiseaseTitle}
          </h3>
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

        {/* Upload Dropzone */}
        <div style={{
          border: '2px dashed #cbd5e1',
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
            id="disease-file-input"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="disease-file-input" style={{ cursor: 'pointer', display: 'block' }}>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Selected Leaf"
                style={{
                  maxHeight: '180px',
                  maxWidth: '100%',
                  borderRadius: '12px',
                  objectFit: 'cover',
                  margin: '0 auto',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
            ) : (
              <div>
                <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '2.5rem', color: '#10b981', marginBottom: '8px' }}></i>
                <p style={{ fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  {t.modalDiseasePrompt}
                </p>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  PNG, JPG, or JPEG up to 5MB
                </span>
              </div>
            )}
          </label>
        </div>

        {/* File name info */}
        {selectedFile && (
          <p style={{ fontSize: '0.88rem', color: '#64748b', textAlign: 'center', marginBottom: '16px' }}>
            <i className="fa-regular fa-image" style={{ marginRight: '6px' }}></i>
            {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
          </p>
        )}

        {/* Action Button */}
        <button
          onClick={handleAnalyze}
          disabled={!selectedFile || loading}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '1rem',
            opacity: (!selectedFile || loading) ? 0.6 : 1,
            cursor: (!selectedFile || loading) ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? (
            <>
              <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2.5px', margin: 0 }}></div>
              {t.analyzing}
            </>
          ) : (
            <>
              <i className="fa-solid fa-microscope"></i>
              {t.cardDiseaseBtn}
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
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="fa-solid fa-circle-exclamation"></i>
            {error}
          </div>
        )}

        {/* Analysis Result Card */}
        {result && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '14px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {lang === 'hi' ? 'निदान परिणाम' : 'Diagnosis Result'}
              </span>
              <span style={{
                background: '#10b981',
                color: '#ffffff',
                padding: '3px 10px',
                borderRadius: '12px',
                fontSize: '0.82rem',
                fontWeight: '700'
              }}>
                {result.confidence}% {lang === 'hi' ? 'सटीकता' : 'Confidence'}
              </span>
            </div>
            <h4 style={{ fontSize: '1.15rem', color: '#064e3b', marginBottom: '6px' }}>
              🌿 {formatLabel(result.prediction)}
            </h4>
            <p style={{ fontSize: '0.9rem', color: '#15803d', lineHeight: '1.5' }}>
              {lang === 'hi'
                ? 'कृषि सलाह: संक्रमित पत्तियों को अलग करें और फफूंदनाशक या अनुशंसित जैविक स्प्रे का उपयोग करें।'
                : 'Agronomic Guidance: Isolate infected foliage and apply appropriate fungicide or organic neem-based spray.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

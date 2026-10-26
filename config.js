// Smart Farming Global API Configuration
// Automatically detects environment: localhost for local development, Cloud URLs for production
(function() {
  const isLocal = Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname === ''
  );

  window.SMART_FARM_CONFIG = {
    // Node.js Express Backend (Weather, Chatbot, Tips, User Auth)
    // Live Render URL
    NODE_API_URL: isLocal 
      ? 'http://localhost:5000' 
      : 'https://smartfarming-guide.onrender.com',

    // Python Flask ML Backend (Plant Disease & Seed Classification Models)
    // Live Render URL
    ML_API_URL: isLocal 
      ? 'http://localhost:5001' 
      : 'https://smartfarming-ml-oat2.onrender.com'
  };

  // Safe helper getters
  window.getNodeApiUrl = function(endpoint = '') {
    const base = (window.SMART_FARM_CONFIG && window.SMART_FARM_CONFIG.NODE_API_URL) 
      ? window.SMART_FARM_CONFIG.NODE_API_URL.replace(/\/+$/, '') 
      : (isLocal ? 'http://localhost:5000' : '');
    const path = endpoint ? (endpoint.startsWith('/') ? endpoint : '/' + endpoint) : '';
    return base + path;
  };

  window.getMlApiUrl = function(endpoint = '') {
    const base = (window.SMART_FARM_CONFIG && window.SMART_FARM_CONFIG.ML_API_URL) 
      ? window.SMART_FARM_CONFIG.ML_API_URL.replace(/\/+$/, '') 
      : (isLocal ? 'http://localhost:5001' : '');
    const path = endpoint ? (endpoint.startsWith('/') ? endpoint : '/' + endpoint) : '';
    return base + path;
  };
})();


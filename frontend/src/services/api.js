// Smart Farming Guide - Unified Cloud API Service

const isLocal = Boolean(
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1' ||
   window.location.hostname.startsWith('192.168.'))
);

export const NODE_API_BASE = isLocal
  ? 'http://localhost:5000'
  : 'https://smartfarming-guide.onrender.com';

export const ML_API_BASE = isLocal
  ? 'http://localhost:5001'
  : 'https://smartfarming-ml-oat2.onrender.com';

// ----- Authentication API -----
export async function loginUser(username, password) {
  const res = await fetch(`${NODE_API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
  return data;
}

export async function signupUser(username, password, email) {
  const res = await fetch(`${NODE_API_BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, email })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Signup failed');
  return data;
}

// ----- Weather API -----
export async function fetchWeatherByCity(city, lang = 'en') {
  const res = await fetch(`${NODE_API_BASE}/weather?city=${encodeURIComponent(city)}&lang=${lang}`);
  if (!res.ok) {
    // Attempt dual-hop geocode fallback
    const geoRes = await fetch(`${NODE_API_BASE}/geocode?city=${encodeURIComponent(city)}`);
    if (geoRes.ok) {
      const geo = await geoRes.json();
      if (Array.isArray(geo) && geo.length > 0 && geo[0].lat) {
        return fetchWeatherByCoords(geo[0].lat, geo[0].lon, lang);
      }
    }
    throw new Error('Unable to find weather for this city');
  }
  return res.json();
}

export async function fetchWeatherByCoords(lat, lon, lang = 'en') {
  const res = await fetch(`${NODE_API_BASE}/weather?lat=${lat}&lon=${lon}&lang=${lang}`);
  if (!res.ok) throw new Error('Failed to fetch weather for coordinates');
  return res.json();
}

export async function reverseGeocode(lat, lon, lang = 'en') {
  try {
    const res = await fetch(`${NODE_API_BASE}/reverse-geocode?lat=${lat}&lon=${lon}&lang=${lang}`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Reverse geocode error:', e);
  }
  return null;
}

// ----- Chatbot API -----
export async function sendChatMessage(message, language = 'en') {
  const res = await fetch(`${NODE_API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, language })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.reply || data.error || 'Failed to get answer');
  return data;
}

// ----- Farming Tips API -----
export async function fetchFarmingTips(category = 'all', lang = 'en') {
  const res = await fetch(`${NODE_API_BASE}/get-tips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, language: lang })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch tips');
  return data;
}

// ----- Machine Learning & Vision API -----
export async function predictCropSeed(imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);

  const res = await fetch(`${ML_API_BASE}/predict-seed`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Seed identification failed');
  return data;
}

export async function predictPlantDisease(imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);

  const res = await fetch(`${ML_API_BASE}/predict`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Plant disease analysis failed');
  return data;
}

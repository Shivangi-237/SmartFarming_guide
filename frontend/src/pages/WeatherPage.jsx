import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { fetchWeatherByCity, fetchWeatherByCoords, reverseGeocode } from '../services/api';

const AGRI_ADVISORIES = {
  en: {
    clear: { title: "Crop Care Recommendation", text: "Sunny conditions increase evapotranspiration. Water crops early morning or late evening. Suitable for pesticide and fertilizer application." },
    clouds: { title: "Crop Care Recommendation", text: "Overcast skies with mild heat. Good time for transplanting nursery saplings and field weeding. Inspect foliage for fungal spore development." },
    rain: { title: "Rain Advisory", text: "Rain expected or active. Ensure field drainage channels are unblocked to prevent root rot. Suspend chemical sprays and fertilizer broadcast." },
    drizzle: { title: "Moisture Advisory", text: "Light drizzle increases canopy dampness. Monitor standing pulses and vegetables for bacterial leaf blight or powdery mildew." },
    thunderstorm: { title: "Severe Weather Warning", text: "Secure polyhouse nets, greenhouses, and livestock. Delay all field operations until thunderstorm activity subsides." },
    snow: { title: "Frost / Cold Alert", text: "Cold conditions may cause frost damage. Provide protective mulch or light night-time furrow irrigation to buffer soil temperature." },
    wind: { title: "Wind Hazard", text: "Gusty winds can lodge tall crops (maize, banana, tomatoes). Stake plants securely and postpone aerial spray applications." },
    default: { title: "Farming Guidance", text: "Monitor soil moisture regularly at root zone depth. Practice integrated pest management and crop hygiene." }
  },
  hi: {
    clear: { title: "फसल देखभाल सलाह", text: "धूप से पानी का वाष्पीकरण तेज होता है। फसलों की सिंचाई सुबह या शाम को करें। कीटनाशक और खाद छिड़काव के लिए अनुकूल समय है।" },
    clouds: { title: "फसल देखभाल सलाह", text: "बादल छाए रहने से धूप की तीव्रता कम रहती है। नर्सरी रोपाई और निराई-गुड़ाई के लिए अच्छा समय है। पत्तियों पर फफूंद के लक्षणों की जांच करें।" },
    rain: { title: "वर्षा सलाह", text: "बारिश की संभावना या सक्रिय वर्षा। खेतों में जलभराव रोकने के लिए नालियां साफ रखें। रासायनिक छिड़काव और उर्वरक डालना रोक दें।" },
    drizzle: { title: "नमी सलाह", text: "हल्की बूंदाबांदी से पत्तियों पर नमी बढ़ती है। दलहनी और सब्जी फसलों में झुलसा या चूर्णिल फफूंद की निगरानी रखें।" },
    thunderstorm: { title: "मौसम चेतावनी", text: "तेज आंधी-तूफान के समय पॉलीहाउस और मवेशियों को सुरक्षित रखें। मौसम शांत होने तक खेत के सभी काम स्थगित रखें।" },
    snow: { title: "पाला व ठंड चेतावनी", text: "अत्यधिक ठंड से पाला पड़ने का खतरा है। मिट्टी का तापमान संतुलित रखने के लिए हल्की सिंचाई या मल्चिंग का उपयोग करें।" },
    wind: { title: "हवा से बचाव", text: "तेज हवा से लंबी फसलें (मक्का, टमाटर) गिर सकती हैं। सहारा (सपोर्ट) दें और हवा में दवा का छिड़काव न करें।" },
    default: { title: "कृषि मार्गदर्शन", text: "जड़ों की गहराई पर मिट्टी की नमी नियमित जांचें। संतुलित पोषक तत्व प्रबंधन और खेत की स्वच्छता बनाए रखें।" }
  }
};

function getAdvisory(condition = 'clear', lang = 'en') {
  const c = condition.toLowerCase();
  const table = AGRI_ADVISORIES[lang === 'hi' ? 'hi' : 'en'] || AGRI_ADVISORIES.en;
  if (c.includes('rain')) return table.rain;
  if (c.includes('drizzle')) return table.drizzle;
  if (c.includes('thunder')) return table.thunderstorm;
  if (c.includes('snow')) return table.snow;
  if (c.includes('cloud')) return table.clouds;
  if (c.includes('clear')) return table.clear;
  if (c.includes('wind')) return table.wind;
  return table.default;
}

export default function WeatherPage() {
  const { lang } = useLanguage();
  const [cityInput, setCityInput] = useState('Dehradun');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadWeather = async (city) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchWeatherByCity(city, lang);
      setWeatherData(data);
    } catch (err) {
      setError(lang === 'hi' ? 'मौसम लोड करने में असमर्थ। कृपया शहर का नाम जांचें।' : 'Unable to load weather. Please check the city name.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather(cityInput || 'Dehradun');
  }, [lang]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (cityInput.trim()) {
      loadWeather(cityInput.trim());
    }
  };

  const handleAutoLocate = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const rev = await reverseGeocode(latitude, longitude, lang);
          const data = await fetchWeatherByCoords(latitude, longitude, lang);
          if (rev && rev.city) {
            data.name = rev.displayName || rev.city;
            setCityInput(rev.city);
          }
          setWeatherData(data);
        } catch (err) {
          setError('Failed to fetch weather for GPS location.');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError('Location permission denied or timed out.');
        setLoading(false);
      },
      { timeout: 8000 }
    );
  };

  const temp = weatherData?.main?.temp ? Math.round(weatherData.main.temp) : 24;
  const feelsLike = weatherData?.main?.feels_like ? Math.round(weatherData.main.feels_like) : temp;
  const humidity = weatherData?.main?.humidity ?? 60;
  const wind = weatherData?.wind?.speed ?? 3.2;
  const weatherCond = weatherData?.weather?.[0]?.main || 'Clear';
  const weatherDesc = weatherData?.weather?.[0]?.description || 'Clear Sky';
  const iconCode = weatherData?.weather?.[0]?.icon || '01d';
  const advisory = getAdvisory(weatherCond, lang);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px 80px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.4rem', color: '#064e3b', marginBottom: '8px' }}>
          🌦️ {lang === 'hi' ? 'कृषि मौसम पूर्वानुमान' : 'Agricultural Weather Forecast'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          {lang === 'hi' ? 'लाइव मौसम अपडेट और वर्षा व हवा आधारित कृषि सलाह' : 'Live weather updates and condition-based crop care advisories'}
        </p>
      </div>

      {/* Search & Auto Detect Bar */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '30px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder={lang === 'hi' ? 'शहर का नाम लिखें (उदा. Dehradun, Delhi)...' : 'Enter city name (e.g. Dehradun, Delhi)...'}
            style={{
              flex: 1,
              minWidth: '220px',
              padding: '12px 18px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '12px 24px' }}>
            <i className="fa-solid fa-magnifying-glass"></i>
            {lang === 'hi' ? 'खोजें' : 'Search'}
          </button>
          <button
            type="button"
            onClick={handleAutoLocate}
            className="btn-secondary"
            style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Auto Detect GPS Location"
          >
            <i className="fa-solid fa-location-crosshairs" style={{ color: '#10b981' }}></i>
            {lang === 'hi' ? 'मेरा स्थान' : 'Auto Detect'}
          </button>
        </form>
      </div>

      {/* Loading & Error */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner"></div>
          <p style={{ color: '#64748b' }}>{lang === 'hi' ? 'मौसम लोड हो रहा है...' : 'Fetching live weather data...'}</p>
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', color: '#b91c1c', textAlign: 'center', marginBottom: '24px' }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px' }}></i>
          {error}
        </div>
      )}

      {/* Weather Display Glass Card */}
      {weatherData && !loading && (
        <div className="glass-card" style={{ padding: '32px', textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
            <i className="fa-solid fa-location-dot" style={{ color: '#10b981', fontSize: '1.4rem' }}></i>
            <h2 style={{ fontSize: '1.8rem', color: '#064e3b' }}>
              {weatherData.name || cityInput}
            </h2>
          </div>
          <p style={{ color: '#64748b', fontSize: '1.05rem', textTransform: 'capitalize', marginBottom: '20px' }}>
            {weatherDesc}
          </p>

          {/* Temperature & Icon */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '32px' }}>
            <img
              src={`https://openweathermap.org/img/wn/${iconCode}@2x.png`}
              alt={weatherDesc}
              style={{ width: '80px', height: '80px', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}
            />
            <div style={{ fontSize: '4rem', fontWeight: '800', color: '#0f172a', fontFamily: 'Outfit' }}>
              {temp}°C
            </div>
          </div>

          {/* Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '28px',
            background: 'rgba(248, 250, 252, 0.8)',
            padding: '16px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0'
          }}>
            <div>
              <i className="fa-solid fa-temperature-arrow-up" style={{ color: '#0284c7', fontSize: '1.2rem', marginBottom: '4px' }}></i>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{lang === 'hi' ? 'महसूस' : 'Feels Like'}</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#1e293b' }}>{feelsLike}°C</div>
            </div>
            <div>
              <i className="fa-solid fa-droplet" style={{ color: '#0284c7', fontSize: '1.2rem', marginBottom: '4px' }}></i>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{lang === 'hi' ? 'नमी' : 'Humidity'}</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#1e293b' }}>{humidity}%</div>
            </div>
            <div>
              <i className="fa-solid fa-wind" style={{ color: '#0284c7', fontSize: '1.2rem', marginBottom: '4px' }}></i>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{lang === 'hi' ? 'हवा की गति' : 'Wind Speed'}</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#1e293b' }}>{wind} m/s</div>
            </div>
          </div>

          {/* Agricultural Advisory Card */}
          <div style={{
            padding: '20px',
            borderRadius: '16px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            textAlign: 'left'
          }}>
            <h4 style={{ fontSize: '1.05rem', color: '#065f46', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-seedling" style={{ color: '#10b981' }}></i>
              🌾 {advisory.title}
            </h4>
            <p style={{ fontSize: '0.92rem', color: '#047857', lineHeight: '1.55' }}>
              {advisory.text}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


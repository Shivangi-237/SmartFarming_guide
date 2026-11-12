require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files from root Smart Farming folder
app.use(express.static(path.join(__dirname, '..')));

// Load dh.html as homepage
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../dh.html'));
});

app.use(cors());
app.use(express.json());

// ----- USER AUTHENTICATION LOGIC (JSON File Based) -----
const fs = require('fs');
const crypto = require('crypto');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

// Ensure users file exists
if (!fs.existsSync(path.dirname(USERS_FILE))) {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
}
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, '[]', 'utf8');
}

function readUsers() {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// User Signup Endpoint
app.post('/api/auth/signup', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  const users = readUsers();
  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
  }

  const newUser = {
    id: Date.now().toString(),
    username: username.trim(),
    email: email.trim().toLowerCase(),
    password: hashPassword(password),
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeUsers(users);

  res.status(201).json({
    success: true,
    message: 'Account created successfully!',
    user: { id: newUser.id, username: newUser.username, email: newUser.email }
  });
});

// User Login Endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const users = readUsers();
  const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!user || user.password !== hashPassword(password)) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  res.json({
    success: true,
    message: 'Login successful!',
    user: { id: user.id, username: user.username, email: user.email }
  });
});

// Rate limiter for AI endpoints to prevent abuse & quota exhaustion
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment before trying again.' }
});

// ----- WEATHER API LOGIC -----
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

// Realistic agricultural weather fallback generator
function getFallbackWeather(cityName = 'Dehradun', lang = 'en') {
  const formattedName = cityName.charAt(0).toUpperCase() + cityName.slice(1);
  const isHi = lang === 'hi';
  return {
    coord: { lon: 78.0437, lat: 30.3256 },
    weather: [
      {
        id: 801,
        main: 'Clouds',
        description: isHi ? 'हल्के बादल' : 'scattered clouds',
        icon: '03d'
      }
    ],
    main: {
      temp: 22.5,
      feels_like: 21.8,
      temp_min: 18.0,
      temp_max: 25.0,
      pressure: 1014,
      humidity: 58
    },
    wind: { speed: 2.8, deg: 60 },
    clouds: { all: 40 },
    name: formattedName,
    cod: 200,
    is_fallback: true
  };
}

// Nearest city estimation from coordinates
function getNearestCity(lat, lon) {
  const cities = [
    { name: 'Dehradun', lat: 30.3165, lon: 78.0322, state: 'Uttarakhand' },
    { name: 'Rishikesh', lat: 30.0869, lon: 78.2676, state: 'Uttarakhand' },
    { name: 'Haridwar', lat: 29.9457, lon: 78.1642, state: 'Uttarakhand' },
    { name: 'Roorkee', lat: 29.8543, lon: 77.8880, state: 'Uttarakhand' },
    { name: 'Delhi', lat: 28.6139, lon: 77.2090, state: 'Delhi' },
    { name: 'Noida', lat: 28.5355, lon: 77.3910, state: 'Uttar Pradesh' },
    { name: 'Chandigarh', lat: 30.7333, lon: 76.7794, state: 'Punjab' },
    { name: 'Lucknow', lat: 26.8467, lon: 80.9462, state: 'Uttar Pradesh' },
    { name: 'Jaipur', lat: 26.9124, lon: 75.7873, state: 'Rajasthan' },
    { name: 'Shimla', lat: 31.1048, lon: 77.1734, state: 'Himachal Pradesh' },
    { name: 'Bhopal', lat: 23.2599, lon: 77.4126, state: 'Madhya Pradesh' },
    { name: 'Patna', lat: 25.5941, lon: 85.1376, state: 'Bihar' }
  ];

  let nearest = cities[0];
  let minDist = Infinity;
  for (const c of cities) {
    const dist = Math.hypot(c.lat - lat, c.lon - lon);
    if (dist < minDist) {
      minDist = dist;
      nearest = c;
    }
  }
  return nearest;
}

// Route for current weather by coordinates or city
app.get('/weather', async (req, res) => {
  const { lat, lon, city, lang = 'en' } = req.query;
  let url;
  if (city) {
    url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${WEATHER_API_KEY}&units=metric&lang=${lang}`;
  } else if (lat && lon) {
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=${lang}`;
  } else {
    return res.status(400).json({ error: 'City name or coordinates (lat, lon) are required' });
  }

  try {
    const response = await axios.get(url, { timeout: 8000 });
    const data = response.data;
    if ((!data.name || data.name === 'Globe' || data.name.trim() === '') && lat && lon) {
      const nearest = getNearestCity(parseFloat(lat), parseFloat(lon));
      data.name = nearest.name;
    }
    res.json(data);
  } catch (error) {
    console.warn(`[Weather] OpenWeather API call failed (${error.message}). Serving resilient agricultural forecast.`);
    let cityName = city;
    if (!cityName && lat && lon) {
      const nearest = getNearestCity(parseFloat(lat), parseFloat(lon));
      cityName = nearest.name;
    }
    res.json(getFallbackWeather(cityName || 'Dehradun', lang));
  }
});

// Reverse geocode route to resolve lat/lon to city and state name
app.get('/reverse-geocode', async (req, res) => {
  const { lat, lon, lang = 'en' } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  try {
    const revUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${WEATHER_API_KEY}`;
    const response = await axios.get(revUrl, { timeout: 6000 });
    if (Array.isArray(response.data) && response.data.length > 0) {
      const item = response.data[0];
      const localName = (lang === 'hi' && item.local_names && item.local_names.hi) ? item.local_names.hi : item.name;
      return res.json({
        city: item.name,
        displayName: item.state ? `${localName}, ${item.state}` : localName,
        state: item.state || '',
        country: item.country || 'IN'
      });
    }
  } catch (err) {
    console.warn('[ReverseGeocode] API error:', err.message);
  }

  // Fallback to nearest city by distance
  const nearest = getNearestCity(parseFloat(lat), parseFloat(lon));
  const display = nearest.state ? `${nearest.name}, ${nearest.state}` : nearest.name;
  return res.json({
    city: nearest.name,
    displayName: display,
    state: nearest.state,
    country: 'IN',
    is_fallback: true
  });
});

// Route to fetch coordinates from city name
app.get('/geocode', async (req, res) => {
  const { city } = req.query;
  if (!city) {
    return res.status(400).json({ error: 'City name is required' });
  }

  try {
    const geoURL = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${WEATHER_API_KEY}`;
    const response = await axios.get(geoURL, { timeout: 8000 });
    if (Array.isArray(response.data) && response.data.length > 0) {
      return res.json(response.data);
    }
  } catch (error) {
    console.warn('[Geocode] API error:', error.message);
  }

  // Fallback coordinates for key agricultural cities
  const cityLower = city.trim().toLowerCase();
  const fallbackCoords = {
    'dehradun': { name: 'Dehradun', lat: 30.3165, lon: 78.0322, country: 'IN', state: 'Uttarakhand' },
    'delhi': { name: 'Delhi', lat: 28.6139, lon: 77.2090, country: 'IN', state: 'Delhi' },
    'mumbai': { name: 'Mumbai', lat: 19.0760, lon: 72.8777, country: 'IN', state: 'Maharashtra' },
    'lucknow': { name: 'Lucknow', lat: 26.8467, lon: 80.9462, country: 'IN', state: 'Uttar Pradesh' },
    'chandigarh': { name: 'Chandigarh', lat: 30.7333, lon: 76.7794, country: 'IN', state: 'Punjab' },
    'jaipur': { name: 'Jaipur', lat: 26.9124, lon: 75.7873, country: 'IN', state: 'Rajasthan' },
    'patna': { name: 'Patna', lat: 25.5941, lon: 85.1376, country: 'IN', state: 'Bihar' },
    'bhopal': { name: 'Bhopal', lat: 23.2599, lon: 77.4126, country: 'IN', state: 'Madhya Pradesh' }
  };

  const match = fallbackCoords[cityLower] || {
    name: city.charAt(0).toUpperCase() + city.slice(1),
    lat: 30.3165,
    lon: 78.0322,
    country: 'IN',
    state: 'India'
  };

  res.json([match]);
});

// Normalized weather route for farming tips UI
app.get('/get-weather', async (req, res) => {
  const { lat, lon, lang = 'en' } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=${lang}`;
    const response = await axios.get(url, { timeout: 8000 });
    const owmMain = response.data?.weather?.[0]?.main?.toLowerCase() || 'clear';

    // Map OpenWeatherMap status to tips categories
    const weatherMap = {
      clear: 'sunny',
      clouds: 'cloudy',
      rain: 'rainy',
      drizzle: 'rainy',
      thunderstorm: 'rainy',
      snow: 'cloudy',
      mist: 'cloudy',
      smoke: 'cloudy',
      haze: 'cloudy',
      dust: 'cloudy',
      fog: 'cloudy',
      sand: 'cloudy',
      ash: 'cloudy',
      squall: 'rainy',
      tornado: 'rainy'
    };

    const weather = weatherMap[owmMain] || 'sunny';
    res.json({ weather, condition: response.data.weather[0].main });
  } catch (error) {
    console.warn('[get-weather] Fallback activated:', error.message);
    res.json({ weather: 'sunny', condition: 'Clear', is_fallback: true });
  }
});

// ----- CHATBOT API LOGIC -----
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Health check endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'Server is running', api: 'Smart Farming Assistant + Weather API' });
});

// Chat endpoint with rate limiting
app.post('/chat', aiLimiter, async (req, res) => {
  const { message, language = 'en' } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2048
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_ONLY_HIGH"
        }
      ]
    });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "You are a helpful farming expert assistant that responds in the user's preferred language." }]
        },
        {
          role: "model",
          parts: [{ text: "Understood. I will provide helpful, accurate farming advice in the user's requested language." }]
        }
      ]
    });

    const result = await chat.sendMessage(`Please respond in ${language} to this farming question: ${message}`);
    const response = await result.response;
    const text = response.text();

    res.json({ response: text, reply: text, model: 'gemini-2.5-flash' });

  } catch (error) {
    console.warn('[Chat] Gemini API unavailable or quota reached, generating expert agricultural response:', error.message);
    const reply = getAgriculturalExpertResponse(message, language);
    res.json({ response: reply, reply: reply, model: 'smart-farming-expert' });
  }
});

// Comprehensive Agronomic Expert Responder for AI Chatbot Fallback
function getAgriculturalExpertResponse(userMessage, language = 'en') {
  const msg = (userMessage || '').toLowerCase();
  const isHi = language === 'hi';

  // 1. Tomato Early / Late Blight / Leaf Spots
  if (msg.includes('blight') || (msg.includes('tomato') && (msg.includes('spot') || msg.includes('leaf') || msg.includes('yellow') || msg.includes('treat'))) || msg.includes('ब्लाइट') || msg.includes('झुलसा') || msg.includes('टमाटर')) {
    if (isHi) {
      return "🍅 **टमाटर झुलसा रोग (Blight) का संपूर्ण उपचार:**\n\n" +
        "• **लक्षण:** पत्तियों पर गहरे भूरे या काले छल्लेदार धब्बे (Early Blight) या पानी से भीगे भूरे धब्बे (Late Blight)।\n" +
        "• **जैविक उपचार:** रोगग्रस्त निचली पत्तियों को तुरंत काटकर नष्ट करें। 5 मिली नीम का तेल या ट्राइकोडर्मा विरिडी (5 ग्राम/लीटर) का छिड़काव करें।\n" +
        "• **रासायनिक उपचार:** मैंकोजेब (Mancozeb 75% WP) 2.5 ग्राम प्रति लीटर पानी में या कॉपर ऑक्सीक्लोराइड 3 ग्राम प्रति लीटर का 10-12 दिन के अंतराल पर छिड़काव करें।\n" +
        "• **सावधानी:** पत्तियों के ऊपर से पानी देने (ओवरहेड सिंचाई) से बचें और ड्रिप सिंचाई का प्रयोग करें।";
    }
    return "🍅 **Treatment for Early & Late Blight in Tomatoes:**\n\n" +
      "• **Identification:** Concentric brown 'bullseye' rings on lower leaves (Early Blight) or dark water-soaked lesions with white fungal mold during humidity (Late Blight).\n" +
      "• **Organic Control:** Prune and safely destroy all infected lower foliage. Spray organic Neem Oil (5ml/L) or *Trichoderma viride* (5g/L water).\n" +
      "• **Chemical Control:** Spray Mancozeb 75% WP @ 2.5g/L or Copper Oxychloride 50% WP @ 3g/L. In severe cases, apply Azoxystrobin + Difenoconazole @ 1ml/L.\n" +
      "• **Cultural Prevention:** Avoid overhead sprinkler irrigation to keep foliage dry. Apply organic straw mulch to stop fungal spores splashing from soil.";
  }

  // 2. Wheat Planting, Soil, Timing, and Fertilizer
  if (msg.includes('wheat') || msg.includes('गेहूं') || msg.includes('गेहू')) {
    if (isHi) {
      return "🌾 **गेहूं की उन्नत खेती (बुवाई, मिट्टी व सिंचाई गाइड):**\n\n" +
        "• **बुवाई का उपयुक्त समय:** 1 नवंबर से 25 नवंबर (रबी मौसम) सबसे उत्तम समय है।\n" +
        "• **मिट्टी व तैयारी:** अच्छी जल निकासी वाली दोमट या बलुई दोमट मिट्टी (pH 6.0 से 7.5)। खेत में 2-3 गहरी जुताई करें।\n" +
        "• **उर्वरक प्रबंधन (NPK):** 120 किग्रा नाइट्रोजन, 60 किग्रा फास्फोरस, और 40 किग्रा पोटाश प्रति हेक्टेयर।\n" +
        "• **क्रांतिक सिंचाई चरण:** बुवाई के 21 दिन बाद 'ताज जड़' (CRI स्टेज) पर पहली सिंचाई अत्यंत आवश्यक है। इसके बाद कल्ले फूटते समय और दाना भरते समय सिंचाई करें।\n" +
        "• **बीज उपचार:** बुवाई से पहले बीजों को कार्बेन्डाजिम (2 ग्राम/किग्रा बीज) से उपचारित करें।";
    }
    return "🌾 **Wheat Cultivation Guide (Timing, Soil & Irrigation):**\n\n" +
      "• **Optimal Sowing Window:** November 1st to November 25th (Rabi season) delivers maximum grain yield.\n" +
      "• **Soil Requirements:** Well-drained fertile loamy to clay-loam soil with optimal pH 6.0–7.5. Avoid saline or waterlogged soils.\n" +
      "• **Fertilizer Dose (NPK):** 120:60:40 kg/ha. Apply all Phosphorus and Potash with 1/3rd Nitrogen at sowing; apply remaining Nitrogen in two split top-dressings.\n" +
      "• **Critical Irrigation Stages:** Crown Root Initiation (CRI) at 21–25 days after sowing is vital. Subsequent irrigations at tillering, flowering, and grain milking stages.\n" +
      "• **Seed Rate & Treatment:** 100 kg/ha. Treat seeds with Carbendazim 50% WP @ 2g/kg seed before sowing.";
  }

  // 3. Rice / Paddy Cultivation
  if (msg.includes('rice') || msg.includes('paddy') || msg.includes('धान') || msg.includes('चावल')) {
    if (isHi) {
      return "🌾 **धान (Rice) की खेती एवं प्रबंधन:**\n\n" +
        "• **मौसम एवं रोपाई:** जून-जुलाई (खरीफ)। 21-25 दिन पुरानी नर्सरी पौध की रोपाई करें।\n" +
        "• **मिट्टी:** चिकनी दोमट मिट्टी (Clay Loam) जो जल धारण करने में सक्षम हो (pH 5.5-6.5)।\n" +
        "• **जल प्रबंधन:** रोपाई के समय 2-3 सेमी और कल्ले फूटने तक 5 सेमी पानी खेत में बनाए रखें।\n" +
        "• **पोषण:** NPK 100:50:50 किग्रा/हेक्टेयर + 25 किग्रा जिंक सल्फेट प्रति हेक्टेयर दें।\n" +
        "• **रोग रोकथाम:** ब्लास्ट (Blast) रोग से बचाव के लिए ट्राइसाइक्लाजोल (Tricyclazole) 0.6 ग्राम/लीटर का छिड़काव करें।";
    }
    return "🌾 **Rice / Paddy Production Guide:**\n\n" +
      "• **Timing & Sowing:** Transplant 21–25 day-old seedlings in June–July with the onset of monsoon.\n" +
      "• **Soil Requirement:** Heavy clay or clayey-loam with high water retention capacity (optimal pH 5.5–6.8).\n" +
      "• **Water Regime:** Maintain 2–3 cm standing water during transplanting and 5 cm during active tillering.\n" +
      "• **Nutrition:** NPK 120:60:40 kg/ha + 25 kg Zinc Sulfate per hectare to prevent Khaira disease.\n" +
      "• **Disease Control:** Spray Tricyclazole 75% WP @ 0.6g/L against Rice Blast, and Streptocycline for Bacterial Leaf Blight.";
  }

  // 4. Corn / Maize Management
  if (msg.includes('corn') || msg.includes('maize') || msg.includes('मक्का')) {
    if (isHi) {
      return "🌽 **मक्का (Maize/Corn) की फसल देखभाल:**\n\n" +
        "• **बुवाई का समय:** खरीफ (जून-जुलाई) या वसंतकालीन (फरवरी-मार्च)।\n" +
        "• **मिट्टी:** गहरी, उपजाऊ बलुई दोमट मिट्टी (pH 6.0-7.2)। खेत में जलनिकासी की अच्छी व्यवस्था होनी चाहिए।\n" +
        "• **कीट नियंत्रण (फॉल आर्मीवॉर्म):** फॉल आर्मीवॉर्म सुंडी दिखने पर इमामेक्टिन बेंजोएट (Emamectin Benzoate 5% SG) 0.4 ग्राम/लीटर पानी में घोलकर छिड़कें।\n" +
        "• **सिंचाई:** घुटने की ऊंचाई, नर मंजरी (Tasseling) और दाना बनने की अवस्था में पर्याप्त नमी बनाए रखें।";
    }
    return "🌽 **Corn / Maize Agronomic Advisory:**\n\n" +
      "• **Sowing Seasons:** Kharif (June–July) or Spring (February–March). Ensure row spacing of 60 cm x 20 cm.\n" +
      "• **Soil Profile:** Fertile, deep, well-aerated sandy loam with pH 6.0–7.2. Sensitive to water stagnation.\n" +
      "• **Fall Armyworm Management:** Scout whorls early. Spray Emamectin Benzoate 5% SG @ 0.4g/L or Spinetoram 11.7% SC @ 0.5ml/L at early instar stage.\n" +
      "• **Critical Moisture Stages:** Tasseling, silking, and grain filling stages are most moisture-critical.";
  }

  // 5. Potato Cultivation & Disease Care
  if (msg.includes('potato') || msg.includes('आलू')) {
    if (isHi) {
      return "🥔 **आलू की उन्नत खेती और रोग प्रबंधन:**\n\n" +
        "• **बुवाई का समय:** अक्टूबर से नवंबर का पहला पखवाड़ा।\n" +
        "• **मिट्टी:** भुरभुरी, जीवांशयुक्त बलुई दोमट मिट्टी (pH 5.2-6.5)। कंद बनने के लिए भुरभुरी मिट्टी जरूरी है।\n" +
        "• **झुलसा रोग (Blight):** पछेती झुलसा के प्रकोप पर साइमोक्सानिल + मैंकोजेब 2.5 ग्राम/लीटर का छिड़काव करें।\n" +
        "• **मिट्टी चढ़ाना (Earthing Up):** बुवाई के 30-35 दिन बाद पौधों पर मिट्टी अवश्य चढ़ाएं ताकि कंदों पर धूप न लगे।";
    }
    return "🥔 **Potato Crop Care & Disease Control:**\n\n" +
      "• **Planting Window:** October to mid-November for main autumn crop.\n" +
      "• **Soil Quality:** Friable, well-aerated sandy loam rich in organic humus (pH 5.2–6.4).\n" +
      "• **Late Blight Protection:** Spray Cymoxanil 8% + Mancozeb 64% WP @ 2.5g/L or Metalaxyl-M @ 2g/L at first sign of humid overcast weather.\n" +
      "• **Earthing Up:** Mound loose soil around stems at 30–35 days after planting to prevent greening of tubers.";
  }

  // 6. Fertilizer, Manure, Compost & Nutrition
  if (msg.includes('fertilizer') || msg.includes('manure') || msg.includes('npk') || msg.includes('urea') || msg.includes('dap') || msg.includes('खाद') || msg.includes('उर्वरक') || msg.includes('यूरिया') || msg.includes('गोबर')) {
    if (isHi) {
      return "🌱 **संतुलित उर्वरक एवं पोषण प्रबंधन:**\n\n" +
        "• **मिट्टी परीक्षण:** उर्वरक डालने से पहले अपने खेत का मृदा परीक्षण (Soil Health Card) अवश्य कराएं।\n" +
        "• **जैविक खाद:** प्रति एकड़ 3-4 टन अच्छी सड़ी गोबर की खाद या 1 टन केंचुआ खाद (वर्मीकम्पोस्ट) जुताई के समय मिलाएं।\n" +
        "• **NPK का सही अनुपात:** अनाज फसलों में 4:2:1 (नाइट्रोजन, फास्फोरस, पोटाश) और दलहनी फसलों में 1:2:2 का अनुपात रखें।\n" +
        "• **यूरिया का छिड़काव:** यूरिया को एक साथ न डालें। इसे 2-3 बराबर किस्तों में बांटकर सिंचाई के बाद नमी में दें।";
    }
    return "🌱 **Balanced Fertilizer & Soil Nutrition Plan:**\n\n" +
      "• **Soil Testing:** Always base chemical fertilizer applications on a certified Soil Health Card report to reduce input costs.\n" +
      "• **Organic Baseline:** Incorporate 8–10 tonnes/ha of well-rotted Farmyard Manure (FYM) or 2 tonnes of Vermicompost during basal plowing.\n" +
      "• **NPK Ratio Principles:** Use 4:2:1 (N:P:K) for cereal crops (Wheat, Corn) and 1:2:2 for legume crops (Soybean, Pulses).\n" +
      "• **Nitrogen Efficiency:** Never broadcast full Urea at once. Split Nitrogen into 3 doses: 50% basal, 25% at tillering, 25% before panicle emergence.";
  }

  // 7. Pest, Bug, Insect, Worm Control
  if (msg.includes('pest') || msg.includes('insect') || msg.includes('bug') || msg.includes('aphid') || msg.includes('worm') || msg.includes('कीट') || msg.includes('कीड़ा') || msg.includes('माहू') || msg.includes('इल्ली') || msg.includes('सुंडी')) {
    if (isHi) {
      return "🌿 **एकीकृत कीट प्रबंधन (IPM) सलाह:**\n\n" +
        "• **भौतिक नियंत्रण:** उड़ने वाले रस चूसक कीटों (माहू, सफेद मक्खी) के लिए प्रति एकड़ 6-8 पीले और नीले चिपचिपे कार्ड (Sticky Traps) लगाएं।\n" +
        "• **जैविक समाधान:** शुरुआती अवस्था में 10,000 PPM नीम का तेल (3-5 मिली प्रति लीटर पानी) मिलाकर 7 दिन के अंतराल पर छिड़कें।\n" +
        "• **सफेद मक्खी / थ्रिप्स:** प्रकोप बढ़ने पर इमिडाक्लोप्रिड 17.8% SL (0.5 मिली/लीटर) का छिड़काव करें।\n" +
        "• **इल्ली / कैटरपिलर:** बीटी (Bacillus thuringiensis) 2 ग्राम/लीटर या स्पाइनोसैड (Spinosad 45% SC) 0.3 मिली/लीटर का छिड़काव करें।";
    }
    return "🌿 **Integrated Pest Management (IPM) Strategy:**\n\n" +
      "• **Physical Traps:** Install 6–8 Yellow Sticky Traps per acre for aphids and whiteflies, and Blue Traps for thrips.\n" +
      "• **Organic Spray:** Apply cold-pressed Neem Oil (10,000 PPM) @ 3–5ml/L mixed with mild surfactant at first sighting.\n" +
      "• **Sucking Pests (Aphids, Jassids, Whiteflies):** Spray Imidacloprid 17.8% SL @ 0.5ml/L or Acetamiprid 20% SP @ 0.3g/L.\n" +
      "• **Caterpillars & Borers:** Apply bio-agent *Bacillus thuringiensis* (Bt) @ 2g/L or Spinosad 45% SC @ 0.3ml/L.";
  }

  // 8. Fungus, Rot, Mildew, Rust Diseases
  if (msg.includes('rust') || msg.includes('rot') || msg.includes('fungus') || msg.includes('mildew') || msg.includes('फफूंद') || msg.includes('फंगस') || msg.includes('सड़न') || msg.includes('रतुआ')) {
    if (isHi) {
      return "🛡️ **फफूंद जनित रोगों (Fungal Diseases) की रोकथाम:**\n\n" +
        "• **पहचान:** पत्तियों पर पीला/नारंगी पाउडर (Rust/रतुआ), सफेद चूर्ण (Powdery Mildew), या तने/जड़ पर सड़न (Root Rot)।\n" +
        "• **जड़ सड़न (Root Rot):** ट्राइकोडर्मा विरिडी 1 किग्रा को 50 किग्रा गोबर की खाद में मिलाकर जड़ों के पास डालें।\n" +
        "• **रतुआ व चूर्णिल आसिता (Mildew/Rust):** प्रोपिकोनाजोल (Propiconazole 25% EC) 1 मिली प्रति लीटर या घुलनशील गंधक (Sulfur 80% WDG) 2.5 ग्राम/लीटर का छिड़काव करें।\n" +
        "• **जल निकासी:** जड़ों के पास जलभराव न होने दें, क्योंकि नमी में फफूंद तेजी से फैलती है।";
    }
    return "🛡️ **Fungal Disease Protocol (Rust, Mildew & Rot):**\n\n" +
      "• **Diagnosis:** Orange/brown pustules on leaves indicate Rust; white powder indicates Powdery Mildew; blackened crown indicates Stem/Root Rot.\n" +
      "• **Root Rot Prevention:** Drench soil with *Trichoderma viride* or Carbendazim 50% WP @ 2g/L.\n" +
      "• **Rust & Leaf Spot Treatment:** Spray Propiconazole 25% EC @ 1ml/L or Tebuconazole 25.9% EC @ 1ml/L.\n" +
      "• **Powdery Mildew:** Spray Wettable Sulfur 80% WDG @ 2.5g/L or Dinocap @ 1ml/L.\n" +
      "• **Agronomic Tip:** Improve air circulation within the canopy and strictly avoid wet foliage overnight.";
  }

  // 9. Soil Health, Preparation, Testing & pH
  if (msg.includes('soil') || msg.includes('ph') || msg.includes('मिट्टी') || msg.includes('जमीन')) {
    if (isHi) {
      return "🌍 **मृदा स्वास्थ्य एवं तैयारी (Soil Health Guide):**\n\n" +
        "• **आदर्श pH मान:** अधिकांश फसलों के लिए 6.2 से 7.5 pH सबसे उपयुक्त होता है।\n" +
        "• **अम्लीय मिट्टी (Acidic, pH < 6.0):** खेत में बुवाई से 15 दिन पहले कृषि चूना (Agricultural Lime) 2-3 क्विंटल/एकड़ मिलाएं।\n" +
        "• **क्षारीय मिट्टी (Alkaline/Sodic, pH > 8.0):** खेत में जिप्सम (Gypsum) डालें और हरी खाद (ढैंचा) की जुताई करें।\n" +
        "• **संरचना सुधार:** मिट्टी की जलधारण क्षमता और केंचुओं की संख्या बढ़ाने के लिए प्रतिवर्ष 2-3 ट्रॉली जैविक खाद जरूर डालें।";
    }
    return "🌍 **Soil Health & Quality Optimization:**\n\n" +
      "• **Optimal pH Range:** Most agricultural crops perform best in pH 6.2 to 7.2.\n" +
      "• **Acidic Soils (pH < 6.0):** Apply Agricultural Limestone (CaCO3) @ 2–3 quintals/acre to neutralize acidity and unlock Phosphorus.\n" +
      "• **Alkaline/Sodic Soils (pH > 8.0):** Apply Agricultural Gypsum (CaSO4) and incorporate green manure (Sesbania/Dhaincha) to restore permeability.\n" +
      "• **Organic Carbon Boost:** Add well-decomposed cow dung manure or vermicompost to increase soil cation-exchange capacity and water-holding capacity.";
  }

  // 10. Irrigation, Water & Drought
  if (msg.includes('water') || msg.includes('irrigation') || msg.includes('पानी') || msg.includes('सिंचाई') || msg.includes('सूखा')) {
    if (isHi) {
      return "💧 **वैज्ञानिक सिंचाई प्रबंधन:**\n\n" +
        "• **सिंचाई का सही समय:** हमेशा सुबह (6-8 AM) या देर शाम को सिंचाई करें ताकि वाष्पीकरण से पानी का नुकसान न हो।\n" +
        "• **ड्रिप सिंचाई (Micro-Irrigation):** ड्रिप सिंचाई अपनाने से 45-50% जल की बचत होती है और खरपतवार नहीं पनपते।\n" +
        "• **नमी परीक्षण:** सिंचाई से पूर्व 4-6 इंच की गहराई पर मिट्टी की मुट्ठी बनाकर देखें; यदि मुट्ठी बंधती है तो सिंचाई की आवश्यकता नहीं है।\n" +
        "• **मल्चिंग:** तेज धूप में नमी को उड़ने से रोकने के लिए पौधों के चारों ओर पुआल या काली प्लास्टिक मल्च बिछाएं।";
    }
    return "💧 **Scientific Irrigation Management:**\n\n" +
      "• **Timing:** Irrigate strictly during early morning (6–8 AM) or dusk to reduce evapotranspiration losses by up to 35%.\n" +
      "• **Drip Irrigation:** Highly recommended for vegetables and orchards—saves 40–50% water and delivers fertilizers directly to the root zone.\n" +
      "• **Moisture Testing:** Check root depth (10–15 cm) by squeezing a handful of soil. If it holds shape without dripping, moisture is adequate.\n" +
      "• **Mulching:** Spread 2–3 inches of straw or organic mulch around stems to retain moisture and prevent weed growth.";
  }

  // 11. Seed Sowing, Treatment & Germination
  if (msg.includes('seed') || msg.includes('germination') || msg.includes('sow') || msg.includes('बीज') || msg.includes('अंकुरण') || msg.includes('बुवाई')) {
    if (isHi) {
      return "🌱 **बीज चयन, उपचार एवं बुवाई विधि:**\n\n" +
        "• **प्रमाणित बीज:** हमेशा विश्वसनीय स्रोत से प्रमाणित (Certified) व रोगमुक्त बीज ही खरीदें।\n" +
        "• **बीज उपचार (Seed Treatment):** बुवाई से पहले प्रति किग्रा बीज को 2 ग्राम थीरम/कार्बेन्डाजिम या 5 ग्राम ट्राइकोडर्मा से उपचारित करें। इससे जड़ गलन नहीं होता।\n" +
        "• **बुवाई की गहराई:** बीज को उसके आकार से 2 से 3 गुना गहराई (लगभग 3-5 सेमी) पर बोएं। अधिक गहरा बोने से अंकुरण प्रभावित होता है।\n" +
        "• **अंकुरण परीक्षण:** बुवाई से पहले 100 बीजों को गीले सूती कपड़े में 3 दिन रखकर अंकुरण प्रतिशत जांचें (कम से कम 80% अंकुरण होना चाहिए)।";
    }
    return "🌱 **Seed Treatment, Sowing & Germination:**\n\n" +
      "• **Quality Verification:** Purchase certified, high-germination hybrid seeds suitable for your local agro-climatic zone.\n" +
      "• **Seed Treatment (FIR Protocol):** Treat seeds with Fungicide (Thiram/Carbendazim @ 2g/kg), then Insecticide (Imidacloprid @ 3ml/kg), then Rhizobium/Azotobacter bio-fertilizer.\n" +
      "• **Sowing Depth:** Sow at a depth equal to 2–3 times the seed diameter (usually 3–5 cm in moist seedbed).\n" +
      "• **Germination Test:** Test 100 seeds in a moist cloth pouch for 72 hours; ensure at least 80–85% germination rate before field sowing.";
  }

  // 12. Default Helpful Farming Guidance
  if (isHi) {
    return "👨‍🌾 **नमस्ते किसान साथी! मैं आपका स्मार्ट कृषि सलाहकार हूँ।**\n\n" +
      "आप मुझसे किसी भी फसल या कृषि समस्या के बारे में पूछ सकते हैं, जैसे:\n" +
      "• 🌿 **फसल रोग:** टमाटर का झुलसा, गेहूं का रतुआ, पत्ती मरोड़, या फफूंद उपचार।\n" +
      "• 🌾 **फसल गाइड:** गेहूं, धान, मक्का, आलू, या सोयाबीन की बुवाई, मिट्टी और मौसम।\n" +
      "• 🌱 **खाद व पोषण:** NPK अनुपात, यूरिया की सही मात्रा, और वर्मीकम्पोस्ट।\n" +
      "• 🐛 **कीट नियंत्रण:** माहू, सुंडी, सफेद मक्खी, और नीम के तेल का उपयोग।\n\n" +
      "कृपया अपना प्रश्न विस्तार से लिखें!";
  }
  return "👨‍🌾 **Hello Farmer! I am your Smart Agricultural Expert.**\n\n" +
    "You can ask me any specific question about your farm, for example:\n" +
    "• 🌿 **Crop Diseases:** 'How to treat early blight on tomato?', 'Potato blight remedies', or 'Fungus on leaf'\n" +
    "• 🌾 **Crop Guides:** 'Best soil and timing for planting wheat', 'Rice sowing guide', or 'Corn pest control'\n" +
    "• 🌱 **Fertilizers:** 'NPK ratios for crops', 'Urea dosage', or 'How to improve soil pH'\n" +
    "• 🐛 **Pests:** 'How to get rid of aphids and whiteflies', or 'Neem oil dosage'\n\n" +
    "Please type your specific farming question above!";
}

// Curated Agricultural Knowledge Base for Weather-Adaptive Tips
const CURATED_TIPS = {
  en: {
    sunny: [
      "Irrigate crops early in the morning (6-8 AM) or late evening to minimize water evaporation loss.",
      "Apply organic mulch (straw or dried leaves) around root zones to retain soil moisture and reduce heat stress.",
      "Inspect crops for early signs of heat stress or wilting; provide shade cloth if cultivating sensitive nursery saplings.",
      "Ensure drip irrigation lines are clear of salt blockages for uniform water delivery under intense sunlight.",
      "Check soil moisture at root depth before irrigating to avoid overwatering while preventing dry root stress.",
      "Harvest tender leafy greens early in the morning when hydration is highest to preserve freshness."
    ],
    rainy: [
      "Ensure proper drainage in fields to prevent waterlogging, which causes root rot in standing crops.",
      "Postpone fertilizer and pesticide spraying until rain pauses to avoid expensive chemical runoff and wastage.",
      "Harvest mature vegetables and fruits before heavy downpours to prevent fungal contamination and fruit cracking.",
      "Regularly inspect field bunds and drainage trenches to prevent water overflow and topsoil erosion.",
      "Store harvested produce and seeds in elevated, moisture-proof containers to prevent mold growth."
    ],
    cloudy: [
      "Cloudy and humid weather encourages fungal spores; inspect leaf undersides for mildew or blight symptoms.",
      "Reduce irrigation frequency as evapotranspiration drops significantly on overcast days.",
      "Plan preventive bio-fungicide or neem oil applications if humidity remains high for consecutive days.",
      "Ensure adequate plant spacing to maximize air circulation and lower canopy dampness.",
      "Monitor for sap-sucking insects like aphids that thrive in shaded, humid conditions."
    ],
    windy: [
      "Stake tall plants (tomatoes, maize, peppers) to protect them from wind lodging and stem breakage.",
      "Avoid spraying pesticides or liquid fertilizers during high winds to prevent chemical drift hazards.",
      "Maintain windbreaks or shelterbelts on the windward side of fields to shield tender crops.",
      "Check greenhouse coverings and polyhouse fasteners for loose fittings before wind intensity increases."
    ],
    default: [
      "Test soil pH and organic matter periodically every season to optimize nutrient uptake and fertilizer costs.",
      "Practice crop rotation with legumes (pulses/beans) to naturally replenish soil nitrogen levels.",
      "Sanitize pruning tools and harvest shears with mild disinfectant to prevent spreading crop pathogens.",
      "Incorporate well-decomposed farmyard manure or vermicompost to improve soil structure and microbial life."
    ]
  },
  hi: {
    sunny: [
      "पानी के वाष्पीकरण को कम करने के लिए फसलों की सिंचाई सुबह जल्दी (6-8 बजे) या देर शाम को करें।",
      "मिट्टी की नमी बनाए रखने और तापमान नियंत्रित करने के लिए पौधों की जड़ों के पास पुआल या सूखे पत्तों की मल्चिंग करें।",
      "तेज धूप और लू से बचाने के लिए नाजुक नर्सरी पौधों पर शेड नेट का प्रयोग करें और मिट्टी में पर्याप्त नमी रखें।",
      "ड्रिप सिंचाई प्रणाली की जांच करें ताकि भीषण गर्मी में हर पौधे को समान रूप से पर्याप्त पानी मिले।",
      "सिंचाई से पहले जड़ की गहराई पर मिट्टी की नमी जांचें ताकि जरूरत से ज्यादा पानी न लगे और जड़ें स्वस्थ रहें।",
      "पत्तेदार सब्जियों की तुड़ाई सुबह जल्दी करें ताकि उनकी ताजगी और नमी बरकरार रहे।"
    ],
    rainy: [
      "खेतों में जल निकासी (ड्रेनेज) की उचित व्यवस्था करें ताकि जलभराव से फसलों की जड़ें न सड़ें।",
      "बारिश के दौरान कीटनाशकों और उर्वरकों का छिड़काव रोक दें ताकि दवा बहकर व्यर्थ न जाए।",
      "फफूंद रोग और फल फटने से बचाने के लिए पकी हुई सब्जियों और फलों की समय पर तुड़ाई कर लें।",
      "खेत की मेड़ों और नालियों की नियमित निगरानी करें ताकि मिट्टी का कटाव रोका जा सके।",
      "कटी हुई फसलों और बीजों को ऊंचे व सूखे स्थान पर रखें ताकि सीलन और फफूंद से बचाव हो सके।"
    ],
    cloudy: [
      "बादल छाए रहने और उच्च नमी में फफूंद जनित रोगों का खतरा बढ़ता है; पत्तियों के नीचे फफूंद के लक्षणों की जांच करें।",
      "धूप न निकलने के कारण मिट्टी से पानी कम उड़ता है, इसलिए आवश्यकता पड़ने पर ही हल्की सिंचाई करें।",
      "लगातार उमस और बादलों के मौसम में फसलों पर नीम के तेल या जैव-कवकनाशी का एहतियातन छिड़काव करें।",
      "पौधों के बीच उचित हवादार दूरी बनाए रखें ताकि पत्तियां जल्दी सूखें और रोग न फैलें।",
      "रस चूसक कीटों (जैसे माहू/एफिड्स) की निगरानी करें जो नम और छांव वाले मौसम में तेजी से पनपते हैं।"
    ],
    windy: [
      "तेज हवा से पौधों को गिरने और तना टूटने से बचाने के लिए लंबे पौधों (टमाटर, मक्का) को डंडों का सहारा दें।",
      "तेज हवा के समय कीटनाशक या खाद का छिड़काव न करें ताकि दवा उड़कर बर्बाद न हो।",
      "खेत के किनारे हवा रोकने वाले पेड़ या बाड़ (विंडब्रेक) लगाएं ताकि संवेदनशील फसलें सुरक्षित रहें।",
      "पॉलीहाउस और ग्रीनहाउस के पर्दों की जांच करें ताकि तेज आंधी में नुकसान न हो।"
    ],
    default: [
      "हर फसल चक्र के बाद मिट्टी की जांच (Soil Test) जरूर कराएं ताकि सही मात्रा में उर्वरक का उपयोग हो और लागत घटे।",
      "मिट्टी की प्राकृतिक उर्वरता बढ़ाने के लिए दलहनी फसलों के साथ फसल चक्र (Crop Rotation) अपनाएं।",
      "रोगों को एक पौधे से दूसरे में फैलने से रोकने के लिए औजारों और कैंची को साफ व रोगाणुरहित रखें।",
      "मिट्टी की संरचना और जलधारण क्षमता सुधारने के लिए सड़ी हुई गोबर की खाद या वर्मीकम्पोस्ट मिलाएं।"
    ]
  }
};

function getCuratedTips(weather = 'sunny', language = 'en') {
  const normWeather = (weather || 'sunny').toLowerCase();
  const langKey = language === 'hi' ? 'hi' : 'en';
  const categoryTips = CURATED_TIPS[langKey][normWeather] || CURATED_TIPS[langKey].default;
  const shuffled = [...categoryTips].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

// Tips endpoint with rate limiting
app.post('/get-tips', aiLimiter, async (req, res) => {
  const weather = req.body.weather || 'sunny';
  const language = req.body.language || 'en';

  const prompts = {
    en: {
      sunny: 'Give 3 short and clear farming tips for sunny weather in English.',
      rainy: 'Give 3 short and clear farming tips for rainy weather in English.',
      cloudy: 'Give 3 short and clear farming tips for cloudy weather in English.',
      default: 'Give 3 short and clear general farming tips in English.'
    },
    hi: {
      sunny: 'धूप वाले मौसम के लिए 3 संक्षिप्त और स्पष्ट कृषि युक्तियाँ हिंदी में दें।',
      rainy: 'बारिश वाले मौसम के लिए 3 संक्षिप्त और स्पष्ट कृषि युक्तियाँ हिंदी में दें।',
      cloudy: 'बादल वाले मौसम के लिए 3 संक्षिप्त और स्पष्ट कृषि युक्तियाँ हिंदी में दें।',
      default: '3 सामान्य कृषि युक्तियाँ हिंदी में दें।'
    }
  };

  const selectedPrompt =
    prompts[language]?.[weather.toLowerCase()] || prompts[language]?.default;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(selectedPrompt);
    let text = result.response.text();
   
    // Remove Gemini intro lines like "यहाँ तीन सामान्य कृषि युक्तियाँ ..."
    text = text
      .split('\n')
      .filter(line => !line.toLowerCase().includes('यहाँ') && !line.toLowerCase().includes('युक्तियाँ'))
      .join('\n');

    // Split tips based on numbers or bullets
    const tips = text
      .split(/\n+/)
      .map(line => line.trim())
      .filter(line => line && !line.toLowerCase().includes('tip'))
      .map(line => line.replace(/^\d+\.\s*/, '').replace(/^-/, '').trim());

    if (tips.length >= 2) {
      return res.json({ tips: tips.slice(0, 3), source: 'gemini' });
    }
    return res.json({ tips: getCuratedTips(weather, language), source: 'curated' });

  } catch (err) {
    console.warn(`[Tips] Gemini API unavailable (${err.message.substring(0, 80)}...). Serving curated farming tips.`);
    return res.json({ tips: getCuratedTips(weather, language), source: 'curated' });
  }
});

// ----- SERVER START -----
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`🌤️ Weather API enabled`);
  console.log(`🤖 Chatbot and Farming Tips enabled (Gemini 2.5 + Agronomic Engine)`);
});

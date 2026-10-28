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
    console.warn('[Chat] Gemini API unavailable, generating expert agricultural response:', error.message);
    
    // Smart agricultural fallback responder for common farming questions
    const msg = (message || '').toLowerCase();
    let reply = '';
    
    if (language === 'hi') {
      if (msg.includes('पानी') || msg.includes('सिंचाई') || msg.includes('water')) {
        reply = "💧 **सिंचाई सलाह:** फसलों में सुबह (6-8 AM) या शाम को पानी दें। ड्रिप सिंचाई से 40-50% पानी की बचत होती है और जड़ों में नमी बनी रहती है।";
      } else if (msg.includes('खाद') || msg.includes('उर्वरक') || msg.includes('fertilizer') || msg.includes('npk')) {
        reply = "🌱 **उर्वरक प्रबंधन:** रासायनिक उर्वरकों (NPK) के साथ वर्मीकम्पोस्ट या सड़ी गोबर खाद का प्रयोग करें। बुवाई से पूर्व मिट्टी परीक्षण (Soil Test) जरूर कराएं।";
      } else if (msg.includes('कीट') || msg.includes('रोग') || msg.includes('pest') || msg.includes('कीड़ा') || msg.includes('फफूंद')) {
        reply = "🌿 **कीट व रोग नियंत्रण:** शुरुआती प्रकोप में 5 मिली नीम तेल प्रति लीटर पानी में मिलाकर छिड़कें। रोगग्रस्त पत्तियों को तुरंत हटाकर नष्ट कर दें।";
      } else if (msg.includes('बीज') || msg.includes('seed')) {
        reply = "🌾 **बीज पहचान व बुवाई:** हमारे डैशबोर्ड के 'Seed Identification' फीचर में बीज की फोटो अपलोड करके रोपण विधि और सही मिट्टी की जानकारी पाएं।";
      } else {
        reply = "👨‍🌾 **नमस्ते किसान भाई!** मैं आपका स्मार्ट फार्मिंग सहायक हूँ। आप मुझसे मौसम, सिंचाई, खाद, बीज पहचान, या फसल रोगों के बारे में पूछ सकते हैं।";
      }
    } else {
      if (msg.includes('water') || msg.includes('irrigation')) {
        reply = "💧 **Irrigation Advice:** Water crops early in the morning (6-8 AM) or late evening to minimize evaporation. Drip irrigation saves 40-50% water while maintaining optimal root zone moisture.";
      } else if (msg.includes('fertilizer') || msg.includes('manure') || msg.includes('npk')) {
        reply = "🌱 **Fertilizer Management:** Balance chemical fertilizers with organic manure or vermicompost. Perform annual soil tests to apply accurate nitrogen, phosphorus, and potassium ratios.";
      } else if (msg.includes('pest') || msg.includes('disease') || msg.includes('bug') || msg.includes('fungus')) {
        reply = "🌿 **Pest & Disease Control:** For early infestations, spray organic neem oil solution (5ml per liter of water). Remove and safely dispose of diseased plant debris immediately.";
      } else if (msg.includes('seed')) {
        reply = "🌾 **Seed Guidance:** Upload a photo of your crop seed to our 'Seed Identification' tool on the dashboard for instant germination and planting guidelines.";
      } else {
        reply = "👨‍🌾 **Hello Farmer!** I am your Smart Farming Assistant. You can ask me about weather-based irrigation, fertilizer dosage, pest control, or seed planting guidance.";
      }
    }

    res.json({ response: reply, reply: reply, model: 'smart-farming-expert' });
  }
});

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

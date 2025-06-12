require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const path = require('path');

const app = express();


const PORT = process.env.PORT || 5000;

// ✅ 1. Proxy /predict BEFORE anything else

// ✅ Serve static files from Smart Farming UI folder
app.use(express.static(path.join(__dirname, '..')));

// ✅ Load dh.html as homepage
app.get('/', (req , res) => {
  res.sendFile(path.resolve(__dirname, '../dh.html'));
});


app.use(cors());
app.use(express.json());

// ----- WEATHER API LOGIC -----
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

// Route for current weather by coordinates
app.get('/weather', async (req, res) => {
  const { lat, lon, lang = 'en' } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=${lang}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Weather data fetch failed', detail: error.message });
  }
});

// Route to fetch coordinates from city name
app.get('/geocode', async (req, res) => {
  const { city } = req.query;
  if (!city) {
    return res.status(400).json({ error: 'City name is required' });
  }

  try {
    const geoURL = `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${WEATHER_API_KEY}`;
    const response = await axios.get(geoURL);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Geocoding failed', detail: error.message });
  }
});

// ----- CHATBOT API LOGIC -----
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Health check endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'Server is running', api: 'Smart Farming Assistant + Weather API' });
});

// Chat endpoint
app.post('/chat', async (req, res) => {
  const { message, language = 'en' } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
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

    res.json({ response: text, model: 'gemini-1.5-flash' });

  } catch (error) {
    console.error('AI Error:', error);
    const fallback = {
      en: "Our farming assistant is currently unavailable. Please try again later.",
      hi: "हमारा कृषि सहायक वर्तमान में उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।"
    };

    res.status(500).json({ 
      error: fallback[language] || fallback.en,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ----- SERVER START -----
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`🌤️ Weather API enabled`);
  console.log(`🤖 Chatbot using Gemini model: gemini-1.5-flash`);
});
app.post('/get-tips', async (req, res) => {
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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(selectedPrompt);
   let text = result.response.text();
   
// 🔥 Remove Gemini intro lines like "यहाँ तीन सामान्य कृषि युक्तियाँ ..."
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

    // Just send strings like ['Tip 1', 'Tip 2', 'Tip 3']
    res.json({ tips: tips.slice(0, 3) });

  } catch (err) {
    console.error('AI Tip Error:', err.message);
    res.status(500).json({ tips: ["⚠️ Unable to load tips."] });
  }
});


app.get('/get-weather', async (req, res) => {
  const { lat, lon, lang = 'en' } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=${lang}`;
    const response = await axios.get(url);
    const weather = response.data.weather[0].main.toLowerCase(); // e.g., 'sunny', 'rainy'
    res.json({ weather });
  } catch (error) {
    res.status(500).json({ error: 'Weather data fetch failed', detail: error.message });
  }
});

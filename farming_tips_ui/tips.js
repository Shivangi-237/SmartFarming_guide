const openBtn = document.getElementById('open-tips-btn');
const tipsBox = document.getElementById('tips-box');
const tipsContainer = document.getElementById('tips-container');
const moreBtn = document.getElementById('more-tips-btn');
const closeBtn = document.getElementById('close-tips-btn');
const langSelect = document.getElementById('language-select');
const weatherLabel = document.getElementById('weather-label');

let currentLanguage = window.appLanguage || 'en';

// Sync if global language changes
window.addEventListener('languageChanged', (e) => {
  if (e.detail && e.detail.lang) {
    currentLanguage = e.detail.lang;
    if (langSelect) langSelect.value = currentLanguage;
    if (tipsBox && tipsBox.classList.contains('show')) {
      const weather = (weatherLabel.textContent.split(': ')[1] || 'sunny').toLowerCase();
      fetchTips(weather);
    }
  }
});

if (openBtn) {
  openBtn.addEventListener('click', async () => {
    tipsBox.style.display = 'block';
    tipsBox.classList.add('show');
    positionTipsBox();

    // Load weather and tips
    const weather = await getWeather();
    weatherLabel.textContent = `🌤 Weather: ${weather}`;
    await fetchTips(weather);
    requestAnimationFrame(positionTipsBox);
  });
}

function loaderMarkup() {
  return `
    <div class="loading-wrap">
      <div class="loading-spinner"></div>
      <strong>Loading tips…</strong>
    </div>`;
}

// Single click handler for More Tips
if (moreBtn) {
  moreBtn.addEventListener('click', async () => {
    const weather = (weatherLabel.textContent.split(': ')[1] || 'sunny').toLowerCase();
    tipsContainer.innerHTML = loaderMarkup();
    await fetchTips(weather);
    positionTipsBox();
  });
}

if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    tipsBox.classList.remove('show');
    setTimeout(() => {
      tipsBox.style.display = 'none';
    }, 300);
  });
}

if (langSelect) {
  langSelect.addEventListener('change', async () => {
    currentLanguage = langSelect.value;
    if (window.setAppLanguage) {
      window.setAppLanguage(currentLanguage);
    }
    const weather = (weatherLabel.textContent.split(': ')[1] || 'sunny').toLowerCase();
    tipsContainer.innerHTML = '';
    await fetchTips(weather);
  });
}

async function getWeather() {
  try {
    if (!navigator.geolocation) return 'sunny';
    const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 7000 }));
    const { latitude, longitude } = pos.coords;
    const res = await fetch(`http://localhost:5000/get-weather?lat=${latitude}&lon=${longitude}`);
    const data = await res.json();
    return data.weather || 'sunny';
  } catch (err) {
    return 'sunny';
  }
}

const LOCAL_FALLBACK_TIPS = {
  en: {
    sunny: [
      "Irrigate crops early in the morning (6-8 AM) or late evening to minimize evaporation loss.",
      "Apply organic mulch (straw or dried leaves) around root zones to retain soil moisture.",
      "Check soil moisture at root depth before watering to prevent both waterlogging and heat stress."
    ],
    rainy: [
      "Ensure proper drainage trenches in fields to prevent waterlogging and root rot.",
      "Postpone fertilizer and pesticide spraying until rain stops to avoid chemical runoff.",
      "Harvest mature fruits and vegetables before heavy downpours to avoid fungal damage."
    ],
    cloudy: [
      "Inspect leaf undersides regularly for early mildew or blight in high humidity.",
      "Reduce irrigation frequency as soil moisture evaporates slower under overcast skies.",
      "Maintain spacing between crops to allow air circulation and keep foliage dry."
    ],
    default: [
      "Test soil pH and nutrients every season to optimize crop yield and reduce fertilizer costs.",
      "Practice crop rotation with legumes (beans/peas) to naturally restore soil nitrogen.",
      "Keep tools and harvesting shears sanitized to avoid spreading plant diseases."
    ]
  },
  hi: {
    sunny: [
      "वाष्पीकरण रोकने के लिए फसलों की सिंचाई सुबह जल्दी (6-8 बजे) या देर शाम को करें।",
      "मिट्टी में नमी बनाए रखने के लिए पौधों की जड़ों के पास पुआल या सूखे पत्तों की मल्चिंग करें।",
      "अत्यधिक धूप से बचाने के लिए नाजुक पौधों पर शेड नेट लगाएं और नमी बनाए रखें।"
    ],
    rainy: [
      "खेतों में जल निकासी (ड्रेनेज) की उचित व्यवस्था करें ताकि जलभराव से जड़ें न सड़ें।",
      "बारिश के दौरान कीटनाशकों और खादों का छिड़काव रोक दें ताकि वे बहकर बर्बाद न हों।",
      "फफूंद और फटने से बचाने के लिए पकी फसलों और सब्जियों की समय पर तुड़ाई कर लें।"
    ],
    cloudy: [
      "बादल और नमी में फफूंद का खतरा बढ़ता है; पत्तियों के नीचे फफूंद के लक्षणों की जांच करें।",
      "धूप कम होने से मिट्टी में नमी देर तक रहती है, इसलिए जरूरत पड़ने पर ही हल्की सिंचाई करें।",
      "हवा का संचार बनाए रखने के लिए पौधों के बीच पर्याप्त दूरी रखें ताकि पत्तियां सूखी रहें।"
    ],
    default: [
      "हर मौसम में मिट्टी की जांच (Soil Test) जरूर कराएं ताकि सही मात्रा में खाद का उपयोग हो।",
      "मिट्टी की उर्वरता बढ़ाने के लिए दलहनी फसलों के साथ फसल चक्र (Crop Rotation) अपनाएं।",
      "फसल में रोगों को फैलने से रोकने के लिए औजारों और कैंची को साफ व रोगाणुरहित रखें।"
    ]
  }
};

function getLocalFallbackTips(weather, lang) {
  const normWeather = (weather || 'sunny').toLowerCase();
  const langKey = lang === 'hi' ? 'hi' : 'en';
  return LOCAL_FALLBACK_TIPS[langKey][normWeather] || LOCAL_FALLBACK_TIPS[langKey].default;
}

async function fetchTips(weather) {
  try {
    tipsContainer.innerHTML = loaderMarkup();

    const res = await fetch('http://localhost:5000/get-tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weather,
        language: currentLanguage
      })
    });

    const data = await res.json();
    tipsContainer.innerHTML = '';

    let tips = (data.tips || []).filter(tip =>
      !tip.toLowerCase().includes('यहाँ') &&
      !tip.toLowerCase().includes('युक्तियाँ') &&
      !tip.includes('Unable to load')
    );

    if (tips.length === 0) {
      tips = getLocalFallbackTips(weather, currentLanguage);
    }

    tips.slice(0, 3).forEach(tip => {
      const tipCard = document.createElement('div');
      tipCard.className = 'tip-card';
      tipCard.textContent = tip;
      tipsContainer.appendChild(tipCard);
    });

  } catch (err) {
    tipsContainer.innerHTML = '';
    const fallback = getLocalFallbackTips(weather, currentLanguage);
    fallback.forEach(tip => {
      const tipCard = document.createElement('div');
      tipCard.className = 'tip-card';
      tipCard.textContent = tip;
      tipsContainer.appendChild(tipCard);
    });
  }
}

function positionTipsBox() {
  if (!openBtn || !tipsBox) return;
  const btnRect = openBtn.getBoundingClientRect();
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
  const boxWidth = tipsBox.offsetWidth || 320;
  const boxHeight = tipsBox.offsetHeight || 380;
  const viewportHeight = window.innerHeight;

  let top = btnRect.top + scrollTop - boxHeight - 12;
  let openBelow = top < 10 || btnRect.top < viewportHeight / 2;

  if (openBelow) {
    top = btnRect.bottom + scrollTop + 12;
  }

  let left = btnRect.left + scrollLeft + (btnRect.width / 2) - (boxWidth / 2);
  left = Math.max(10, Math.min(left, window.innerWidth - boxWidth - 10));

  tipsBox.style.left = `${left}px`;
  tipsBox.style.top = `${top}px`;
}

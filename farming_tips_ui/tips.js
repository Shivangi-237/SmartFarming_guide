const openBtn = document.getElementById('open-tips-btn');
const tipsBox = document.getElementById('tips-box');
const tipsContainer = document.getElementById('tips-container');
const moreBtn = document.getElementById('more-tips-btn');
const closeBtn = document.getElementById('close-tips-btn');
const langSelect = document.getElementById('language-select');
const weatherLabel = document.getElementById('weather-label');

let currentLanguage = 'en';

openBtn.addEventListener('click', async () => {
  tipsBox.style.display = 'block';
  tipsBox.classList.add('show');
  positionTipsBox(); // ✅ Show box first

  //  Load data in background
  const weather = await getWeather();
  weatherLabel.textContent = `🌤 Weather: ${weather}`;
  await fetchTips(weather,false); // This will only render 3 tips now

  requestAnimationFrame(positionTipsBox);   // reposition once real height is known
});
function loaderMarkup(){
  return `
    <div class="loading-wrap">
      <div class="loading-spinner"></div>
      <strong>Loading tips…</strong>
    </div>`;
}


moreBtn.addEventListener('click', async () => {
  const weather = weatherLabel.textContent.split(': ')[1];

  // Optional: Clear old tips visually
  tipsContainer.innerHTML = loaderMarkup();

  await fetchTips(weather); // no append mode now
  positionTipsBox();
});


closeBtn.addEventListener('click', () => {
  tipsBox.classList.remove('show');
  setTimeout(() => {
    tipsBox.style.display = 'none';
  }, 300);
});

langSelect.addEventListener('change', async () => {
  currentLanguage = langSelect.value;
  const weather = weatherLabel.textContent.split(': ')[1];
  tipsContainer.innerHTML = '';
  await fetchTips(weather);
});

moreBtn.addEventListener('click', async () => {
  tipsContainer.innerHTML = '';
  const weather = weatherLabel.textContent.split(': ')[1];
  await fetchTips(weather);
});

async function getWeather() {
  try {
    const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
    const { latitude, longitude } = pos.coords;
    const res = await fetch(`http://localhost:5000/get-weather?lat=${latitude}&lon=${longitude}`);
    const data = await res.json();
    return data.weather || 'sunny';
  } catch {
    return 'sunny';
  }
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

    if (currentLanguage === 'hi') {
      const intro = document.createElement('div');
      
    }

    // Remove Gemini-generated intro lines like "यहाँ ..." or containing "युक्तियाँ"
const cleanTips = data.tips.filter(tip =>
  !tip.toLowerCase().includes('यहाँ') &&
  !tip.toLowerCase().includes('युक्तियाँ')
);

// Slice top 3 clean tips
cleanTips.slice(0, 3).forEach(tip => {
  const tipCard = document.createElement('div');
  tipCard.className = 'tip-card';
  tipCard.textContent = tip;
  tipsContainer.appendChild(tipCard);
});


  } catch (err) {
    tipsContainer.innerHTML = '<div class="tip-card">⚠️ Unable to load tips.</div>';
  }
}




function positionTipsBox() {
  const btnRect = openBtn.getBoundingClientRect();
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
  const boxWidth = tipsBox.offsetWidth;
  const boxHeight = tipsBox.offsetHeight;
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
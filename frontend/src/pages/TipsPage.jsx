import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { fetchFarmingTips } from '../services/api';

const LOCAL_TIPS = {
  en: [
    { title: "Soil Moisture Conservation", category: "Soil Health", text: "Apply organic mulch (straw or crop residues) 2-3 inches deep to reduce evaporation, suppress weed germination, and moderate soil temperature.", icon: "fa-seedling" },
    { title: "Smart Furrow Irrigation", category: "Water Management", text: "Irrigate crops during early morning or late evening hours to minimize water loss from high evapotranspiration and solar heat.", icon: "fa-droplets" },
    { title: "Rabi Season Wheat Planting", category: "Rabi Crops", text: "Optimum planting window is mid-November. Ensure balanced NPK fertilizer application (120:60:40 kg/ha) with first irrigation at crown root initiation.", icon: "fa-wheat-awn" },
    { title: "Integrated Pest Management (IPM)", category: "Pest Control", text: "Use yellow and blue sticky traps for aphids and whiteflies. Spray neem oil (5ml/L water) at early pest emergence before using chemical pesticides.", icon: "fa-shield-halved" },
    { title: "Kharif Monsoon Drainage", category: "Kharif Crops", text: "Ensure proper field gradient and clean drainage trenches to prevent stagnant waterlogging, which induces fungal root rot in pulses and cotton.", icon: "fa-cloud-rain" },
    { title: "Organic Green Manuring", category: "Soil Health", text: "Sow Dhaincha or Sunhemp prior to paddy transplanting and plough it back into the soil at 45 days to enhance organic nitrogen and soil porosity.", icon: "fa-recycle" }
  ],
  hi: [
    { title: "मिट्टी की नमी संरक्षण", category: "मृदा स्वास्थ्य", text: "वाष्पीकरण रोकने और खरपतवार नियंत्रण के लिए 2-3 इंच गहरी जैविक मल्चिंग (पुआल या सूखे पत्ते) बिछाएं।", icon: "fa-seedling" },
    { title: "स्मार्ट नालीदार सिंचाई", category: "जल प्रबंधन", text: "तेज धूप और वाष्पीकरण से पानी का नुकसान रोकने के लिए सुबह जल्दी या शाम के समय सिंचाई करें।", icon: "fa-droplets" },
    { title: "रबी गेहूं की उन्नत बुवाई", category: "रबी फसलें", text: "बुवाई का सबसे सही समय नवंबर का दूसरा पखवाड़ा है। ताज जड़ निकलते समय (21-25 दिन) पहली सिंचाई अवश्य करें।", icon: "fa-wheat-awn" },
    { title: "एकीकृत कीट प्रबंधन (आईपीएम)", category: "कीट नियंत्रण", text: "माहू और सफेद मक्खी के लिए पीले स्टिकी ट्रैप लगाएं। रासायनिक कीटनाशकों से पहले नीम के तेल (5 मिली प्रति लीटर) का छिड़काव करें।", icon: "fa-shield-halved" },
    { title: "खरीफ में जलभराव से बचाव", category: "खरीफ फसलें", text: "खेतों में पानी जमा होने से रोकने के लिए जलनिकासी की नालियां साफ रखें, जिससे दलहनी फसलों में जड़ गलन रोग न हो।", icon: "fa-cloud-rain" },
    { title: "हरी खाद का उपयोग", category: "मृदा स्वास्थ्य", text: "धान रोपाई से पहले ढैंचा या सनई बोएं और 45 दिन बाद खेत में जुताई कर मिला दें ताकि जैविक नाइट्रोजन बढ़ सके।", icon: "fa-recycle" }
  ]
};

export default function TipsPage() {
  const { lang } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTips = async () => {
      setLoading(true);
      try {
        const data = await fetchFarmingTips(selectedCategory, lang);
        if (data && data.tips && Array.isArray(data.tips)) {
          setTips(data.tips);
        } else {
          setTips(LOCAL_TIPS[lang] || LOCAL_TIPS.en);
        }
      } catch (err) {
        setTips(LOCAL_TIPS[lang] || LOCAL_TIPS.en);
      } finally {
        setLoading(false);
      }
    };
    loadTips();
  }, [selectedCategory, lang]);

  const categories = [
    { id: 'all', label: lang === 'hi' ? 'सभी सुझाव' : 'All Advice' },
    { id: 'soil', label: lang === 'hi' ? 'मृदा स्वास्थ्य' : 'Soil Health' },
    { id: 'water', label: lang === 'hi' ? 'सिंचाई / जल' : 'Irrigation' },
    { id: 'pest', label: lang === 'hi' ? 'कीट प्रबंधन' : 'Pest Control' },
    { id: 'crops', label: lang === 'hi' ? 'मौसमी फसलें' : 'Seasonal Crops' }
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <h1 style={{ fontSize: '2.4rem', color: '#064e3b', marginBottom: '8px' }}>
          💡 {lang === 'hi' ? 'विशेषज्ञ कृषि नुस्खे व मार्गदर्शन' : 'Expert Farming Tips & Guidance'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          {lang === 'hi'
            ? 'वैज्ञानिक दृष्टिकोण और मौसमी अनुभव पर आधारित टिकाऊ खेती के उपाय'
            : 'Evidence-based agronomic tips for higher crop yields and sustainable farming'}
        </p>
      </div>

      {/* Category Pills */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '10px',
        flexWrap: 'wrap',
        marginBottom: '36px'
      }}>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            style={{
              padding: '8px 20px',
              borderRadius: '24px',
              fontWeight: '600',
              fontSize: '0.9rem',
              background: selectedCategory === c.id ? '#10b981' : '#ffffff',
              color: selectedCategory === c.id ? '#ffffff' : '#475569',
              border: '1px solid',
              borderColor: selectedCategory === c.id ? '#10b981' : '#cbd5e1',
              boxShadow: selectedCategory === c.id ? '0 4px 12px rgba(16,185,129,0.3)' : 'var(--shadow-sm)'
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner"></div>
        </div>
      )}

      {/* Tips Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px'
      }}>
        {tips.map((t, idx) => (
          <div
            key={idx}
            className="glass-card"
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              borderLeft: '4px solid #10b981'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#ecfdf5',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem'
              }}>
                <i className={`fa-solid ${t.icon || 'fa-seedling'}`}></i>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {t.category || 'Agronomy'}
                </span>
                <h3 style={{ fontSize: '1.15rem', color: '#064e3b' }}>
                  {t.title}
                </h3>
              </div>
            </div>

            <p style={{ color: '#475569', fontSize: '0.92rem', lineHeight: '1.6' }}>
              {t.text || t.tip || t.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}


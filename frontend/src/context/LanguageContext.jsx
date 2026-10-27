import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  en: {
    appTitle: "Smart Farming Guide",
    heroTitle: "Empowering Farmers with AI Technology",
    heroSubtitle: "Get instant diagnosis for plant diseases, seed identification, live weather advisories, and agronomic guidance.",
    exploreBtn: "Explore Features",
    navHome: "Home",
    navWeather: "Weather Forecast",
    navTips: "Farming Tips",
    navLogin: "Login",
    navSignup: "Sign Up",
    navLogout: "Logout",
    
    // Feature Cards
    cardDiseaseTitle: "Disease Detection",
    cardDiseaseDesc: "Upload plant leaves to instantly detect diseases with AI confidence & treatment recommendations.",
    cardDiseaseBtn: "Diagnose Plant",
    
    cardSeedTitle: "Seed Identification",
    cardSeedDesc: "Identify crop seeds (Wheat, Rice, Corn, Apple, etc.) and receive tailored planting guidance.",
    cardSeedBtn: "Identify Seed",
    
    cardWeatherTitle: "Weather Forecast",
    cardWeatherDesc: "Get real-time hyperlocal weather updates and agricultural advisories for your farm.",
    cardWeatherBtn: "View Weather",
    
    cardTipsTitle: "Farming Tips",
    cardTipsDesc: "Seasonal recommendations, crop rotation, soil care, and pest management guidance.",
    cardTipsBtn: "Read Tips",

    // Modals
    modalDiseaseTitle: "Plant Disease Detection",
    modalDiseasePrompt: "Upload a clear photo of the infected crop leaf",
    modalSeedTitle: "Crop Seed Identification",
    modalSeedPrompt: "Select an image of crop seeds (Apple, Wheat, Rice, Corn, etc.)",
    chooseFile: "Choose File",
    noFileChosen: "No file chosen",
    analyzing: "Analyzing with AI...",
    identifying: "Identifying Seed...",
    close: "Close",
    confidence: "Model Confidence",
    recommendation: "Planting Recommendations",
    
    // Quick Links & Footer
    quickLinks: "Quick Links",
    contactUs: "Contact Support",
    rights: "All rights reserved. Dedicated to modern digital agriculture."
  },
  hi: {
    appTitle: "स्मार्ट फार्मिंग गाइड",
    heroTitle: "एआई तकनीक से किसानों का सशक्तिकरण",
    heroSubtitle: "फसलों के रोगों का त्वरित निदान, बीज पहचान, लाइव मौसम सलाह और कृषि संबंधी मार्गदर्शन प्राप्त करें।",
    exploreBtn: "सुविधाएं देखें",
    navHome: "होम",
    navWeather: "मौसम पूर्वानुमान",
    navTips: "खेती के नुस्खे",
    navLogin: "लॉग इन",
    navSignup: "साइन अप",
    navLogout: "लॉग आउट",
    
    // Feature Cards
    cardDiseaseTitle: "फसल रोग पहचान",
    cardDiseaseDesc: "एआई द्वारा पौधों की पत्तियों के रोगों की तुरंत पहचान और उपचार संबंधी सलाह पाएं।",
    cardDiseaseBtn: "रोग पहचानें",
    
    cardSeedTitle: "बीज पहचान",
    cardSeedDesc: "फसलों के बीजों (गेहूं, चावल, मक्का, सेब आदि) की पहचान करें और सही बुवाई सलाह प्राप्त करें।",
    cardSeedBtn: "बीज पहचानें",
    
    cardWeatherTitle: "मौसम पूर्वानुमान",
    cardWeatherDesc: "अपने खेत के लिए लाइव मौसम और वर्षा/हवा आधारित कृषि सलाह प्राप्त करें।",
    cardWeatherBtn: "मौसम देखें",
    
    cardTipsTitle: "खेती के नुस्खे",
    cardTipsDesc: "मौसमी फसल सलाह, फसल चक्र, मिट्टी की देखभाल और कीट प्रबंधन सुझाव।",
    cardTipsBtn: "सुझाव पढ़ें",

    // Modals
    modalDiseaseTitle: "पौधों के रोग की जांच",
    modalDiseasePrompt: "संक्रमित पत्ते की एक स्पष्ट तस्वीर अपलोड करें",
    modalSeedTitle: "फसल बीज की पहचान",
    modalSeedPrompt: "फसल बीज की फोटो चुनें (सेब, गेहूं, चावल, मक्का आदि)",
    chooseFile: "फाइल चुनें",
    noFileChosen: "कोई फाइल नहीं चुनी गई",
    analyzing: "एआई द्वारा विश्लेषण जारी है...",
    identifying: "बीज की पहचान की जा रही है...",
    close: "बंद करें",
    confidence: "सटीकता / विश्वास",
    recommendation: "रोपण संबंधी सिफारिशें",
    
    // Quick Links & Footer
    quickLinks: "त्वरित लिंक",
    contactUs: "सहायता संपर्क",
    rights: "सर्वाधिकार सुरक्षित। आधुनिक डिजिटल कृषि को समर्पित।"
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('smart_farm_lang') || 'en';
  });

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'hi' : 'en';
    setLang(nextLang);
    localStorage.setItem('smart_farm_lang', nextLang);
  };

  const t = translations[lang] || translations.en;

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

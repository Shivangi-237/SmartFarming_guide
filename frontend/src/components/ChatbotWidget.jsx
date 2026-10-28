import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { sendChatMessage } from '../services/api';

export default function ChatbotWidget() {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [chatLang, setChatLang] = useState(lang);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: lang === 'hi'
        ? '🌾 नमस्ते किसान भाई! मैं आपका स्मार्ट फार्मिंग सहायक हूँ। आप मुझसे फसल रोग, बीज, मौसम या खेती संबंधी कोई भी सवाल पूछ सकते हैं।'
        : '🌾 Hello Farmer! I am your Smart Farming Assistant. You can ask me about crop diseases, planting advice, weather irrigation, or general agronomy.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setChatLang(lang);
  }, [lang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Text to Speech
  const speakText = (text) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = chatLang === 'hi' ? 'hi-IN' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  // Speech to Text (Mic input)
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported on this browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = chatLang === 'hi' ? 'hi-IN' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.start();
  };

  const handleSend = async (messageText = input) => {
    const textToSend = messageText.trim();
    if (!textToSend || loading) return;

    const userMsg = { sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await sendChatMessage(textToSend, chatLang);
      const botReply = data.response || data.reply || data.message || (chatLang === 'hi' ? 'उत्तर प्राप्त करने में असमर्थ।' : 'Unable to get answer.');
      setMessages((prev) => [...prev, { sender: 'bot', text: botReply }]);
      speakText(botReply);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: chatLang === 'hi'
            ? 'क्षमा करें, सर्वर से संपर्क नहीं हो पाया। कृपया पुनः प्रयास करें।'
            : 'Sorry, unable to connect to AI assistant. Please try again.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickChips = [
    { label: chatLang === 'hi' ? '🌿 फसल रोग' : '🌿 Disease Help', prompt: chatLang === 'hi' ? 'टमाटर के पत्तों पर पीले धब्बों का इलाज बताएं' : 'How to treat early blight on tomato leaves?' },
    { label: chatLang === 'hi' ? '🌱 बीज रोपण' : '🌱 Seed Planting', prompt: chatLang === 'hi' ? 'गेहूं बोने का सही समय और तरीका क्या है?' : 'What is the best soil and timing for planting wheat?' },
    { label: chatLang === 'hi' ? '🌦️ सिंचाई सलाह' : '🌦️ Weather Irrigation', prompt: chatLang === 'hi' ? 'बारिश के मौसम में सिंचाई कैसे करें?' : 'How should I manage irrigation when rain is forecasted?' }
  ];

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 999 }}>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #047857)',
            color: '#ffffff',
            fontSize: '1.6rem',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          title="Ask AI Smart Farming Assistant"
        >
          <i className="fa-solid fa-robot"></i>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          width: '380px',
          maxWidth: '92vw',
          height: '560px',
          maxHeight: '82vh',
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.25s ease-out'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #065f46, #10b981)',
            padding: '16px 20px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="fa-solid fa-seedling"></i>
              </div>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: '700' }}>Smart Farm AI</h4>
                <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                  {chatLang === 'hi' ? 'ऑनलाइन सहायक' : 'Gemini 2.5 Online'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={chatLang}
                onChange={(e) => setChatLang(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="en" style={{ color: '#000' }}>EN</option>
                <option value="hi" style={{ color: '#000' }}>हिंदी</option>
              </select>

              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', color: '#ffffff', fontSize: '1.2rem' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          {/* Quick Action Chips */}
          <div style={{
            padding: '8px 12px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto'
          }}>
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip.prompt)}
                style={{
                  whiteSpace: 'nowrap',
                  fontSize: '0.78rem',
                  padding: '4px 10px',
                  borderRadius: '14px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#334155'
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  padding: '10px 14px',
                  borderRadius: m.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: m.sender === 'user' ? '#10b981' : '#ffffff',
                  color: m.sender === 'user' ? '#ffffff' : '#1e293b',
                  fontSize: '0.9rem',
                  lineHeight: '1.45',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  border: m.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {m.text}
              </div>
            ))}

            {loading && (
              <div style={{ alignSelf: 'flex-start', background: '#ffffff', padding: '10px 14px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>
                  {chatLang === 'hi' ? 'उत्तर तैयार हो रहा है...' : 'Generating answer...'}
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Controls Bar */}
          <div style={{ padding: '6px 16px', background: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              style={{
                fontSize: '0.78rem',
                color: voiceEnabled ? '#10b981' : '#94a3b8',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <i className={`fa-solid ${voiceEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
              Voice Output: {voiceEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: '10px 14px',
              background: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <button
              type="button"
              onClick={toggleListening}
              style={{
                background: isListening ? '#ef4444' : '#f1f5f9',
                color: isListening ? '#ffffff' : '#64748b',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              title="Voice Input (Speech-to-Text)"
            >
              <i className="fa-solid fa-microphone"></i>
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={chatLang === 'hi' ? 'खेती से जुड़ा सवाल पूछें...' : 'Ask an agricultural question...'}
              style={{
                flex: 1,
                border: '1px solid #cbd5e1',
                borderRadius: '20px',
                padding: '8px 14px',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              style={{
                background: '#10b981',
                color: '#ffffff',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                opacity: (!input.trim() || loading) ? 0.5 : 1
              }}
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}


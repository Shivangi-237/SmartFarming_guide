import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ChatbotWidget from './components/ChatbotWidget';
import Dashboard from './pages/Dashboard';
import WeatherPage from './pages/WeatherPage';
import TipsPage from './pages/TipsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

export default function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/weather" element={<WeatherPage />} />
            <Route path="/tips" element={<TipsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <ChatbotWidget />
      </div>
    </Router>
  );
}

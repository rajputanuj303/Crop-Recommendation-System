import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Home from './pages/Home';
import FarmAIPage from './pages/FarmAIPage';
import CropPriceFinder from './pages/CropPriceFinder';
import './App.css';
import './i18n';

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { i18n, t } = useTranslation();
  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'mr', label: 'मराठी' },
    { code: 'ta', label: 'தமிழ்' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'or', label: 'ଓଡ଼ିଆ' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  ];

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="App">
        {/* Navigation */}
        <nav className="sticky top-0 z-40 bg-gradient-to-r from-emerald-600 via-emerald-500 to-sky-600 text-white shadow-lg">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-center py-3">
              <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white select-none" onClick={() => setMobileOpen(false)}>
                <img
                  src="https://cdn-icons-png.flaticon.com/512/7417/7417717.png"
                  alt="KrishiMitra logo"
                  className="w-7 h-7 rounded"
                />
                <span>KrishiMitra</span>
              </Link>
              {/* Desktop nav */}
              <div className="hidden md:flex items-center gap-1 sm:gap-2">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                      isActive ? 'bg-white/20 text-white shadow' : 'text-white/90 hover:bg-white/10 hover:text-white'
                    }`
                  }
                  end
                >
                  {t('Home')}
                </NavLink>
                <NavLink
                  to="/farm-ai"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                      isActive ? 'bg-white/20 text-white shadow' : 'text-white/90 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  {t('FarmAI / KrishiAI')}
                </NavLink>
                <NavLink
                  to="/prices"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                      isActive ? 'bg-white/20 text-white shadow' : 'text-white/90 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  Crop-Price-Finder AI
                </NavLink>
                <div className="ml-2">
                  <select
                    aria-label="Select language"
                    value={i18n.language}
                    onChange={(e) => i18n.changeLanguage(e.target.value)}
                    className="bg-white/15 text-white text-sm rounded-full px-3 py-2 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
                  >
                    {languages.map((l) => (
                      <option key={l.code} value={l.code} className="text-black">{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Mobile hamburger */}
              <button
                type="button"
                className="md:hidden inline-flex items-center justify-center p-2 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                aria-controls="mobile-menu"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((v) => !v)}
              >
                {mobileOpen ? (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {/* Mobile menu panel */}
          <div id="mobile-menu" className={`md:hidden transition-all ${mobileOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
            <div className="px-4 pb-3 space-y-2 bg-emerald-700/95 backdrop-blur">
              <NavLink
                to="/"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block w-full text-left px-4 py-2 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-white/20 text-white shadow' : 'text-white/90 hover:bg-white/10 hover:text-white'
                  }`
                }
                end
              >
                {t('Home')}
              </NavLink>
              <NavLink
                to="/farm-ai"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block w-full text-left px-4 py-2 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-white/20 text-white shadow' : 'text-white/90 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {t('FarmAI / KrishiAI')}
              </NavLink>
              <NavLink
                to="/prices"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block w-full text-left px-4 py-2 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-white/20 text-white shadow' : 'text-white/90 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                Crop-Price-Finder AI
              </NavLink>
              <div className="pt-2">
                <label className="block text-xs text-white/80 px-1 pb-1">Language</label>
                <select
                  aria-label="Select language"
                  value={i18n.language}
                  onChange={(e) => { i18n.changeLanguage(e.target.value); setMobileOpen(false); }}
                  className="w-full bg-white/15 text-white text-sm rounded-lg px-3 py-2 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code} className="text-black">{l.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/farm-ai" element={<FarmAIPage />} />
            <Route path="/prices" element={<CropPriceFinder />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-8 mt-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">KrishiMitra</h3>
                <p className="text-gray-300">
                  Intelligent crop recommendation system powered by machine learning and agricultural expertise.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li><Link to="/" className="text-gray-300 hover:text-white">{t('Home')}</Link></li>
                  <li><Link to="/farm-ai" className="text-gray-300 hover:text-white">{t('FarmAI / KrishiAI')}</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Contact</h3>
                <p className="text-gray-300">
                  For support and inquiries, please contact our team.
                </p>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300 space-y-2">
              <p>&copy; 2024 KrishiMitra. All rights reserved.</p>
              <p>
                <a
                  href="https://www.flaticon.com/free-icons/farmer"
                  title="farmer icons"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 underline"
                >
                  Farmer icons created by Freepik - Flaticon
                </a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;

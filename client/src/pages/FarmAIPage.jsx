import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useSpeechToText from '../hooks/useSpeechToText';

const FarmAIPage = () => {
  const { t, i18n } = useTranslation();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      meta: { welcome: true },
      content: t('FarmAI Welcome')
    }
  ]);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Map UI language to speech recognition locale
  const sttLocale =
    i18n.language === 'hi' ? 'hi-IN'
    : i18n.language === 'mr' ? 'mr-IN'
    : i18n.language === 'ta' ? 'ta-IN'
    : i18n.language === 'bn' ? 'bn-IN'
    : i18n.language === 'te' ? 'te-IN'
    : i18n.language === 'gu' ? 'gu-IN'
    : i18n.language === 'kn' ? 'kn-IN'
    : i18n.language === 'or' ? 'or-IN'
    : i18n.language === 'ml' ? 'ml-IN'
    : i18n.language === 'pa' ? 'pa-IN'
    : 'en-US';
  const {
    supported: sttSupported,
    listening: sttListening,
    transcript: sttTranscript,
    error: sttError,
    start: sttStart,
    stop: sttStop,
    setLang: sttSetLang,
  } = useSpeechToText({ lang: sttLocale, interim: true, continuous: false, onFinal: (finalText) => {
    // Put final transcript into input and auto-send
    setInput(finalText);
    // Auto-send if not empty
    setTimeout(() => {
      if (finalText && finalText.trim()) handleQuery();
    }, 50);
  }});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Keep STT language in sync with i18n
  useEffect(() => {
    sttSetLang(sttLocale);
  }, [sttLocale, sttSetLang]);

  // Handle text query submission
  const handleQuery = async () => {
    if (!input.trim()) return;
    
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    console.log('🚀 Sending query:', currentInput, 'Language:', i18n.language);

    try {
  console.log('➡️ Calling /api/farmai/text');
  const res = await fetch('/api/farmai/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: currentInput, lang: i18n.language })
      });
      
      console.log('📡 Response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('✅ Response data:', data);
      
      const assistantMessage = { 
        role: 'assistant', 
        content: data.answer || 'Sorry, I could not process your request.' 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('❌ Error:', error);
      const errorMessage = { 
        role: 'assistant', 
        content: `Sorry, there was an error: ${error.message}. Please try again.` 
      };
      setMessages(prev => [...prev, errorMessage]);
    }
    
    setLoading(false);
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuery();
    }
  };

  // Handle image upload for disease detection
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(file);
    const userMessage = { 
      role: 'user', 
      content: 'Uploaded an image for disease detection',
      image: URL.createObjectURL(file)
    };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('lang', i18n.language);
      
  console.log('➡️ Uploading to /api/farmai/disease');
  const res = await fetch('/api/farmai/disease', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      const assistantMessage = { 
        role: 'assistant', 
        content: data.result || 'Could not analyze the image. Please try again.' 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, there was an error analyzing the image. Please try again.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    }
    
    setLoading(false);
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Language switcher
  const changeLanguage = async (lng) => {
    i18n.changeLanguage(lng);

  // Update welcome text if it's the only message
  let updated = false;
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === 'assistant' && (prev[0].meta?.welcome || true)) {
    const newWelcome = i18n.getFixedT(lng)('FarmAI Welcome');
        updated = true;
        return [{ ...prev[0], meta: { ...prev[0].meta, welcome: true }, content: newWelcome }];
      }
      return prev;
    });

    // Translate existing messages to the chosen language without resetting chat
    try {
      setLoading(true);
      await Promise.all(
        messages.map(async (m, idx) => {
          if (!m.content || m.meta?.welcome) return;
          try {
            const resp = await fetch('/api/farmai/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: m.content, targetLang: lng })
            });
            if (!resp.ok) return;
            const data = await resp.json();
            const translated = data.translated || m.content;
            // Update message in place
            setMessages((prev) => {
              const copy = [...prev];
              if (copy[idx]) copy[idx] = { ...copy[idx], content: translated };
              return copy;
            });
          } catch (_) {
            // Ignore translation errors per message
          }
        })
      );
    } catch (e) {
      console.warn('Translation batch failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = i18n.language === 'hi' ? [
    'मेरी फसल में पीले पत्ते क्यों आ रहे हैं?',
    'धान की बुआई के लिए सबसे अच्छा समय कौन सा है?',
    'कीटों से बचाव के लिए घरेलू उपाय बताएं',
    'कम पानी में कौन सी फसल उगा सकते हैं?'
  ] : i18n.language === 'mr' ? [
    'माझ्या पिकांची पाने पिवळी का होत आहेत?',
    'भात पेरणीसाठी सर्वोत्तम वेळ कोणता?',
    'नैसर्गिक किड नियंत्रण उपाय सांगा',
    'कमी पाण्यात कोणती पिके उगवता येतील?'
  ] : i18n.language === 'ta' ? [
    'என் பயிர்களின் இலைகள் மஞ்சள் ஆகுவதற்கு காரணம் என்ன?',
    'நெல் நடுவதற்கு சிறந்த நேரம் எது?',
    'இயற்கை பூச்சி கட்டுப்பாட்டு முறைகளை சொல்லுங்கள்',
    'குறைந்த தண்ணீரில் எந்த பயிர்கள் வளரலாம்?'
  ] : i18n.language === 'bn' ? [
    'আমার ফসলের পাতা হলুদ হয়ে যাচ্ছে কেন?',
    'ধান রোপণের জন্য সেরা সময় কখন?',
    'প্রাকৃতিক কীট নিয়ন্ত্রণ পদ্ধতি বলুন',
    'কম পানিতে কোন ফসলগুলো চাষ করা যায়?'
  ] : [
    'Why are my crop leaves turning yellow?',
    'What is the best time for rice planting?',
    'Tell me natural pest control methods',
    'Which crops can grow with less water?'
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-emerald-50 to-sky-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b p-3 sm:p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-green-700">
            🌱 KrishiMitra <span className="text-gray-600 text-sm sm:text-base font-medium">- {t('Your Farming Assistant')}</span>
          </h1>
          <div className="flex gap-2">
            <button 
              onClick={() => changeLanguage('en')} 
              className={`px-3 py-1 rounded-full text-sm ${i18n.language === 'en' ? 'bg-green-600 text-white' : 'border bg-white hover:bg-gray-50'}`}
            >
              English
            </button>
            <button 
              onClick={() => changeLanguage('hi')} 
              className={`px-3 py-1 rounded-full text-sm ${i18n.language === 'hi' ? 'bg-green-600 text-white' : 'border bg-white hover:bg-gray-50'}`}
            >
              हिन्दी
            </button>
            <button 
              onClick={() => changeLanguage('mr')} 
              className={`px-3 py-1 rounded-full text-sm ${i18n.language === 'mr' ? 'bg-green-600 text-white' : 'border bg-white hover:bg-gray-50'}`}
            >
              मराठी
            </button>
            <button 
              onClick={() => changeLanguage('ta')} 
              className={`px-3 py-1 rounded-full text-sm ${i18n.language === 'ta' ? 'bg-green-600 text-white' : 'border bg-white hover:bg-gray-50'}`}
            >
              தமிழ்
            </button>
            <button 
              onClick={() => changeLanguage('bn')} 
              className={`px-3 py-1 rounded-full text-sm ${i18n.language === 'bn' ? 'bg-green-600 text-white' : 'border bg-white hover:bg-gray-50'}`}
            >
              বাংলা
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 pb-24 sm:pb-28">{/* space for sticky input on mobile */}
        <div className="max-w-3xl md:max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] sm:max-w-[70%] px-4 py-2 rounded-2xl ${
              message.role === 'user'
                ? 'bg-emerald-600 text-white ml-auto shadow-md shadow-emerald-200'
                : 'bg-sky-50 text-slate-800 border border-sky-100 shadow'
            }`}>
              {message.image && (
                <img src={message.image} alt="Uploaded" className="w-full max-h-64 object-cover rounded-xl mb-2" />
              )}
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 shadow-sm border px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                <span>{t('KrishiAI is thinking...')}</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Questions */}
      {messages.length === 1 && (
        <div className="bg-transparent">
          <div className="max-w-3xl md:max-w-4xl mx-auto px-3 sm:px-4 pb-3">
            <p className="text-sm text-gray-600 mb-2">{t('Common questions')}</p>
            <div className="flex gap-2 overflow-x-auto whitespace-nowrap no-scrollbar pb-1">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInput(question)}
                  className="inline-flex items-center text-left px-3 py-2 text-sm bg-white hover:bg-gray-50 rounded-full border shadow-sm transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="sticky bottom-0 z-20 bg-white/90 backdrop-blur border-t p-3 sm:p-4 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-3xl md:max-w-4xl mx-auto flex gap-2 items-end">
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full border border-gray-300 rounded-2xl px-3 py-2 sm:px-4 sm:py-3 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none shadow-sm"
              placeholder={t('Type your question...')}
              rows="2"
              disabled={loading}
            />
          </div>
          <div className="flex gap-2">
            <label className="cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={loading}
              />
              <div className="bg-blue-600 hover:bg-blue-700 text-white h-11 w-11 rounded-full transition-colors flex items-center justify-center shadow">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </label>
            {/* Mic button for speech-to-text */}
            <button
              type="button"
              onClick={() => (sttListening ? sttStop() : sttStart())}
              disabled={!sttSupported || loading}
              title={sttSupported ? (sttListening ? t('Stop voice input') : t('Start voice input')) : t('Speech recognition not supported')}
              className={`${sttListening ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'} text-white h-11 w-11 rounded-full transition-colors flex items-center justify-center disabled:bg-gray-300 shadow`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                {sttListening ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M12 14a3 3 0 003-3V6a3 3 0 10-6 0v5a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2zM11 19h2v3h-2z" />
                )}
              </svg>
            </button>
            <button
              onClick={handleQuery}
              disabled={loading || !input.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white h-11 px-4 rounded-full transition-colors flex items-center justify-center shadow"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          {sttSupported ? t('Send hint with mic') : t('Send hint without mic')}
        </div>
        {sttError && (
          <div className="mt-1 text-xs text-red-600 text-center">{t('Speech error')}: {String(sttError)}</div>
        )}
        {sttListening && sttTranscript && (
          <div className="mt-1 text-xs text-gray-600 text-center">{sttTranscript}</div>
        )}
      </div>
    </div>
  );
};

export default FarmAIPage;

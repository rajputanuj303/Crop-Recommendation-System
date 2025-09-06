// Simple speech-to-text hook using the Web Speech API (with webkit fallback)
// Provides: supported, listening, transcript, error, start, stop, setLang
import { useCallback, useEffect, useRef, useState } from 'react';

export default function useSpeechToText({ lang = 'en-US', interim = true, continuous = false, onFinal }) {
  const Recognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const supported = Boolean(Recognition);
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const langRef = useRef(lang);

  // Initialize recognition instance lazily
  const ensureInstance = useCallback(() => {
    if (!supported) return null;
    if (!recognitionRef.current) {
      const r = new Recognition();
      r.interimResults = interim;
      r.continuous = continuous; // note: on many browsers, continuous may still end often
      r.lang = langRef.current;

      r.onstart = () => {
        setError(null);
        setListening(true);
      };

      r.onerror = (e) => {
        setError(e?.error || 'speech_error');
      };

      r.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) finalTranscript += res[0].transcript;
          else interimTranscript += res[0].transcript;
        }
        if (finalTranscript) {
          setTranscript(finalTranscript);
          if (typeof onFinal === 'function') onFinal(finalTranscript.trim());
        } else {
          setTranscript(interimTranscript);
        }
      };

      r.onend = () => {
        setListening(false);
      };

      recognitionRef.current = r;
    }
    return recognitionRef.current;
  }, [Recognition, supported, interim, continuous, onFinal]);

  const start = useCallback(() => {
    if (!supported) return;
    setTranscript('');
    const r = ensureInstance();
    try {
      r.lang = langRef.current;
      r.start();
    } catch (e) {
      // start can throw if already started; ignore
    }
  }, [supported, ensureInstance]);

  const stop = useCallback(() => {
    if (!supported) return;
    try {
      recognitionRef.current && recognitionRef.current.stop();
    } catch (e) {
      // ignore
    }
  }, [supported]);

  const setLang = useCallback((lng) => {
    langRef.current = lng || 'en-US';
    if (recognitionRef.current) recognitionRef.current.lang = langRef.current;
  }, []);

  // Sync language prop
  useEffect(() => {
    setLang(lang);
  }, [lang, setLang]);

  // Cleanup
  useEffect(() => {
    return () => {
      try {
        recognitionRef.current && recognitionRef.current.abort();
      } catch (_) {}
    };
  }, []);

  return { supported, listening, transcript, error, start, stop, setLang };
}

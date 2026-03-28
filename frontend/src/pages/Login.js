import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Loader2 } from 'lucide-react';

export const Login = () => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const { login, currentUser, isLoading: appLoading } = useApp();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser && !appLoading) {
      navigate('/dashboard');
    }
  }, [currentUser, appLoading, navigate]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
  }, []);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;
    
    const newPin = [...pin];
    newPin[index] = value.slice(-1); // Only take last character
    setPin(newPin);
    setError('');

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-submit when all 4 digits entered
    if (value && index === 3) {
      const fullPin = [...newPin.slice(0, 3), value.slice(-1)].join('');
      if (fullPin.length === 4) {
        handleLogin(fullPin);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleLogin = async (fullPin) => {
    setIsLoading(true);
    setError('');
    
    const result = await login(fullPin);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
      setPin(['', '', '', '']);
      inputRefs[0].current?.focus();
    }
    
    setIsLoading(false);
  };

  if (appLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 login-bg">
      <div className="absolute inset-0 bg-black/70" />
      
      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-2">
            SAVERIANI
          </h1>
          <p className="text-zinc-500 text-sm uppercase tracking-widest">
            Sistema Gestione Campo
          </p>
        </div>

        {/* PIN Input Card */}
        <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 p-8 md:p-12">
          <h2 className="text-xl font-bold text-white mb-2 text-center">
            Accesso Operatore
          </h2>
          <p className="text-zinc-500 text-sm text-center mb-8">
            Inserisci il tuo PIN a 4 cifre
          </p>

          {/* PIN Inputs */}
          <div className="flex justify-center gap-3 md:gap-4 mb-6" data-testid="pin-input">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isLoading}
                className="pin-digit disabled:opacity-50"
                data-testid={`pin-digit-${index}`}
                aria-label={`Cifra ${index + 1} del PIN`}
              />
            ))}
          </div>

          {/* Error message */}
          {error && (
            <p className="text-red-500 text-sm text-center mb-4" data-testid="login-error">
              {error}
            </p>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}

          {/* Staff PINs hint (for demo) */}
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <p className="text-xs text-zinc-600 text-center mb-3">PIN Demo Staff:</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500">
              <span>Maher: 1111</span>
              <span>Daniele: 2222</span>
              <span>Costantino: 3333</span>
              <span>Gaia: 4444</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-zinc-600 text-xs text-center mt-8">
          Sistema offline-first per la gestione del campo
        </p>
      </div>
    </div>
  );
};

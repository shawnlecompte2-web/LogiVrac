
import React, { useState } from 'react';
import { UserAccount } from '../types';
import { Lock, Delete, ArrowRight } from 'lucide-react';

interface Props {
  users: UserAccount[];
  onLogin: (user: UserAccount) => void;
}

const LoginView: React.FC<Props> = ({ users, onLogin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const verifyPin = (code: string) => {
    const user = users.find(u => u.code === code);
    if (user) {
      setError(false);
      onLogin(user);
    } else {
      setError(true);
      setTimeout(() => {
        setPin('');
        setError(false);
      }, 1000);
    }
  };

  const handleDelete = () => setPin(pin.slice(0, -1));

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white max-w-md mx-auto">
      <div className="mb-12 text-center">
        <span className="text-[10px] font-black tracking-[0.4em] text-[#76a73c] block mb-2 uppercase">Services Intégrés</span>
        <h1 className="text-4xl font-black italic tracking-tighter text-white">GROUPE <span className="text-[#76a73c]">DDL</span></h1>
        <div className="mt-8 flex flex-col items-center">
          <div className={`p-4 rounded-full mb-4 ${error ? 'bg-red-500 animate-shake' : 'bg-[#76a73c]'}`}>
            <Lock className="w-8 h-8 text-black" />
          </div>
          <h2 className="text-xl font-black uppercase italic tracking-tight">Veuillez entrer votre code</h2>
          <div className="flex gap-4 mt-6">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${pin.length > i ? 'bg-[#76a73c] border-[#76a73c] scale-125' : 'border-white/20'}`} />
            ))}
          </div>
          {error && <p className="text-red-500 text-[10px] font-black uppercase mt-4 animate-pulse">Code Incorrect</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button key={num} onClick={() => handleKeyPress(num.toString())} className="w-20 h-20 rounded-full bg-white/5 hover:bg-white/10 text-2xl font-black transition-all active:scale-90 flex items-center justify-center">
            {num}
          </button>
        ))}
        <div />
        <button onClick={() => handleKeyPress('0')} className="w-20 h-20 rounded-full bg-white/5 hover:bg-white/10 text-2xl font-black flex items-center justify-center">0</button>
        <button onClick={handleDelete} className="w-20 h-20 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center">
          <Delete className="w-6 h-6" />
        </button>
      </div>

      <div className="mt-auto pt-10 text-[8px] font-black opacity-30 tracking-[0.2em] uppercase">
        Accès Sécurisé — Groupe DDL Logistique
      </div>
    </div>
  );
};

export default LoginView;

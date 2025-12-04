import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, Bell, Eye, Lock, Volume2, Fingerprint } from 'lucide-react';

interface AntiTheftProps {
  onTriggerAlarm: () => void;
  isAlarmActive: boolean;
}

const AntiTheft: React.FC<AntiTheftProps> = ({ onTriggerAlarm, isAlarmActive }) => {
  const [armed, setArmed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [sensitivity, setSensitivity] = useState(5);
  
  // Simulation for web environment
  const triggerMotionSim = () => {
    if (armed && !isAlarmActive) {
      onTriggerAlarm();
    }
  };

  useEffect(() => {
    let timer: any;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setCountdown(null);
      setArmed(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const toggleArming = () => {
    if (armed) {
      setArmed(false);
    } else {
      setCountdown(3); // 3 seconds to put phone down
    }
  };

  return (
    <div className="p-6 space-y-6 pb-24 h-full flex flex-col">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-1">Anti-Vol Intelligent</h2>
        <p className="text-gray-400 text-sm">Protection physique et détection de mouvement</p>
      </div>

      {/* Main Activation Button */}
      <div className="flex-1 flex flex-col items-center justify-center py-8">
        <button
          onClick={toggleArming}
          className={`relative w-48 h-48 rounded-full flex flex-col items-center justify-center transition-all duration-500 border-4 shadow-[0_0_50px_rgba(0,0,0,0.5)] ${
            armed 
              ? 'bg-neon-red/10 border-neon-red shadow-[0_0_30px_rgba(255,0,60,0.4)]' 
              : 'bg-dark-card border-neon-blue shadow-[0_0_30px_rgba(0,243,255,0.2)]'
          }`}
        >
          {countdown !== null ? (
            <span className="text-6xl font-bold text-white animate-ping">{countdown}</span>
          ) : (
            <>
              {armed ? <Lock size={48} className="text-neon-red mb-2" /> : <Fingerprint size={48} className="text-neon-blue mb-2" />}
              <span className={`text-lg font-bold ${armed ? 'text-neon-red' : 'text-neon-blue'}`}>
                {armed ? 'ARMÉ' : 'ACTIVER'}
              </span>
            </>
          )}
          
          {/* Radar scan effect when armed */}
          {armed && (
            <div className="absolute inset-0 rounded-full overflow-hidden opacity-30 pointer-events-none">
              <div className="w-full h-1/2 bg-gradient-to-b from-transparent to-neon-red absolute top-0 animate-scan origin-bottom" />
            </div>
          )}
        </button>
        
        <p className="mt-6 text-sm text-gray-400 max-w-[250px] text-center">
          {armed 
            ? "Ne touchez pas le téléphone. Une alarme retentira en cas de mouvement." 
            : "Appuyez pour armer le système. Vous aurez 3 secondes pour poser l'appareil."}
        </p>
      </div>

      {/* Sensitivity Slider */}
      <div className="bg-dark-card p-4 rounded-xl border border-gray-800">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Sensibilité du Capteur</span>
          <span className="text-xs text-neon-blue">{sensitivity * 10}%</span>
        </div>
        <input 
          type="range" 
          min="1" 
          max="10" 
          value={sensitivity} 
          onChange={(e) => setSensitivity(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-blue"
        />
      </div>

      {/* Features List */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-dark-card p-3 rounded-lg border border-gray-800 flex items-center gap-3">
          <div className="p-2 bg-neon-purple/20 rounded-md">
            <Eye size={18} className="text-neon-purple" />
          </div>
          <div className="text-xs">
            <p className="font-bold">Photo Trap</p>
            <p className="text-gray-500">Selfie intrus</p>
          </div>
        </div>
        <div className="bg-dark-card p-3 rounded-lg border border-gray-800 flex items-center gap-3">
          <div className="p-2 bg-neon-green/20 rounded-md">
            <Smartphone size={18} className="text-neon-green" />
          </div>
          <div className="text-xs">
            <p className="font-bold">Pocket Mode</p>
            <p className="text-gray-500">Anti-Pickpocket</p>
          </div>
        </div>
      </div>

      {/* DEMO ONLY BUTTON */}
      {armed && (
        <button 
          onClick={triggerMotionSim}
          className="w-full py-3 rounded-xl bg-gray-800 text-gray-400 text-xs border border-dashed border-gray-600 hover:bg-gray-700 transition"
        >
          [DEMO] SIMULER MOUVEMENT
        </button>
      )}
    </div>
  );
};

export default AntiTheft;
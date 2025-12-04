import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, Bell, Eye, Lock, Volume2, Fingerprint, Ghost, AlertTriangle, Unlock } from 'lucide-react';
import { SecurityEvent } from '../types';

interface AntiTheftProps {
  onTriggerAlarm: () => void;
  isAlarmActive: boolean;
  onLogEvent: (event: Omit<SecurityEvent, 'id'>) => void;
}

const AntiTheft: React.FC<AntiTheftProps> = ({ onTriggerAlarm, isAlarmActive, onLogEvent }) => {
  const [armed, setArmed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [sensitivity, setSensitivity] = useState(5);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Bait Mode State
  const [baitMode, setBaitMode] = useState(false);
  const [baitAttempts, setBaitAttempts] = useState(0);
  const [enteredPin, setEnteredPin] = useState("");
  const [errorShake, setErrorShake] = useState(false);

  // Simulation for web environment
  const triggerMotionSim = () => {
    if (armed && !isAlarmActive) {
      setShowConfirm(true);
    }
  };

  const confirmAlarm = () => {
    setShowConfirm(false);
    onTriggerAlarm();
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

  // Logic to acknowledge alarm activation for Photo Trap feature
  useEffect(() => {
    if (isAlarmActive) {
        console.log("AntiTheft: System Active. Photo sequence initiated.");
    }
  }, [isAlarmActive]);

  const toggleArming = () => {
    if (armed) {
      setArmed(false);
    } else {
      setCountdown(3); // 3 seconds to put phone down
    }
  };

  // Bait Mode Logic
  const handlePinPress = (num: string) => {
    if (enteredPin.length < 4) {
      const newPin = enteredPin + num;
      setEnteredPin(newPin);

      if (newPin.length === 4) {
        // Check PIN (Demo code: 0000)
        if (newPin === '0000') {
          setBaitMode(false);
          setEnteredPin("");
        } else {
          // Wrong PIN
          setErrorShake(true);
          setBaitAttempts(prev => prev + 1);
          
          onLogEvent({
            type: 'BAIT_ATTEMPT',
            severity: 'MEDIUM',
            message: `Mode Appât: Tentative de déverrouillage échouée (PIN: ${newPin})`,
            timestamp: new Date()
          });

          setTimeout(() => {
            setEnteredPin("");
            setErrorShake(false);
          }, 500);
        }
      }
    }
  };

  const activateBaitMode = () => {
    setBaitAttempts(0);
    setBaitMode(true);
  };

  return (
    <div className="p-6 space-y-6 pb-24 h-full flex flex-col relative">
      
      {/* BAIT MODE OVERLAY (FAKE LOCK SCREEN) */}
      {baitMode && (
        <div className="absolute inset-0 z-[60] bg-black flex flex-col items-center justify-between py-12 px-6 animate-in fade-in duration-500">
           <div className="text-center mt-8">
              <div className="text-6xl font-thin text-white mb-2">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-gray-400 text-sm">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
           </div>

           <div className={`w-full max-w-xs flex flex-col items-center ${errorShake ? 'animate-shake' : ''}`}>
              <div className="mb-8 flex gap-4">
                 {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`w-4 h-4 rounded-full border border-white transition-all ${i < enteredPin.length ? 'bg-white' : 'bg-transparent'}`} />
                 ))}
              </div>
              {errorShake && <p className="text-red-500 text-xs font-bold mb-4 animate-pulse">CODE INCORRECT</p>}

              <div className="grid grid-cols-3 gap-6 w-full">
                 {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button 
                      key={num}
                      onClick={() => handlePinPress(num.toString())}
                      className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-2xl font-light text-white transition active:scale-95 mx-auto"
                    >
                       {num}
                    </button>
                 ))}
                 <div />
                 <button 
                      onClick={() => handlePinPress('0')}
                      className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-2xl font-light text-white transition active:scale-95 mx-auto"
                    >
                       0
                 </button>
                 <div />
              </div>
              <div className="mt-8 text-center">
                 <p className="text-white/30 text-xs uppercase tracking-widest">Swipe to Unlock</p>
                 <p className="text-neon-blue/20 text-[10px] mt-2 font-mono">(Demo Code: 0000)</p>
              </div>
           </div>
        </div>
      )}

      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-1">Anti-Vol Intelligent</h2>
        <p className="text-gray-400 text-sm">Protection physique et détection de mouvement</p>
      </div>

      {/* Main Activation Button */}
      <div className="flex-1 flex flex-col items-center justify-center py-4">
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
          className="w-full h-2 bg-dark-surface rounded-lg appearance-none cursor-pointer accent-neon-blue"
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
        
        {/* BAIT MODE BUTTON */}
        <button 
          onClick={activateBaitMode}
          className="bg-dark-card p-3 rounded-lg border border-gray-800 flex items-center gap-3 hover:bg-dark-surface transition text-left group relative overflow-hidden"
        >
          <div className="p-2 bg-neon-blue/20 rounded-md group-hover:bg-neon-blue/30 transition">
            <Ghost size={18} className="text-neon-blue" />
          </div>
          <div className="text-xs relative z-10">
            <p className="font-bold text-gray-200">Mode Appât</p>
            <p className="text-gray-500">Faux écran</p>
          </div>
          
          {baitAttempts > 0 && (
            <div className="absolute top-1 right-1 bg-neon-red text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                {baitAttempts}
            </div>
          )}
        </button>
      </div>
      
      {/* Bait Attempt Log (Only visible if attempts exist) */}
      {baitAttempts > 0 && (
         <div className="bg-neon-red/10 border border-neon-red/30 p-3 rounded-lg flex items-center gap-3 animate-in slide-in-from-bottom-5">
            <AlertTriangle size={18} className="text-neon-red" />
            <div className="text-xs">
                <span className="font-bold text-neon-red">Tentatives d'intrusion détectées</span>
                <p className="text-gray-400">Le leurre a enregistré {baitAttempts} codes erronés.</p>
            </div>
         </div>
      )}

      {/* DEMO ONLY BUTTON */}
      {armed && (
        <button 
          onClick={triggerMotionSim}
          className="w-full py-3 rounded-xl bg-dark-surface text-gray-400 text-xs border border-dashed border-gray-600 hover:bg-gray-700 transition"
        >
          [DEMO] SIMULER MOUVEMENT
        </button>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200 rounded-xl">
            <div className="bg-dark-card border border-neon-red p-6 rounded-xl shadow-[0_0_30px_rgba(255,0,60,0.2)] w-full max-w-sm text-center relative overflow-hidden">
                <div className="w-16 h-16 bg-neon-red/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-neon-red/30">
                    <Volume2 size={32} className="text-neon-red animate-pulse" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">Attention</h3>
                <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                    Voulez-vous vraiment déclencher l'alarme ?
                </p>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowConfirm(false)}
                        className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-dark-surface transition font-medium text-sm"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={confirmAlarm}
                        className="flex-1 py-3 rounded-lg bg-neon-red text-black font-bold hover:bg-red-500 transition shadow-[0_0_20px_rgba(255,0,60,0.3)] text-sm"
                    >
                        Confirmer
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AntiTheft;
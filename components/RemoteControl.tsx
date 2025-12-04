import React, { useState } from 'react';
import { MapPin, Lock, Camera, Volume2, Trash2 } from 'lucide-react';

interface RemoteControlProps {
  onTriggerRemoteCamera: () => void;
}

const RemoteControl: React.FC<RemoteControlProps> = ({ onTriggerRemoteCamera }) => {
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const performAction = (action: string) => {
    setActiveAction(action);
    
    if (action === 'CAMERA') {
      onTriggerRemoteCamera();
    }

    setTimeout(() => setActiveAction(null), 3000);
  };

  return (
    <div className="p-6 space-y-6 pb-24 h-full flex flex-col">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-1">Contrôle à Distance</h2>
        <p className="text-gray-400 text-sm">Gérez votre appareil volé ou perdu</p>
      </div>

      {/* Map / Viewport Area */}
      <div className="w-full h-48 bg-gray-800 rounded-xl overflow-hidden relative border border-gray-700 group">
        
        {/* Standard Map View - Hidden when Camera is Active */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeAction === 'CAMERA' ? 'opacity-0' : 'opacity-100'}`}>
          <div className="absolute inset-0 bg-[url('https://picsum.photos/600/300')] bg-cover bg-center opacity-50 grayscale group-hover:grayscale-0 transition-all duration-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-neon-blue rounded-full shadow-[0_0_15px_#00f3ff] animate-ping absolute"></div>
            <div className="w-4 h-4 bg-neon-blue rounded-full shadow-[0_0_15px_#00f3ff] relative z-10 border-2 border-white"></div>
          </div>
          <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur px-2 py-1 rounded text-xs text-white flex items-center gap-1">
            <MapPin size={12} className="text-neon-blue" />
            Paris, France (Précision: 5m)
          </div>
        </div>

        {/* Camera Scanning Effect Overlay */}
        <div className={`absolute inset-0 bg-black z-10 transition-opacity duration-300 flex flex-col items-center justify-center overflow-hidden ${activeAction === 'CAMERA' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          
          {/* Cyberpunk Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
          
          {/* Scanning Line Animation */}
          {activeAction === 'CAMERA' && (
             <div className="absolute top-0 w-full h-full bg-gradient-to-b from-transparent via-neon-green/20 to-transparent animate-scan">
                <div className="absolute bottom-0 w-full h-[2px] bg-neon-green shadow-[0_0_15px_#0aff0a]"></div>
             </div>
          )}

          {/* HUD Focus Brackets */}
          <div className="relative w-24 h-24 transition-all duration-500 transform scale-100 flex items-center justify-center">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-neon-green"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-neon-green"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-neon-green"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-neon-green"></div>
            
            {/* Center Target Dot */}
            <div className="w-1 h-1 bg-neon-red rounded-full animate-ping"></div>
          </div>

          {/* Status Text Overlay */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
             <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-mono text-neon-green tracking-widest">REMOTE_LINK::ESTABLISHED</span>
          </div>

          <div className="absolute bottom-3 right-3 text-right">
             <div className="text-[10px] font-mono text-neon-green">ISO 800</div>
             <div className="text-[10px] font-mono text-neon-blue animate-pulse">ACQUIRING TARGET...</div>
          </div>
        </div>

      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => performAction('LOCK')}
          className="bg-dark-card p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center gap-2 hover:bg-gray-800 transition active:scale-95"
        >
          <div className="p-3 rounded-full bg-neon-blue/10">
            <Lock size={24} className="text-neon-blue" />
          </div>
          <span className="font-medium text-sm">Verrouiller</span>
        </button>

        <button 
          onClick={() => performAction('ALARM')}
          className="bg-dark-card p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center gap-2 hover:bg-gray-800 transition active:scale-95"
        >
          <div className="p-3 rounded-full bg-neon-purple/10">
            <Volume2 size={24} className="text-neon-purple" />
          </div>
          <span className="font-medium text-sm">Alarme Force</span>
        </button>

        <button 
          onClick={() => performAction('CAMERA')}
          className="bg-dark-card p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center gap-2 hover:bg-gray-800 transition active:scale-95"
        >
          <div className="p-3 rounded-full bg-neon-green/10">
            <Camera size={24} className="text-neon-green" />
          </div>
          <span className="font-medium text-sm">Photo Discrète</span>
        </button>

        <button 
          onClick={() => performAction('WIPE')}
          className="bg-dark-card p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center gap-2 hover:bg-gray-800 transition active:scale-95 group"
        >
          <div className="p-3 rounded-full bg-neon-red/10 group-hover:bg-neon-red/20">
            <Trash2 size={24} className="text-neon-red" />
          </div>
          <span className="font-medium text-sm text-neon-red">Effacer Tout</span>
        </button>
      </div>

      {/* Console Log */}
      <div className="flex-1 bg-black rounded-xl p-4 font-mono text-xs text-green-500 overflow-y-auto border border-gray-800">
        <div className="opacity-50 border-b border-gray-800 pb-2 mb-2">SYSTEM LOGS - SECURE CONNECTION</div>
        <p>[10:42:01] Connection established (TLS 1.3)</p>
        <p>[10:42:05] Location updated: 48.8566° N, 2.3522° E</p>
        {activeAction === 'LOCK' && <p className="text-neon-blue">[CMD] Executing REMOTE_LOCK... SUCCESS</p>}
        {activeAction === 'ALARM' && <p className="text-neon-purple">[CMD] Triggering MAX_VOLUME_ALARM... SENT</p>}
        {activeAction === 'CAMERA' && (
          <>
            <p className="text-neon-green">[CMD] Requesting FRONT_CAMERA_SNAPSHOT...</p>
            <p className="text-neon-green animate-pulse"> >> UPLOADING EVIDENCE TO CLOUD...</p>
          </>
        )}
        {activeAction === 'WIPE' && <p className="text-neon-red">[WARN] WIPE_DATA initiated. Awaiting confirmation...</p>}
      </div>
    </div>
  );
};

export default RemoteControl;
import React, { useState, useEffect } from 'react';
import { MapPin, Lock, Camera, Volume2, Trash2, MessageSquare, Check, AlertTriangle, Satellite, Loader2, Video, StopCircle } from 'lucide-react';

interface RemoteControlProps {
  onTriggerRemoteCamera: () => void;
  onSendAlert: () => void;
  location: { lat: number; lng: number } | null;
  onRemoteWipe: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
}

const RemoteControl: React.FC<RemoteControlProps> = ({ 
    onTriggerRemoteCamera, 
    onSendAlert, 
    location, 
    onRemoteWipe,
    onStartRecording,
    onStopRecording,
    isRecording
}) => {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [successAction, setSuccessAction] = useState<string | null>(null);
  const [showCameraSuccess, setShowCameraSuccess] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [closingCamera, setClosingCamera] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Manage the lifecycle of actions, specifically the Camera Scanning simulation
  useEffect(() => {
    let scanTimer: ReturnType<typeof setTimeout>;
    let closeStartTimer: ReturnType<typeof setTimeout>;
    let resetTimer: ReturnType<typeof setTimeout>;

    if (activeAction === 'CAMERA') {
      // 1. Simulate Scanning Phase (1.5s)
      scanTimer = setTimeout(() => {
        setShowCameraSuccess(true);
      }, 1500);

      // 2. Start Closing Visuals (ONLY if not recording)
      // If isRecording is true, we keep the camera open indefinitely until user stops recording
      if (!isRecording) {
        closeStartTimer = setTimeout(() => {
            setClosingCamera(true);
        }, 3500);

        // 3. Auto-close
        resetTimer = setTimeout(() => {
            setActiveAction(null);
            setShowCameraSuccess(false);
            setClosingCamera(false);
        }, 4500);
      }
    } else if (activeAction === 'MESSAGE') {
       // Handled manually in performAction for timing
       resetTimer = setTimeout(() => {
        setActiveAction(null);
       }, 5000);
    } else if (activeAction && activeAction !== 'VIDEO_MODE') {
      // For other actions, just auto-close after a delay
      resetTimer = setTimeout(() => {
        setActiveAction(null);
      }, 3000);
    }

    return () => {
      clearTimeout(scanTimer);
      clearTimeout(closeStartTimer);
      clearTimeout(resetTimer);
    };
  }, [activeAction, isRecording]);

  const performAction = (action: string) => {
    // Prevent overlapping actions unless toggling recording inside camera view
    if (activeAction && action !== 'VIDEO_TOGGLE') return;

    if (action === 'WIPE') {
      setShowWipeConfirm(true);
      return;
    }

    if (action === 'VIDEO_TOGGLE') {
        if (isRecording) {
            onStopRecording();
            // Allow auto-close to happen after a short delay now that recording stopped
            setTimeout(() => {
                setClosingCamera(true);
                setTimeout(() => {
                    setActiveAction(null);
                    setClosingCamera(false);
                }, 1000);
            }, 1000);
        } else {
            onStartRecording();
            // Ensure we are in camera visual mode
            if (activeAction !== 'CAMERA') {
                 setActiveAction('CAMERA');
                 setShowCameraSuccess(true); // Skip scanning animation for video mode start
            }
        }
        return;
    }

    setActiveAction(action);
    setShowCameraSuccess(false);
    setClosingCamera(false);
    setIsSendingMessage(false);

    // MESSAGE Action with Network Simulation
    if (action === 'MESSAGE') {
      setIsSendingMessage(true);
      setTimeout(() => {
        onSendAlert();
        setIsSendingMessage(false);
        setSuccessAction('MESSAGE');
        setTimeout(() => setSuccessAction(null), 2000);
      }, 2000);
      return;
    }

    // Immediate actions
    if (['LOCK', 'ALARM'].includes(action)) {
      setSuccessAction(action);
      setTimeout(() => setSuccessAction(null), 2000);
    }
    
    if (action === 'CAMERA') {
      onTriggerRemoteCamera();
    }
  };

  const confirmWipe = () => {
    setActiveAction('WIPE');
    setShowWipeConfirm(false);
    // Execute the actual wipe/lockdown logic passed from App
    onRemoteWipe();
  };

  return (
    <div className="p-6 space-y-6 pb-24 h-full flex flex-col relative">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-1">Contrôle à Distance</h2>
        <p className="text-gray-400 text-sm">Gérez votre appareil volé ou perdu</p>
      </div>

      {/* Wipe Confirmation Modal */}
      {showWipeConfirm && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200 rounded-xl">
            <div className="bg-dark-card border border-neon-red p-6 rounded-xl shadow-[0_0_50px_rgba(255,0,60,0.2)] max-w-sm w-full text-center relative overflow-hidden">
                {/* Background warning stripes */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-red to-transparent"></div>
                
                <div className="w-16 h-16 bg-neon-red/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-neon-red/30">
                    <Trash2 size={32} className="text-neon-red animate-pulse" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 tracking-wider">DANGER ZONE</h3>
                <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                    Are you sure you want to wipe all data? This action cannot be undone.
                </p>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowWipeConfirm(false)}
                        className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-dark-surface transition font-medium text-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmWipe}
                        className="flex-1 py-3 rounded-lg bg-neon-red text-black font-bold hover:bg-red-500 transition shadow-[0_0_20px_rgba(255,0,60,0.3)] text-sm flex items-center justify-center gap-2"
                    >
                        <Trash2 size={16} />
                        Confirm
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Map / Viewport Area */}
      <div className={`w-full h-48 bg-dark-surface rounded-xl overflow-hidden relative border group transition-colors duration-500 ${isRecording ? 'border-red-600 shadow-[0_0_15px_rgba(255,0,0,0.5)]' : 'border-gray-700'}`}>
        
        {/* Standard Map View - Hidden when Camera is Active */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeAction === 'CAMERA' ? 'opacity-0' : 'opacity-100'}`}>
          <div className="absolute inset-0 bg-[url('https://picsum.photos/600/300')] bg-cover bg-center opacity-50 grayscale group-hover:grayscale-0 transition-all duration-500"></div>
          
          {/* Target Reticle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 border border-neon-blue/30 rounded-full flex items-center justify-center animate-[spin_4s_linear_infinite]">
              <div className="w-2 h-2 bg-neon-blue rounded-full absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>
            <div className="absolute w-4 h-4 bg-neon-blue rounded-full shadow-[0_0_15px_#00f3ff] animate-ping"></div>
            <div className="absolute w-2 h-2 bg-white rounded-full z-10"></div>
          </div>

          {/* Satellite Data Overlay */}
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur px-2 py-1 rounded border border-gray-700 flex flex-col items-end">
             <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-neon-blue font-mono animate-pulse">LIVE SAT</span>
                <Satellite size={14} className="text-neon-blue" />
             </div>
             <div className="text-[10px] text-gray-400 font-mono">
                {location ? (
                    <>
                      LAT: {location.lat.toFixed(4)}<br/>
                      LNG: {location.lng.toFixed(4)}
                    </>
                ) : (
                    <span className="animate-pulse">ACQUIRING GPS...</span>
                )}
             </div>
          </div>

          <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur px-2 py-1 rounded text-xs text-white flex items-center gap-1 border border-gray-700">
            <MapPin size={12} className="text-neon-red" />
            <span>{location ? "Position Traced (High Accuracy)" : "Triangulation..."}</span>
          </div>
        </div>

        {/* Camera Scanning Effect Overlay */}
        <div className={`absolute inset-0 bg-black z-10 transition-opacity duration-300 flex flex-col items-center justify-center overflow-hidden ${activeAction === 'CAMERA' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          
          {/* Cyberpunk Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
          
          {/* Scanning Line Animation - Only show if not success yet and not recording */}
          {activeAction === 'CAMERA' && !showCameraSuccess && !closingCamera && !isRecording && (
             <div className="absolute top-0 w-full h-full bg-gradient-to-b from-transparent via-neon-green/20 to-transparent animate-scan z-10 pointer-events-none">
                <div className="absolute bottom-0 w-full h-[2px] bg-neon-green shadow-[0_0_15px_#0aff0a]"></div>
             </div>
          )}

          {/* Success Overlay - only show briefly if not recording */}
          {showCameraSuccess && !closingCamera && !isRecording && (
             <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 animate-in fade-in zoom-in duration-300">
                <div className="p-3 bg-neon-green/20 rounded-full border-2 border-neon-green text-neon-green mb-3 shadow-[0_0_20px_rgba(10,255,10,0.3)]">
                   <Check size={32} strokeWidth={3} />
                </div>
                <span className="text-neon-green font-bold tracking-widest text-sm uppercase">Photo captured successfully!</span>
                <span className="text-gray-500 text-[10px] font-mono mt-1">EVIDENCE SECURED ON CLOUD</span>
             </div>
          )}

          {/* Closing/Termination Overlay */}
          {closingCamera && (
             <div className="absolute inset-0 bg-black z-30 flex items-center justify-center animate-in fade-in duration-200">
                 <div className="w-full h-[1px] bg-neon-red absolute top-1/2 transform -translate-y-1/2 animate-[ping_0.5s_ease-in-out]"></div>
                 <div className="flex flex-col items-center gap-1 z-10 bg-black px-4 py-1">
                    <span className="text-neon-red font-mono text-xs tracking-[0.2em]">FEED TERMINATED</span>
                    <span className="text-[8px] text-gray-500 font-mono tracking-widest">SECURE DISCONNECT</span>
                 </div>
             </div>
          )}

          {/* RECORDING INDICATOR */}
          {isRecording && (
             <div className="absolute top-3 right-3 flex items-center gap-2 z-30">
                 <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_red]"></div>
                 <span className="text-red-500 font-mono text-xs font-bold tracking-widest">REC</span>
             </div>
          )}

          {/* HUD Focus Brackets - Hide on success unless recording */}
          {(!showCameraSuccess && !closingCamera) || isRecording ? (
            <div className="relative w-24 h-24 transition-all duration-500 transform scale-100 flex items-center justify-center">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-neon-green"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-neon-green"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-neon-green"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-neon-green"></div>
              
              {/* Center Target Dot */}
              <div className="w-1 h-1 bg-neon-red rounded-full animate-ping"></div>
            </div>
          ) : null}

          {/* Status Text Overlay - Hide on success unless recording */}
          {(!showCameraSuccess && !closingCamera) || isRecording ? (
            <>
              <div className="absolute top-3 left-3 flex items-center gap-2">
                 <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                 <span className="text-[10px] font-mono text-neon-green tracking-widest">REMOTE_LINK::ESTABLISHED</span>
              </div>

              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-neon-green font-mono text-xs tracking-widest animate-pulse whitespace-nowrap">
                {isRecording ? "ENCRYPTING VIDEO STREAM..." : "TARGET ACQUIRED..."}
              </div>

              <div className="absolute bottom-3 right-3 text-right">
                 <div className="text-[10px] font-mono text-neon-green opacity-70">ISO 800</div>
                 <div className="text-[10px] font-mono text-neon-blue animate-pulse tracking-widest">
                     {isRecording ? "UPLOADING CHUNKS..." : "ACQUIRING TARGET..."}
                 </div>
              </div>
            </>
          ) : null}
        </div>

      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => performAction('LOCK')}
          className="bg-dark-card p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center gap-2 hover:bg-dark-surface transition active:scale-95 relative overflow-hidden"
        >
          {successAction === 'LOCK' ? (
             <div className="absolute inset-0 bg-dark-surface flex flex-col items-center justify-center animate-in fade-in duration-300">
               <Check size={24} className="text-neon-blue mb-1" />
               <span className="text-[10px] font-bold text-neon-blue tracking-widest">CMD SENT</span>
             </div>
          ) : (
            <>
              <div className="p-3 rounded-full bg-neon-blue/10">
                <Lock size={24} className="text-neon-blue" />
              </div>
              <span className="font-medium text-sm">Verrouiller</span>
            </>
          )}
        </button>

        <button 
          onClick={() => performAction('ALARM')}
          className="bg-dark-card p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center gap-2 hover:bg-dark-surface transition active:scale-95 relative overflow-hidden"
        >
          {successAction === 'ALARM' ? (
             <div className="absolute inset-0 bg-dark-surface flex flex-col items-center justify-center animate-in fade-in duration-300">
               <Check size={24} className="text-neon-purple mb-1" />
               <span className="text-[10px] font-bold text-neon-purple tracking-widest">ACTIVATED</span>
             </div>
          ) : (
            <>
              <div className="p-3 rounded-full bg-neon-purple/10">
                <Volume2 size={24} className="text-neon-purple" />
              </div>
              <span className="font-medium text-sm">Alarme Force</span>
            </>
          )}
        </button>

        <button 
          onClick={() => performAction('CAMERA')}
          className="bg-dark-card p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center gap-2 hover:bg-dark-surface transition active:scale-95"
        >
          <div className="p-3 rounded-full bg-neon-green/10">
            <Camera size={24} className="text-neon-green" />
          </div>
          <span className="font-medium text-sm">Photo Discrète</span>
        </button>

        <button 
          onClick={() => performAction('VIDEO_TOGGLE')}
          className={`bg-dark-card p-4 rounded-xl border transition active:scale-95 flex flex-col items-center justify-center gap-2 ${isRecording ? 'border-red-600 bg-red-900/10' : 'border-gray-800 hover:bg-dark-surface'}`}
        >
          <div className={`p-3 rounded-full ${isRecording ? 'bg-red-600/20' : 'bg-neon-green/10'}`}>
            {isRecording ? <StopCircle size={24} className="text-red-600" /> : <Video size={24} className="text-neon-green" />}
          </div>
          <span className={`font-medium text-sm ${isRecording ? 'text-red-500 animate-pulse' : 'text-white'}`}>
             {isRecording ? 'Arrêter Enreg.' : 'Vidéo Surveillance'}
          </span>
        </button>
      </div>
      
      {/* SOS Button row */}
      <div className="grid grid-cols-1">
        <button 
          onClick={() => performAction('MESSAGE')}
          disabled={isSendingMessage}
          className="bg-dark-card p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center gap-2 hover:bg-dark-surface transition active:scale-95 group relative overflow-hidden disabled:opacity-80 disabled:cursor-not-allowed"
        >
          {successAction === 'MESSAGE' ? (
             <div className="absolute inset-0 bg-dark-surface flex flex-col items-center justify-center animate-in fade-in duration-300">
               <Check size={24} className="text-yellow-500 mb-1" />
               <span className="text-[10px] font-bold text-yellow-500 tracking-widest">ALERT SENT</span>
             </div>
          ) : isSendingMessage ? (
             <div className="absolute inset-0 bg-dark-surface flex flex-col items-center justify-center animate-in fade-in duration-300">
               <Loader2 size={24} className="text-yellow-500 mb-1 animate-spin" />
               <span className="text-[10px] font-bold text-yellow-500 tracking-widest animate-pulse">SENDING...</span>
             </div>
          ) : (
            <>
              <div className="p-3 rounded-full bg-yellow-500/10 group-hover:bg-yellow-500/20">
                <MessageSquare size={24} className="text-yellow-500" />
              </div>
              <span className="font-medium text-sm text-yellow-500">SOS Alert</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1">
        <button 
          onClick={() => performAction('WIPE')}
          className="bg-dark-card p-3 rounded-xl border border-gray-800 flex items-center justify-center gap-2 hover:bg-dark-surface transition active:scale-95 group"
        >
          <Trash2 size={18} className="text-neon-red" />
          <span className="font-medium text-sm text-neon-red">Effacement Sécurisé</span>
        </button>
      </div>

      {/* Console Log */}
      <div className="flex-1 bg-black rounded-xl p-4 font-mono text-xs text-green-500 overflow-y-auto border border-gray-800">
        <div className="opacity-50 border-b border-gray-800 pb-2 mb-2">SYSTEM LOGS - SECURE CONNECTION</div>
        <p>[10:42:01] Connection established (TLS 1.3)</p>
        <p>[10:42:05] Initializing GPS subsystems...</p>
        
        {location ? (
             <p className="text-neon-blue">[SAT] GPS LOCKED: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</p>
        ) : (
             <p className="text-yellow-500 animate-pulse">[SAT] SEARCHING FOR SATELLITES...</p>
        )}

        {activeAction === 'LOCK' && <p className="text-neon-blue">[CMD] Executing REMOTE_LOCK... SUCCESS</p>}
        {activeAction === 'ALARM' && <p className="text-neon-purple">[CMD] Triggering MAX_VOLUME_ALARM... SENT</p>}
        {activeAction === 'CAMERA' && !isRecording && (
          <>
            <p className="text-neon-green">[CMD] Requesting FRONT_CAMERA_SNAPSHOT...</p>
            {showCameraSuccess && !closingCamera ? (
              <p className="text-neon-green font-bold"> >> SUCCESS: IMAGE UPLOADED [ID:7382]</p>
            ) : closingCamera ? (
              <p className="text-neon-red"> >> CONNECTION TERMINATED</p>
            ) : (
              <p className="text-neon-green animate-pulse"> >> UPLOADING EVIDENCE TO CLOUD...</p>
            )}
          </>
        )}
        {(activeAction === 'CAMERA' || activeAction === 'VIDEO_TOGGLE') && isRecording && (
             <p className="text-red-500 font-bold animate-pulse">[REC] VIDEO STREAM RECORDING... UPLOADING BLOCKS...</p>
        )}
        {activeAction === 'MESSAGE' && (
          <>
            <p className="text-yellow-500">[CMD] INITIATING SECURE SMS PROTOCOL...</p>
            {isSendingMessage ? (
                <p className="text-gray-500 animate-pulse"> >> CONTACTING CARRIER NETWORK...</p>
            ) : successAction === 'MESSAGE' ? (
                <>
                    <p className="text-yellow-500"> >> MESSAGE DISPATCHED TO OWNER</p>
                    {location && <p className="text-yellow-500"> >> APPENDED GPS: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>}
                    <p className="text-neon-green font-bold"> >> DELIVERY CONFIRMED</p>
                </>
            ) : null}
          </>
        )}
        {activeAction === 'WIPE' && (
          <p className="text-neon-red font-bold animate-pulse">[CRITICAL] WIPE_DATA SEQUENCE INITIATED... ERASING SECTORS...</p>
        )}
      </div>
    </div>
  );
};

export default RemoteControl;
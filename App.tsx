import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import AntiTheft from './components/AntiTheft';
import AntiSpy from './components/AntiSpy';
import RemoteControl from './components/RemoteControl';
import Reports from './components/Reports';
import { AppView, DeviceStatus, SecurityEvent } from './types';
import { Siren, X, Camera, Smartphone, Eye, MessageSquare, CheckCircle, Satellite } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [smsSent, setSmsSent] = useState(false);
  
  // Ref for the hidden video element used for capturing frames (canvas drawing)
  const captureVideoRef = useRef<HTMLVideoElement>(null);
  const [captures, setCaptures] = useState<{ type: 'THIEF' | 'SCREEN', url: string, timestamp: Date }[]>([]);

  // Mock State
  const [status, setStatus] = useState<DeviceStatus>({
    batteryLevel: 85,
    isCharging: false,
    isProtected: true,
    lastScan: new Date(),
    location: null, // Start with null, will update with real GPS
    ownerPhoneNumber: "+33 6 12 34 56 78" // Default mock number
  });

  const [events, setEvents] = useState<SecurityEvent[]>([
    {
      id: '1',
      type: 'INTRUSION',
      severity: 'HIGH',
      message: '3 Tentatives de déverrouillage échouées',
      timestamp: new Date(Date.now() - 1000 * 60 * 30)
    },
    {
      id: '2',
      type: 'SPYWARE',
      severity: 'MEDIUM',
      message: 'App "Flashlight" a accédé au micro',
      timestamp: new Date(Date.now() - 1000 * 60 * 120)
    }
  ]);

  // Real-time Geolocation Implementation
  useEffect(() => {
    let watchId: number;

    if ('geolocation' in navigator) {
      // 1. Get initial position quickly
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setStatus(prev => ({
            ...prev,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }));
        },
        (error) => console.warn("Initial GPS fetch failed:", error)
      );

      // 2. Watch for updates (simulating satellite tracking)
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setStatus(prev => ({
            ...prev,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }));
        },
        (error) => {
           console.error("GPS Watch Error:", error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000
        }
      );
    } else {
      console.warn("Geolocation not supported by this browser.");
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const simulateGPS = () => {
    // Simulates receiving a signal from Paris with slight jitter
    const parisLat = 48.8566;
    const parisLng = 2.3522;
    
    setStatus(prev => ({
      ...prev,
      location: {
        lat: parisLat + (Math.random() * 0.0005 - 0.00025),
        lng: parisLng + (Math.random() * 0.0005 - 0.00025)
      }
    }));
  };

  const handleUpdatePhoneNumber = (number: string) => {
    setStatus(prev => ({ ...prev, ownerPhoneNumber: number }));
    setEvents(prev => [{
      id: Date.now().toString(),
      type: 'SYSTEM',
      severity: 'LOW',
      message: `Numéro d'urgence mis à jour : ${number}`,
      timestamp: new Date()
    }, ...prev]);
  };

  const sendEmergencyAlert = () => {
    // Validation check
    if (!status.ownerPhoneNumber || status.ownerPhoneNumber === "Non configuré") {
      console.warn("Emergency SMS skipped: No phone number configured");
      return;
    }

    setSmsSent(true);
    
    // Construct GPS string
    const locString = status.location 
        ? `${status.location.lat.toFixed(5)}, ${status.location.lng.toFixed(5)}` 
        : "Recherche Satellite...";

    setEvents(prev => [{
      id: Date.now().toString(),
      type: 'MESSAGE',
      severity: 'HIGH',
      message: `SMS d'urgence envoyé au ${status.ownerPhoneNumber} [GPS: ${locString}]`,
      timestamp: new Date()
    }, ...prev]);
    
    console.log(`Sending SMS to ${status.ownerPhoneNumber}: ALERT! Phone Stolen. GPS: ${locString}`);
  };

  // Alarm Sound Effect (Oscillator)
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const playAlarm = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if(ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraStream(stream);
      // Attach to the hidden capture video element
      if (captureVideoRef.current) {
        captureVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error("Camera access denied or failed", err);
      return null;
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const takeThiefPhoto = () => {
    // Use the hidden capture video ref
    if (captureVideoRef.current && captureVideoRef.current.readyState === 4) {
      const canvas = document.createElement('canvas');
      canvas.width = captureVideoRef.current.videoWidth;
      canvas.height = captureVideoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw the current video frame mirrored to match preview
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(captureVideoRef.current, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCaptures(prev => {
          // Avoid duplicates if interval triggers multiple times too fast
          if (prev.length > 0 && prev[prev.length - 1].type === 'THIEF' && (new Date().getTime() - prev[prev.length - 1].timestamp.getTime() < 1000)) return prev;
          return [...prev, { type: 'THIEF', url: dataUrl, timestamp: new Date() }];
        });
      }
    }
  };

  const takeScreenshot = () => {
    // Simulate screen capture by creating a canvas of the viewport size
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // 1. Draw Background
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Draw Simulated Navbar/Header
      ctx.fillStyle = '#121212';
      ctx.fillRect(0, 0, canvas.width, 60);
      
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`SHADOWGUARD • ${currentView}`, canvas.width / 2, 30);

      // 3. Draw Contextual Content
      ctx.fillStyle = '#1e1e1e';
      ctx.fillRect(20, 80, canvas.width - 40, canvas.height - 160);

      const centerX = canvas.width / 2;
      const centerY = (canvas.height) / 2;

      // Draw Icon based on view
      ctx.font = '60px sans-serif';
      if (currentView === AppView.ANTI_THEFT) {
        ctx.fillStyle = '#ff003c';
        ctx.fillText('🔒', centerX, centerY - 20);
        ctx.font = '20px sans-serif';
        ctx.fillText('MOTION DETECTED', centerX, centerY + 40);
      } else if (currentView === AppView.ANTI_SPY) {
        ctx.fillStyle = '#00f3ff';
        ctx.fillText('🛡️', centerX, centerY - 20);
        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText('SCAN COMPLETE', centerX, centerY + 40);
      } else {
        ctx.fillStyle = '#888';
        ctx.fillText('📱', centerX, centerY - 20);
        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText('SYSTEM OK', centerX, centerY + 40);
      }

      // 4. Alarm Overlay Simulation (if active)
      // Since isAlarmActive is likely true when this is called during alarm, draw the red overlay look
      if (isAlarmActive) {
        ctx.fillStyle = 'rgba(255, 0, 60, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = '#ff003c';
        ctx.lineWidth = 8;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        ctx.font = 'bold 32px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 10;
        ctx.fillText('⚠️ ALARM ⚠️', centerX, centerY - 80);
        ctx.shadowBlur = 0;
      }

      // 5. Metadata
      ctx.font = '12px monospace';
      ctx.fillStyle = '#00f3ff';
      ctx.textAlign = 'right';
      ctx.fillText(`EVIDENCE: ${new Date().toLocaleTimeString()}`, canvas.width - 15, canvas.height - 15);

      const dataUrl = canvas.toDataURL('image/png');
      setCaptures(prev => {
         // Allow multiple screenshots to track screen state over time
         return [...prev, { type: 'SCREEN', url: dataUrl, timestamp: new Date() }];
      });
    }
  };

  const triggerRemoteCamera = async () => {
    const stream = await startCamera();
    if (!stream) return;

    setTimeout(() => {
      takeThiefPhoto();
      
      setEvents(prev => [{
        id: Date.now().toString(),
        type: 'SYSTEM',
        severity: 'LOW',
        message: 'Photo à distance capturée (Mode Discret)',
        timestamp: new Date()
      }, ...prev]);

      stopCamera();
    }, 1500);
  };

  useEffect(() => {
    let interval: any;
    let photoInterval: any;

    if (isAlarmActive) {
      interval = setInterval(playAlarm, 600);
      startCamera();

      // Take a photo AND screenshot every 2 seconds to build an evidence timeline
      photoInterval = setInterval(() => {
        takeThiefPhoto();
        takeScreenshot(); 
      }, 2000);

      // Initial immediate capture
      setTimeout(() => {
        takeScreenshot();
        takeThiefPhoto(); 
      }, 500);

    } else {
      stopCamera();
    }
    return () => {
      clearInterval(interval);
      clearInterval(photoInterval);
      stopCamera();
    };
  }, [isAlarmActive]);

  const triggerAlarm = () => {
    setCaptures([]);
    setSmsSent(false); 
    setIsAlarmActive(true);
    const newEvent: SecurityEvent = {
      id: Date.now().toString(),
      type: 'INTRUSION',
      severity: 'CRITICAL',
      message: 'Mouvement détecté - Alarme déclenchée',
      timestamp: new Date()
    };
    setEvents(prev => [newEvent, ...prev]);
    setStatus(prev => ({ ...prev, isProtected: false }));
    
    // Auto-send emergency SMS when alarm triggers
    setTimeout(() => {
      sendEmergencyAlert();
    }, 1500);
  };

  const stopAlarm = () => {
    setIsAlarmActive(false);
    setStatus(prev => ({ ...prev, isProtected: true }));
  };

  return (
    <div className="bg-dark-bg min-h-screen text-white font-sans overflow-hidden selection:bg-neon-blue selection:text-black">
      
      {/* Hidden Video for Captures */}
      <video 
        ref={captureVideoRef} 
        autoPlay 
        playsInline 
        muted 
        className="fixed top-0 left-0 w-1 h-1 opacity-0 pointer-events-none" 
      />

      {/* Alarm Overlay */}
      {isAlarmActive && (
        <div className="fixed inset-0 z-[100] bg-neon-red flex flex-col items-center justify-center animate-pulse-fast p-4">
          <Siren size={64} className="text-black mb-4 animate-spin" />
          <h1 className="text-4xl font-black text-black tracking-widest mb-6 text-center">ALERTE !</h1>
          
          <div className="flex flex-col gap-4 w-full max-w-sm">
            {/* Thief Cam */}
            <div className="relative bg-black rounded-lg overflow-hidden border-4 border-black aspect-video shadow-2xl">
              <video 
                ref={(el) => { if (el && cameraStream) el.srcObject = cameraStream; }}
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover transform scale-x-[-1]" 
              />
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded-full">
                 <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                 <span className="text-red-600 font-mono text-[10px] font-bold">REC</span>
              </div>

              {/* SMS Sent Notification Overlay on Video */}
              {smsSent && (
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-2 bg-green-500/90 backdrop-blur px-2 py-1 rounded text-xs text-black font-bold animate-in fade-in slide-in-from-bottom-2">
                  <CheckCircle size={14} />
                  <span>SMS ENVOYÉ AU PROPRIÉTAIRE</span>
                </div>
              )}
            </div>

            {/* Evidence Preview Strip */}
            {captures.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 px-1 snap-x">
                {captures.map((cap, idx) => (
                  <div key={idx} className="flex-shrink-0 w-24 h-24 bg-black border-2 border-white/50 rounded-lg overflow-hidden relative snap-center">
                    <img src={cap.url} alt="Evidence" className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[8px] text-white p-1 text-center truncate">
                      {cap.type === 'THIEF' ? 'INTRUS' : 'SCREEN'} {cap.timestamp.toLocaleTimeString()}
                    </div>
                    <div className="absolute top-1 right-1">
                      {cap.type === 'THIEF' ? <Eye size={12} className="text-neon-red" /> : <Smartphone size={12} className="text-neon-blue" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={stopAlarm}
            className="mt-8 px-8 py-4 bg-black text-neon-red font-bold text-xl rounded-full shadow-lg hover:scale-105 transition active:scale-95"
          >
            DÉSACTIVER (CODE PIN)
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-md mx-auto h-screen bg-black/50 relative shadow-2xl overflow-hidden flex flex-col">
        
        {/* Debug / Simulation Button */}
        <div className="absolute top-2 right-2 z-50">
            <button
                onClick={simulateGPS}
                className="bg-black/40 backdrop-blur-md border border-gray-700/50 hover:bg-black/80 hover:border-neon-blue text-xs px-3 py-1.5 rounded-full text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-1.5 group shadow-lg"
                title="Force GPS Update"
            >
                <Satellite size={12} className="text-gray-400 group-hover:text-neon-blue group-hover:animate-pulse" />
                <span className="text-[10px] font-mono tracking-wider">SIMULATE GPS</span>
            </button>
        </div>

        {/* Top Gradient Mesh */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-neon-blue/10 to-transparent pointer-events-none" />

        <div className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth">
          {currentView === AppView.DASHBOARD && (
            <Dashboard 
              status={status} 
              events={events} 
              onUpdatePhoneNumber={handleUpdatePhoneNumber}
            />
          )}
          {currentView === AppView.ANTI_THEFT && (
            <AntiTheft 
              onTriggerAlarm={triggerAlarm} 
              isAlarmActive={isAlarmActive} 
            />
          )}
          {currentView === AppView.ANTI_SPY && <AntiSpy />}
          {currentView === AppView.REMOTE && (
            <RemoteControl 
              onTriggerRemoteCamera={triggerRemoteCamera} 
              onSendAlert={sendEmergencyAlert}
              location={status.location}
            />
          )}
          {currentView === AppView.REPORTS && <Reports />}
        </div>
        
        {/* Bottom Nav */}
        <Navbar currentView={currentView} onChangeView={setCurrentView} />
      </div>
    </div>
  );
}
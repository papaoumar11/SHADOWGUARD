import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import AntiTheft from './components/AntiTheft';
import AntiSpy from './components/AntiSpy';
import RemoteControl from './components/RemoteControl';
import Reports from './components/Reports';
import { AppView, DeviceStatus, SecurityEvent } from './types';
import { Siren, X, Camera, Smartphone, Eye } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  // Ref for the hidden video element used for capturing frames (canvas drawing)
  const captureVideoRef = useRef<HTMLVideoElement>(null);
  const [captures, setCaptures] = useState<{ type: 'THIEF' | 'SCREEN', url: string, timestamp: Date }[]>([]);

  // Mock State
  const [status, setStatus] = useState<DeviceStatus>({
    batteryLevel: 85,
    isCharging: false,
    isProtected: true,
    lastScan: new Date(),
    location: { lat: 48.8566, lng: 2.3522 }
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
        // Draw the current video frame
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
      // Create a dark "UI" background look
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add text/elements to simulate the App UI
      ctx.fillStyle = '#121212';
      ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
      
      ctx.font = 'bold 20px monospace';
      ctx.fillStyle = '#ff003c';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ INTRUSION DETECTED ⚠️', canvas.width / 2, canvas.height / 2);
      ctx.font = '14px monospace';
      ctx.fillStyle = '#00f3ff';
      ctx.fillText(`Timestamp: ${new Date().toLocaleTimeString()}`, canvas.width / 2, canvas.height / 2 + 30);

      const dataUrl = canvas.toDataURL('image/png');
      setCaptures(prev => {
         if (prev.some(c => c.type === 'SCREEN')) return prev; // One screenshot per alarm session usually enough
         return [...prev, { type: 'SCREEN', url: dataUrl, timestamp: new Date() }];
      });
    }
  };

  const triggerRemoteCamera = async () => {
    // 1. Start Camera (hidden)
    const stream = await startCamera();
    if (!stream) return;

    // 2. Wait a moment for camera to adjust exposure (simulated by timeout)
    // In a real app, we might wait for the 'playing' event on the video ref.
    setTimeout(() => {
      // 3. Capture
      takeThiefPhoto();
      
      // 4. Log the event
      setEvents(prev => [{
        id: Date.now().toString(),
        type: 'SYSTEM',
        severity: 'LOW',
        message: 'Photo à distance capturée (Mode Discret)',
        timestamp: new Date()
      }, ...prev]);

      // 5. Stop camera
      stopCamera();
    }, 1500);
  };

  useEffect(() => {
    let interval: any;
    let photoInterval: any;

    if (isAlarmActive) {
      interval = setInterval(playAlarm, 600);
      // Start camera for alarm evidence
      startCamera();

      // Schedule evidence capture
      // Take a photo every 2 seconds
      photoInterval = setInterval(() => {
        takeThiefPhoto();
      }, 2000);

      // Take a screenshot immediately (after a small delay for render)
      setTimeout(() => {
        takeScreenshot();
      }, 1500);

    } else {
      // If alarm stops, we stop the camera (unless remote control is using it, but simpler to just stop)
      stopCamera();
    }
    return () => {
      clearInterval(interval);
      clearInterval(photoInterval);
      stopCamera();
    };
  }, [isAlarmActive]);

  const triggerAlarm = () => {
    setCaptures([]); // Reset previous captures
    setIsAlarmActive(true);
    // Add event log
    const newEvent: SecurityEvent = {
      id: Date.now().toString(),
      type: 'INTRUSION',
      severity: 'CRITICAL',
      message: 'Mouvement détecté - Alarme déclenchée',
      timestamp: new Date()
    };
    setEvents(prev => [newEvent, ...prev]);
    setStatus(prev => ({ ...prev, isProtected: false }));
  };

  const stopAlarm = () => {
    setIsAlarmActive(false);
    setStatus(prev => ({ ...prev, isProtected: true }));
  };

  return (
    <div className="bg-dark-bg min-h-screen text-white font-sans overflow-hidden selection:bg-neon-blue selection:text-black">
      
      {/* Hidden Video for Captures (Always mounted to handle logic) */}
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
            {/* Thief Cam (Visible only in Alarm) */}
            <div className="relative bg-black rounded-lg overflow-hidden border-4 border-black aspect-video shadow-2xl">
               {/* We use a callback ref to set the srcObject because cameraStream comes from state */}
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
        {/* Top Gradient Mesh */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-neon-blue/10 to-transparent pointer-events-none" />

        <div className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth">
          {currentView === AppView.DASHBOARD && <Dashboard status={status} events={events} />}
          {currentView === AppView.ANTI_THEFT && <AntiTheft onTriggerAlarm={triggerAlarm} isAlarmActive={isAlarmActive} />}
          {currentView === AppView.ANTI_SPY && <AntiSpy />}
          {currentView === AppView.REMOTE && <RemoteControl onTriggerRemoteCamera={triggerRemoteCamera} />}
          {currentView === AppView.REPORTS && <Reports />}
        </div>
        
        {/* Bottom Nav */}
        <Navbar currentView={currentView} onChangeView={setCurrentView} />
      </div>
    </div>
  );
}
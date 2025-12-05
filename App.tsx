import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import AntiTheft from './components/AntiTheft';
import AntiSpy from './components/AntiSpy';
import RemoteControl from './components/RemoteControl';
import Reports from './components/Reports';
import { AppView, DeviceStatus, SecurityEvent } from './types';
import { Siren, X, Camera, Smartphone, Eye, MessageSquare, CheckCircle, Satellite, ShieldAlert, AlertTriangle, Lock, Video, PhoneIncoming } from 'lucide-react';
import { supabase } from './services/supabaseClient';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [smsSent, setSmsSent] = useState(false);
  
  // System Lockdown State
  const [isSystemLocked, setIsSystemLocked] = useState(false);
  const [unlockPin, setUnlockPin] = useState("");
  const [unlockError, setUnlockError] = useState(false);
  
  // Ref for the hidden video element used for capturing frames (canvas drawing)
  const captureVideoRef = useRef<HTMLVideoElement>(null);
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Evidence State
  const [captures, setCaptures] = useState<{ type: 'THIEF' | 'SCREEN' | 'VIDEO', url: string, timestamp: Date }[]>([]);
  // Used to signal RemoteControl when recording stops
  const [recordingFinishedAt, setRecordingFinishedAt] = useState<number | null>(null);

  // Mock State
  const [status, setStatus] = useState<DeviceStatus>({
    batteryLevel: 85,
    isCharging: false,
    isProtected: true,
    lastScan: new Date(),
    location: null, 
    ownerPhoneNumber: "" 
  });

  const [events, setEvents] = useState<SecurityEvent[]>([]);

  // --- SUPABASE INTEGRATION ---

  // 1. Fetch Initial Data (Events & Settings)
  useEffect(() => {
    const fetchInitialData = async () => {
      // Fetch Settings
      const { data: settings } = await supabase.from('settings').select('*').single();
      if (settings && settings.owner_phone) {
        setStatus(prev => ({ ...prev, ownerPhoneNumber: settings.owner_phone }));
      }

      // Fetch Events
      const { data: remoteEvents, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (remoteEvents) {
        const formattedEvents: SecurityEvent[] = remoteEvents.map((e: any) => ({
          id: e.id,
          type: e.type,
          severity: e.severity,
          message: e.message,
          timestamp: new Date(e.created_at)
        }));
        setEvents(formattedEvents);
      } else if (error) {
        console.warn("Supabase Events fetch failed (Tables might not exist yet):", error.message);
        // Fallback mock events
        setEvents([
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
      }
    };

    fetchInitialData();

    // 2. Realtime Subscription for new Events
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
        },
        (payload) => {
          const newEvent = payload.new;
          setEvents((prev) => [
            {
              id: newEvent.id,
              type: newEvent.type,
              severity: newEvent.severity,
              message: newEvent.message,
              timestamp: new Date(newEvent.created_at),
            },
            ...prev,
          ]);
          
          // --- COMMAND RECEIVER LOGIC ---
          // Check if the new event is actually a remote command
          if (newEvent.type === 'CMD_ALARM') {
            console.log("REMOTE COMMAND RECEIVED: ALARM");
            triggerAlarm();
          } else if (newEvent.type === 'CMD_WIPE') {
            console.log("REMOTE COMMAND RECEIVED: WIPE");
            handleSystemTamper();
          } 
          // Note: CMD_LOCK and CMD_MESSAGE are mostly for logging/status in this demo, 
          // but could trigger logic here similarly.
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Check for existing lockdown on mount (Persistence)
  useEffect(() => {
    const locked = localStorage.getItem('shadowguard_locked');
    if (locked === 'true') {
      setIsSystemLocked(true);
    }

    // Watch for manual tampering of local storage
    const handleStorageChange = (e: StorageEvent) => {
        // If system is locked, ensure the key stays locked even if cleared
        if (isSystemLocked) {
             if ((e.key === 'shadowguard_locked' && e.newValue === null) || e.key === null) {
                // Re-apply lock if someone tries to clear it manually or clears all storage
                localStorage.setItem('shadowguard_locked', 'true');
             }
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isSystemLocked]);

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
        (error) => console.warn(`Initial GPS fetch failed: ${error.message} (${error.code})`)
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
           console.warn(`GPS Watch Error: ${error.message} (Code: ${error.code})`);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000, 
          timeout: 20000   
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

  const simulateGPSError = () => {
    // Simulate error by clearing location
    setStatus(prev => ({
      ...prev,
      location: null
    }));
    // Log typical error format
    console.warn("GPS Watch Error: User denied Geolocation (Code: 1)");
  };

  const simulateIncomingCall = () => {
    const callerIds = ["+1 (555) 012-3456", "Numéro Masqué", "+33 6 98 76 54 32", "Potential Spam"];
    const randomCaller = callerIds[Math.floor(Math.random() * callerIds.length)];
    const mockLat = status.location ? status.location.lat + 0.002 : 48.8580;
    const mockLng = status.location ? status.location.lng + 0.002 : 2.2945;

    handleAddEvent({
        type: 'CALL_TRACE',
        severity: 'MEDIUM',
        message: `Appel Intercepté: ${randomCaller} [GPS: ${mockLat.toFixed(5)}, ${mockLng.toFixed(5)}]`,
        timestamp: new Date()
    });
    console.log(`Call Interceptor: Tracing source of ${randomCaller}... Resolved to ${mockLat}, ${mockLng}`);
  };

  const handleUpdatePhoneNumber = async (number: string) => {
    setStatus(prev => ({ ...prev, ownerPhoneNumber: number }));
    
    // Optimistic Update
    const sysEvent: Omit<SecurityEvent, 'id'> = {
        type: 'SYSTEM',
        severity: 'LOW',
        message: `Numéro d'urgence mis à jour : ${number}`,
        timestamp: new Date()
    };
    handleAddEvent(sysEvent);

    // Persist to Supabase
    const { error } = await supabase
        .from('settings')
        .upsert({ id: 1, owner_phone: number });

    if (error) console.error("Failed to save phone number:", error);
  };

  const sendEmergencyAlert = () => {
    if (!status.ownerPhoneNumber || status.ownerPhoneNumber === "Non configuré") {
      console.warn("Emergency SMS skipped: No phone number configured");
      return;
    }

    setSmsSent(true);
    
    const locString = status.location 
        ? `${status.location.lat.toFixed(5)}, ${status.location.lng.toFixed(5)}` 
        : "Recherche Satellite...";

    handleAddEvent({
      type: 'MESSAGE',
      severity: 'HIGH',
      message: `SMS d'urgence envoyé au ${status.ownerPhoneNumber} [GPS: ${locString}]`,
      timestamp: new Date()
    });
    
    console.log(`Sending SMS to ${status.ownerPhoneNumber}: ALERT! Phone Stolen. GPS: ${locString}`);
  };

  // Logic to trigger system lockdown (Tamper or Wipe)
  const handleSystemTamper = () => {
    setIsSystemLocked(true);
    localStorage.setItem('shadowguard_locked', 'true');
    console.warn("SYSTEM LOCKDOWN INITIATED: Integrity Violation");
    handleAddEvent({
        type: 'SYSTEM',
        severity: 'CRITICAL',
        message: 'VERROUILLAGE SYSTÈME DÉCLENCHÉ',
        timestamp: new Date()
    });
  };

  // Logic to unlock system
  const handleUnlockSystem = (pin: string) => {
    if (unlockPin.length < 4) {
        const newPin = unlockPin + pin;
        setUnlockPin(newPin);
        if (newPin.length === 4) {
            if (newPin === '1234') { // Hardcoded Master PIN
                setIsSystemLocked(false);
                setUnlockPin("");
                localStorage.removeItem('shadowguard_locked');
                handleAddEvent({
                    type: 'SYSTEM',
                    severity: 'HIGH',
                    message: 'Système restauré après verrouillage de sécurité',
                    timestamp: new Date()
                });
            } else {
                setUnlockError(true);
                setTimeout(() => {
                    setUnlockPin("");
                    setUnlockError(false);
                }, 500);
            }
        }
    }
  };

  const handleAddEvent = async (event: Omit<SecurityEvent, 'id'>) => {
    // Optimistic UI update
    const tempId = Date.now().toString();
    setEvents(prev => [{ id: tempId, ...event }, ...prev]);

    // Send to Supabase
    const { error } = await supabase.from('events').insert({
        type: event.type,
        severity: event.severity,
        message: event.message
    });

    if (error) console.error("Error logging event to Supabase:", error);
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
        // Wait for video to actually play to ensure we don't capture black frame
        await captureVideoRef.current.play().catch(e => console.error("Video play error", e));
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

  // --- VIDEO RECORDING LOGIC ---

  const handleStartRecording = async () => {
    if (!cameraStream) {
        // If camera isn't on, start it first
        const stream = await startCamera();
        if (!stream) return;
        // Small delay to ensure stream is ready
        setTimeout(() => startRecorder(stream), 500);
    } else {
        startRecorder(cameraStream);
    }
  };

  const startRecorder = (stream: MediaStream) => {
    try {
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setCaptures(prev => [...prev, { type: 'VIDEO', url: url, timestamp: new Date() }]);
        
        // Notify RemoteControl that recording is finished (to trigger UI cleanup/auto-close)
        setRecordingFinishedAt(Date.now());

        handleAddEvent({
            type: 'SYSTEM',
            severity: 'MEDIUM',
            message: 'Enregistrement vidéo de surveillance terminé',
            timestamp: new Date()
        });
      };

      recorder.start();
      setIsRecording(true);
      
      handleAddEvent({
        type: 'SYSTEM',
        severity: 'MEDIUM',
        message: 'Enregistrement vidéo à distance démarré',
        timestamp: new Date()
      });

    } catch (error) {
      console.error("Failed to start MediaRecorder:", error);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Optional: Stop camera if it was started just for this (logic depends on UX preference)
      // For now, we leave camera open to allow multiple actions, managed by RemoteControl
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
      
      handleAddEvent({
        type: 'SYSTEM',
        severity: 'LOW',
        message: 'Photo à distance capturée (Mode Discret)',
        timestamp: new Date()
      });

      stopCamera();
    }, 1500);
  };

  useEffect(() => {
    let interval: any;
    let photoInterval: any;

    if (isAlarmActive) {
      interval = setInterval(playAlarm, 600);
      
      // Changed logic: Wait for camera stream to be fully ready before starting capture sequence
      startCamera().then((stream) => {
        if (stream) {
            // Immediate capture sequence once camera is ready
            // We use a small timeout to allow the video element to process the first frame
            setTimeout(() => {
               takeThiefPhoto();
               takeScreenshot();
            }, 300);

            // Then Periodic capture every 2 seconds
            photoInterval = setInterval(() => {
              takeThiefPhoto();
              takeScreenshot(); 
            }, 2000);
        }
      });

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
    
    handleAddEvent({
      type: 'INTRUSION',
      severity: 'CRITICAL',
      message: 'Mouvement détecté - Alarme déclenchée',
      timestamp: new Date()
    });

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

      {/* SYSTEM LOCKDOWN OVERLAY (High Z-Index) */}
      {isSystemLocked && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
           {/* Background Stripes */}
           <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#ff003c10_10px,#ff003c10_20px)] pointer-events-none"></div>
           
           <ShieldAlert size={80} className="text-neon-red mb-6 animate-pulse" />
           
           <h1 className="text-4xl font-black text-neon-red tracking-tighter mb-2 text-center">DATA LOCKED</h1>
           <p className="text-white font-mono text-sm mb-8 text-center bg-neon-red/10 border border-neon-red/50 px-4 py-2 rounded">
             SECURITY VIOLATION DETECTED<br/>ACCESS BLOCKED
           </p>

           <div className={`w-full max-w-xs flex flex-col items-center ${unlockError ? 'animate-shake' : ''}`}>
              {/* PIN Dots */}
              <div className="flex gap-4 mb-8">
                 {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`w-4 h-4 rounded-full border border-neon-red transition-all ${i < unlockPin.length ? 'bg-neon-red shadow-[0_0_10px_#ff003c]' : 'bg-transparent'}`} />
                 ))}
              </div>
              
              {unlockError && <p className="text-neon-red font-bold font-mono text-xs mb-4">ACCESS DENIED</p>}

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-6 w-full">
                 {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button 
                      key={num}
                      onClick={() => handleUnlockSystem(num.toString())}
                      className="w-16 h-16 rounded-full border border-gray-700 bg-dark-card hover:bg-neon-red/20 hover:border-neon-red flex items-center justify-center text-xl font-bold text-white transition active:scale-95 mx-auto"
                    >
                       {num}
                    </button>
                 ))}
                 <div />
                 <button 
                      onClick={() => handleUnlockSystem('0')}
                      className="w-16 h-16 rounded-full border border-gray-700 bg-dark-card hover:bg-neon-red/20 hover:border-neon-red flex items-center justify-center text-xl font-bold text-white transition active:scale-95 mx-auto"
                    >
                       0
                 </button>
                 <div />
              </div>
           </div>
           
           <div className="mt-12 text-center opacity-50">
             <div className="flex items-center gap-2 justify-center text-xs text-gray-500 font-mono mb-1">
               <Lock size={12} />
               <span>SECURE BOOT PROTOCOL</span>
             </div>
             <p className="text-[10px] text-gray-600">Contact administrator for recovery key.</p>
           </div>
        </div>
      )}

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
                  <div key={idx} className="flex-shrink-0 w-24 h-24 bg-black border-2 border-white/50 rounded-lg overflow-hidden relative snap-center group">
                    {cap.type === 'VIDEO' ? (
                        <video src={cap.url} className="w-full h-full object-cover" muted />
                    ) : (
                        <img src={cap.url} alt="Evidence" className="w-full h-full object-cover" />
                    )}
                    
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[8px] text-white p-1 text-center truncate">
                      {cap.type} {cap.timestamp.toLocaleTimeString()}
                    </div>
                    <div className="absolute top-1 right-1 bg-black/50 rounded-full p-1">
                      {cap.type === 'THIEF' ? <Eye size={10} className="text-neon-red" /> : 
                       cap.type === 'VIDEO' ? <Video size={10} className="text-neon-green" /> : 
                       <Smartphone size={10} className="text-neon-blue" />}
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
        
        {/* Debug / Simulation Buttons */}
        <div className="absolute top-2 right-2 z-50 flex gap-2">
            <button
                onClick={simulateGPS}
                className="bg-black/40 backdrop-blur-md border border-gray-700/50 hover:bg-black/80 hover:border-neon-blue text-xs px-3 py-1.5 rounded-full text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-1.5 group shadow-lg"
                title="Force GPS Update"
            >
                <Satellite size={12} className="text-gray-400 group-hover:text-neon-blue group-hover:animate-pulse" />
                <span className="text-[10px] font-mono tracking-wider">GPS SIM</span>
            </button>
            <button
                onClick={simulateGPSError}
                className="bg-black/40 backdrop-blur-md border border-gray-700/50 hover:bg-black/80 hover:border-neon-red text-xs px-3 py-1.5 rounded-full text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-1.5 group shadow-lg"
                title="Simulate GPS Error"
            >
                <AlertTriangle size={12} className="text-gray-400 group-hover:text-neon-red" />
                <span className="text-[10px] font-mono tracking-wider">GPS ERR</span>
            </button>
             <button
                onClick={simulateIncomingCall}
                className="bg-black/40 backdrop-blur-md border border-gray-700/50 hover:bg-black/80 hover:border-neon-purple text-xs px-3 py-1.5 rounded-full text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-1.5 group shadow-lg"
                title="Simulate Incoming Call Trace"
            >
                <PhoneIncoming size={12} className="text-gray-400 group-hover:text-neon-purple" />
                <span className="text-[10px] font-mono tracking-wider">CALL SIM</span>
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
              onSimulateTamper={handleSystemTamper}
            />
          )}
          {currentView === AppView.ANTI_THEFT && (
            <AntiTheft 
              onTriggerAlarm={triggerAlarm} 
              isAlarmActive={isAlarmActive}
              onLogEvent={handleAddEvent}
            />
          )}
          {currentView === AppView.ANTI_SPY && (
             <AntiSpy onLogEvent={handleAddEvent} />
          )}
          {currentView === AppView.REMOTE && (
            <RemoteControl 
              onTriggerRemoteCamera={triggerRemoteCamera} 
              onSendAlert={sendEmergencyAlert}
              location={status.location}
              onRemoteWipe={handleSystemTamper}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              isRecording={isRecording}
              recordingFinishedAt={recordingFinishedAt}
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
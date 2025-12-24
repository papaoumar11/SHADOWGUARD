import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import AntiTheft from './components/AntiTheft';
import AntiSpy from './components/AntiSpy';
import RemoteControl from './components/RemoteControl';
import Reports from './components/Reports';
import { AppView, DeviceStatus, SecurityEvent } from './types';
import { Siren, ShieldAlert, Satellite, PhoneIncoming } from 'lucide-react';
import { supabase, db } from './services/supabaseClient';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  
  // System Lockdown State
  const [isSystemLocked, setIsSystemLocked] = useState(false);
  const [unlockPin, setUnlockPin] = useState("");
  const [unlockError, setUnlockError] = useState(false);
  
  // Refs
  const captureVideoRef = useRef<HTMLVideoElement>(null);

  // Connection & Data State
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingFinishedAt, setRecordingFinishedAt] = useState<number | null>(null);

  const [status, setStatus] = useState<DeviceStatus>({
    batteryLevel: 85,
    isCharging: false,
    isProtected: true,
    lastScan: new Date(),
    location: null, 
    ownerPhoneNumber: "" 
  });

  const [events, setEvents] = useState<SecurityEvent[]>([]);

  // Handle Event Logging (Centralized)
  const handleAddEvent = useCallback(async (event: Omit<SecurityEvent, 'id'>) => {
    const tempId = Date.now().toString();
    const fullEvent = { id: tempId, ...event };
    setEvents(prev => [fullEvent, ...prev]);

    await db.execute(() => supabase.from('events').insert({
      type: event.type,
      severity: event.severity,
      message: event.message
    }));
  }, []);

  // Handle Remote Commands
  const handleSendCommand = useCallback(async (type: string, message: string) => {
     await db.execute(() => supabase.from('events').insert({
        type: type as any,
        severity: 'HIGH',
        message: `REMOTE_CMD: ${message}`
     }));
  }, []);

  // Initialization
  useEffect(() => {
    const init = async () => {
      // Step 1: Settings
      // Fix: Added explicit any type for database response to bypass unknown property access error
      const settings = await db.execute<any>(() => supabase.from('settings').select('*').single());
      if (settings?.owner_phone) setStatus(s => ({ ...s, ownerPhoneNumber: settings.owner_phone }));

      // Step 2: Device Status
      // Fix: Added explicit any type for database response to bypass unknown property access error
      const devStatus = await db.execute<any>(() => supabase.from('device_status').select('*').eq('id', 1).single());
      if (devStatus) {
        setStatus(s => ({
          ...s,
          batteryLevel: devStatus.battery_level ?? s.batteryLevel,
          isCharging: devStatus.is_charging ?? s.isCharging,
          isProtected: devStatus.is_protected ?? s.isProtected
        }));
      }

      // Step 3: Recent Events
      // Fix: Added any[] type assertion to enable map() and other array methods on the database result
      const remoteEvents = await db.execute<any[]>(() => supabase.from('events').select('*').order('created_at', { ascending: false }).limit(20));
      if (remoteEvents) {
        setEvents(remoteEvents.map((e: any) => ({
          id: e.id,
          type: e.type,
          severity: e.severity,
          message: e.message,
          timestamp: new Date(e.created_at)
        })));
      }

      // Ensure at least one default event
      setEvents(prev => prev.length ? prev : [
        { id: '1', type: 'SYSTEM', severity: 'LOW', message: 'ShadowGuard Operationnel (Mode Résilience)', timestamp: new Date() }
      ]);
      
      setIsDataLoaded(true);
    };

    init();
  }, []);

  // Periodic Status Sync (Safe)
  useEffect(() => {
    if (!isDataLoaded || db.isOffline()) return;

    const syncStatus = async () => {
      await db.execute(() => supabase.from('device_status').upsert({
        id: 1, 
        battery_level: status.batteryLevel,
        is_charging: status.isCharging,
        is_protected: status.isProtected,
        updated_at: new Date().toISOString()
      }));
    };

    const timer = setTimeout(syncStatus, 5000); // Increased interval to reduce noise
    return () => clearTimeout(timer);
  }, [status.batteryLevel, status.isCharging, status.isProtected, isDataLoaded]);

  // Realtime Commands
  useEffect(() => {
    if (!isDataLoaded || db.isOffline()) return;
    
    let channel: any;
    try {
      channel = supabase.channel('remote-cmds')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, (payload) => {
          const e = payload.new;
          if (e.type === 'CMD_ALARM') triggerAlarm();
          if (e.type === 'CMD_WIPE') handleSystemTamper();
        })
        .subscribe();
    } catch (e) {
      // Silent bypass
    }
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [isDataLoaded]);

  // Simulation Logic (Battery, GPS, etc.)
  useEffect(() => {
    const batteryInterval = setInterval(() => {
      setStatus(prev => {
        let newLevel = prev.isCharging ? prev.batteryLevel + 1 : prev.batteryLevel - 0.1;
        return { ...prev, batteryLevel: Math.max(0, Math.min(100, Math.round(newLevel))) };
      });
    }, 15000);
    return () => clearInterval(batteryInterval);
  }, []);

  useEffect(() => {
    if (localStorage.getItem('shadowguard_locked') === 'true') setIsSystemLocked(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => setStatus(s => ({ ...s, location: { lat: p.coords.latitude, lng: p.coords.longitude } })),
        () => {}
      );
    }
  }, []);

  const handleSystemTamper = () => {
    setIsSystemLocked(true);
    localStorage.setItem('shadowguard_locked', 'true');
    handleAddEvent({ type: 'SYSTEM', severity: 'CRITICAL', message: 'VERROUILLAGE SYSTÈME DÉCLENCHÉ', timestamp: new Date() });
  };

  const handleUnlockSystem = (pin: string) => {
    const nextPin = (unlockPin + pin).slice(0, 4);
    setUnlockPin(nextPin);
    if (nextPin.length === 4) {
      if (nextPin === '1234') {
        setIsSystemLocked(false);
        setUnlockPin("");
        localStorage.removeItem('shadowguard_locked');
        handleAddEvent({ type: 'SYSTEM', severity: 'HIGH', message: 'Système restauré', timestamp: new Date() });
      } else {
        setUnlockError(true);
        setTimeout(() => { setUnlockPin(""); setUnlockError(false); }, 500);
      }
    }
  };

  const triggerAlarm = () => {
    setIsAlarmActive(true);
    setStatus(s => ({ ...s, isProtected: false }));
    handleAddEvent({ type: 'INTRUSION', severity: 'CRITICAL', message: 'Alarme Déclenchée', timestamp: new Date() });
    if (status.ownerPhoneNumber) setSmsSent(true);
  };

  const stopAlarm = () => {
    setIsAlarmActive(false);
    setStatus(s => ({ ...s, isProtected: true }));
  };

  if (!isDataLoaded) {
    return (
      <div className="bg-black min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert size={64} className="text-neon-blue animate-pulse mb-4" />
        <h2 className="text-white font-mono text-sm tracking-widest uppercase">Initializing Defence Systems...</h2>
      </div>
    );
  }

  return (
    <div className="bg-dark-bg min-h-screen text-white font-sans overflow-hidden">
      <video ref={captureVideoRef} autoPlay playsInline muted className="fixed top-0 left-0 w-1 h-1 opacity-0 pointer-events-none" />

      {isSystemLocked && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-6 animate-in fade-in">
           <ShieldAlert size={80} className="text-neon-red mb-6 animate-pulse" />
           <h1 className="text-4xl font-black text-neon-red mb-8 tracking-tighter">DEVICE LOCKED</h1>
           <div className={`flex gap-4 mb-8 ${unlockError ? 'animate-shake' : ''}`}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`w-4 h-4 rounded-full border border-neon-red ${i < unlockPin.length ? 'bg-neon-red shadow-lg shadow-neon-red/50' : ''}`} />
              ))}
           </div>
           <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, ""].map((v, i) => (
                v !== "" ? (
                  <button key={i} onClick={() => handleUnlockSystem(v.toString())} className="w-16 h-16 rounded-full border border-gray-800 bg-dark-card text-xl font-bold active:scale-95">{v}</button>
                ) : <div key={i} />
              ))}
           </div>
        </div>
      )}

      {isAlarmActive && (
        <div className="fixed inset-0 z-[100] bg-neon-red flex flex-col items-center justify-center animate-pulse-fast text-black p-6">
          <Siren size={80} className="mb-4 animate-spin" />
          <h1 className="text-4xl font-black mb-8 text-center tracking-tighter uppercase">Intrusion Alert Active</h1>
          <button onClick={stopAlarm} className="px-12 py-5 bg-black text-white font-black rounded-full text-xl shadow-2xl tracking-widest active:scale-95 transition-transform uppercase">Deactivate</button>
        </div>
      )}

      <div className="max-w-md mx-auto h-screen bg-black/50 relative shadow-2xl overflow-hidden flex flex-col border-x border-gray-900">
        <div className="absolute top-2 right-2 z-50 flex gap-2">
            <button onClick={() => setStatus(s => ({ ...s, location: { lat: 48.8566 + (Math.random() * 0.01), lng: 2.3522 + (Math.random() * 0.01) } }))} className="bg-black/40 backdrop-blur-md border border-gray-800 text-[10px] px-3 py-1 rounded-full text-gray-400 hover:text-white transition-all uppercase tracking-widest"><Satellite size={12} className="inline mr-1" /> GPS</button>
            <button onClick={() => handleAddEvent({ type: 'CALL_TRACE', severity: 'MEDIUM', message: `Appel Intercepté: +33 6 ${Math.floor(Math.random()*90+10)}... [GPS: 48.85, 2.35]`, timestamp: new Date() })} className="bg-black/40 backdrop-blur-md border border-gray-800 text-[10px] px-3 py-1 rounded-full text-gray-400 hover:text-white transition-all uppercase tracking-widest"><PhoneIncoming size={12} className="inline mr-1" /> CALL</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {currentView === AppView.DASHBOARD && <Dashboard status={status} events={events} onUpdatePhoneNumber={(num) => { setStatus(s => ({ ...s, ownerPhoneNumber: num })); db.execute(() => supabase.from('settings').upsert({ id: 1, owner_phone: num })); }} onSimulateTamper={handleSystemTamper} />}
          {currentView === AppView.ANTI_THEFT && <AntiTheft onTriggerAlarm={triggerAlarm} isAlarmActive={isAlarmActive} onLogEvent={handleAddEvent} />}
          {currentView === AppView.ANTI_SPY && <AntiSpy onLogEvent={handleAddEvent} />}
          {currentView === AppView.REMOTE && <RemoteControl onTriggerRemoteCamera={() => {}} onSendAlert={() => {}} location={status.location} onRemoteWipe={handleSystemTamper} onStartRecording={() => setIsRecording(true)} onStopRecording={() => setIsRecording(false)} isRecording={isRecording} recordingFinishedAt={recordingFinishedAt} onSendCommand={handleSendCommand} />}
          {currentView === AppView.REPORTS && <Reports events={events} />}
        </div>
        <Navbar currentView={currentView} onChangeView={setCurrentView} />
      </div>
    </div>
  );
}

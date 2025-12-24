import React, { useState } from 'react';
import { Shield, Search, AlertTriangle, CheckCircle, Bug, Terminal, Ban, Wifi, Globe, Activity, Loader2 } from 'lucide-react';
import { analyzeAppsWithGemini, analyzeNetworkWithGemini } from '../services/geminiService';
import { SuspiciousApp, SecurityEvent } from '../types';

interface AntiSpyProps {
  onLogEvent: (event: Omit<SecurityEvent, 'id'>) => void;
}

interface NetworkIssue {
  id: string;
  name: string;
  detail: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'SAFE' | 'WARNING' | 'DANGEROUS';
}

const AntiSpy: React.FC<AntiSpyProps> = ({ onLogEvent }) => {
  const [scanning, setScanning] = useState(false);
  const [scanType, setScanType] = useState<'APPS' | 'NETWORK' | null>(null);
  const [appResults, setAppResults] = useState<SuspiciousApp[] | null>(null);
  const [networkResults, setNetworkResults] = useState<NetworkIssue[] | null>(null);
  const [blockedApps, setBlockedApps] = useState<string[]>([]);
  const [scanStep, setScanStep] = useState("");

  const startAppScan = async () => {
    setScanType('APPS');
    setScanning(true);
    setAppResults(null);
    setNetworkResults(null);
    
    setScanStep("Initialisation des moteurs IA...");
    await new Promise(r => setTimeout(r, 800));
    setScanStep("Lecture du manifeste des applications...");
    await new Promise(r => setTimeout(r, 800));
    setScanStep("Analyse heuristique par Gemini 3...");

    try {
      const data = await analyzeAppsWithGemini();
      setAppResults(data);

      data.forEach(app => {
        if (app.status === 'DANGEROUS' || app.status === 'WARNING') {
          onLogEvent({
            type: 'SPYWARE',
            severity: app.status === 'DANGEROUS' ? 'HIGH' : 'MEDIUM',
            message: `Menace détectée: ${app.name} - ${app.reason}`,
            timestamp: new Date()
          });
        }
      });
    } catch (error) {
      console.error("App Scan failed", error);
    } finally {
      setScanning(false);
    }
  };

  const startNetworkScan = async () => {
    setScanType('NETWORK');
    setScanning(true);
    setAppResults(null);
    setNetworkResults(null);

    setScanStep("Attente des paquets entrants...");
    await new Promise(r => setTimeout(r, 800));
    setScanStep("Inspection SSL/TLS Handshakes...");
    await new Promise(r => setTimeout(r, 1000));
    setScanStep("Intelligence Artificielle: Analyse de trafic...");

    try {
      const data = await analyzeNetworkWithGemini();
      setNetworkResults(data);

      if (data.length > 0) {
        onLogEvent({
          type: 'NETWORK',
          severity: 'HIGH',
          message: `Réseau: ${data.length} anomalies identifiées par l'IA.`,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error("Network Scan failed", error);
    } finally {
      setScanning(false);
    }
  };

  const handleBlockApp = (app: SuspiciousApp) => {
    setBlockedApps(prev => [...prev, app.packageName]);
    onLogEvent({
      type: 'SYSTEM',
      severity: 'HIGH',
      message: `Application bloquée: ${app.name}`,
      timestamp: new Date()
    });
  };

  const resetView = () => {
    setAppResults(null);
    setNetworkResults(null);
    setScanType(null);
  };

  return (
    <div className="p-6 space-y-6 pb-24 h-full flex flex-col">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-1 tracking-tighter uppercase">
          Protection <span className="text-neon-blue">AI-Spy</span>
        </h2>
        <p className="text-gray-400 text-xs font-mono">NEURAL DEFENSE SYSTEM V2.5</p>
      </div>

      {!scanning && !appResults && !networkResults && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-700">
          <div className="w-44 h-44 bg-dark-card rounded-full flex items-center justify-center border border-gray-800 shadow-[0_0_30px_rgba(0,0,0,0.5)] mb-8 relative">
             <Shield size={64} className="text-neon-blue/40" />
             <div className="absolute inset-0 border-2 border-neon-blue/20 rounded-full animate-ping"></div>
             <div className="absolute inset-4 border border-neon-purple/20 rounded-full animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full">
            <button 
                onClick={startAppScan}
                className="flex flex-col items-center justify-center gap-3 p-6 bg-dark-card border border-gray-700 hover:border-neon-blue hover:bg-dark-surface rounded-xl transition-all group relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-1 h-full bg-neon-blue opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="p-3 bg-neon-blue/10 rounded-full group-hover:bg-neon-blue/20 transition">
                    <Terminal size={24} className="text-neon-blue" />
                </div>
                <span className="font-bold text-[10px] tracking-widest text-white uppercase">Scan Apps</span>
            </button>

            <button 
                onClick={startNetworkScan}
                className="flex flex-col items-center justify-center gap-3 p-6 bg-dark-card border border-gray-700 hover:border-neon-purple hover:bg-dark-surface rounded-xl transition-all group relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-1 h-full bg-neon-purple opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="p-3 bg-neon-purple/10 rounded-full group-hover:bg-neon-purple/20 transition">
                    <Wifi size={24} className="text-neon-purple" />
                </div>
                <span className="font-bold text-[10px] tracking-widest text-white uppercase">AI Network</span>
            </button>
          </div>
        </div>
      )}

      {scanning && (
        <div className="flex-1 flex flex-col items-center justify-center">
           <div className="relative w-48 h-48 flex items-center justify-center">
             <div className="absolute inset-0 border-4 border-gray-800 rounded-full opacity-20"></div>
             <div className={`absolute inset-0 border-4 border-t-transparent border-r-transparent border-b-transparent rounded-full animate-spin`} 
                  style={{ borderColor: scanType === 'APPS' ? '#00f3ff' : '#bc13fe' }}></div>
             
             <div className="z-10 flex flex-col items-center">
                {scanType === 'APPS' ? <Search size={48} className="text-neon-blue animate-pulse" /> : <Activity size={48} className="text-neon-purple animate-pulse" />}
             </div>
           </div>
           
           <div className="mt-12 space-y-4 text-center w-full px-8">
             <p className={`font-mono text-sm font-bold tracking-[0.2em] ${scanType === 'APPS' ? 'text-neon-blue' : 'text-neon-purple'}`}>
                {scanType === 'APPS' ? 'DEEP APP SCANNING' : 'AI NETWORK ANALYSIS'}
             </p>
             <div className="h-8 flex flex-col items-center justify-center">
                <span className="text-[10px] text-gray-500 font-mono animate-in fade-in slide-in-from-bottom-2 duration-300" key={scanStep}>
                   {scanStep}
                </span>
             </div>
             <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full animate-[scan_2s_linear_infinite] ${scanType === 'APPS' ? 'bg-neon-blue' : 'bg-neon-purple'}`}></div>
             </div>
           </div>
        </div>
      )}

      {(appResults || networkResults) && (
        <div className="flex-1 overflow-y-auto space-y-4 animate-in slide-in-from-bottom-5 fade-in duration-500 pr-1">
          <div className="flex items-center justify-between sticky top-0 bg-dark-bg/95 backdrop-blur py-2 z-10 border-b border-gray-800">
            <h3 className="font-bold text-sm tracking-widest uppercase flex items-center gap-2">
              {scanType === 'APPS' ? <Shield size={16} className="text-neon-blue" /> : <Globe size={16} className="text-neon-purple" />}
              Analyse Terminée
            </h3>
            <button onClick={resetView} className="text-[10px] font-bold text-neon-blue uppercase hover:underline">Nouveau Scan</button>
          </div>

          <div className="grid gap-3">
            {appResults?.map((app, idx) => {
              const isBlocked = blockedApps.includes(app.packageName);
              return (
                <div key={idx} className={`p-4 rounded-xl border bg-dark-card transition-all ${isBlocked ? 'opacity-50 border-gray-800' : app.status === 'DANGEROUS' ? 'border-neon-red/30 bg-neon-red/5' : 'border-gray-800'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${app.status === 'DANGEROUS' ? 'bg-neon-red/20' : 'bg-gray-800'}`}>
                        {app.status === 'DANGEROUS' ? <Bug size={18} className="text-neon-red" /> : <CheckCircle size={18} className="text-neon-blue" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold block text-white">{app.name}</span>
                        <span className="text-[9px] text-gray-500 font-mono">{app.packageName}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 border-l border-gray-700 pl-2 mb-3 leading-relaxed">{app.reason}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-1">
                       {app.permissions.slice(0, 2).map(p => (
                         <span key={p} className="text-[8px] px-1.5 py-0.5 bg-dark-surface border border-gray-700 text-gray-500 rounded font-mono uppercase">{p}</span>
                       ))}
                    </div>
                    {app.status === 'DANGEROUS' && !isBlocked && (
                       <button onClick={() => handleBlockApp(app)} className="text-[9px] font-bold bg-neon-red text-black px-2 py-1 rounded hover:bg-red-500 transition">BLOQUER</button>
                    )}
                  </div>
                </div>
              );
            })}

            {networkResults?.map((issue) => (
                <div key={issue.id} className={`p-4 rounded-xl border bg-dark-card ${issue.status === 'DANGEROUS' ? 'border-neon-purple/50 bg-neon-purple/5' : 'border-gray-800'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${issue.status === 'DANGEROUS' ? 'bg-neon-purple/20' : 'bg-gray-800'}`}>
                            <Wifi size={18} className={issue.status === 'DANGEROUS' ? 'text-neon-purple' : 'text-neon-blue'} />
                        </div>
                        <div>
                            <h4 className="font-bold text-xs text-white">{issue.name}</h4>
                            <span className={`text-[8px] font-bold px-1 py-0.5 rounded border uppercase ${issue.status === 'DANGEROUS' ? 'text-neon-purple border-neon-purple' : 'text-neon-blue border-neon-blue'}`}>
                                {issue.status}
                            </span>
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 border-l border-gray-700 pl-2 py-1 leading-relaxed">
                        {issue.detail}
                    </p>
                </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AntiSpy;
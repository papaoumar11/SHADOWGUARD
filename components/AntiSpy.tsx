import React, { useState } from 'react';
import { Shield, Search, AlertTriangle, CheckCircle, Bug, Terminal, Ban, Wifi, Globe, Activity } from 'lucide-react';
import { analyzeAppsWithGemini } from '../services/geminiService';
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

  const startAppScan = async () => {
    setScanType('APPS');
    setScanning(true);
    setAppResults(null);
    setNetworkResults(null);
    setBlockedApps([]);
    
    // Create a minimum delay for the scanning animation effect (UX)
    const delayPromise = new Promise(resolve => setTimeout(resolve, 2500));
    
    // Fetch analysis from Gemini service
    const analysisPromise = analyzeAppsWithGemini();

    try {
      // Wait for both the delay and the analysis to complete
      const [_, data] = await Promise.all([delayPromise, analysisPromise]);
      setAppResults(data);

      // Automatically log security events for threats found
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
      console.error("Scan failed", error);
    } finally {
      setScanning(false);
    }
  };

  const startNetworkScan = async () => {
    setScanType('NETWORK');
    setScanning(true);
    setAppResults(null);
    setNetworkResults(null);

    // Simulate Network Analysis Delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Mock Network Findings
    const mockNetworkIssues: NetworkIssue[] = [
        {
            id: 'net-1',
            name: 'Port 8080 Open',
            detail: 'Unencrypted HTTP traffic detected on local interface.',
            severity: 'MEDIUM',
            status: 'WARNING'
        },
        {
            id: 'net-2',
            name: 'Suspicious DNS',
            detail: 'Requests routed to known ad-tracking server (104.23.xx.xx).',
            severity: 'LOW',
            status: 'WARNING'
        },
        {
            id: 'net-3',
            name: 'Man-in-the-Middle',
            detail: 'SSL Certificate mismatch for secure connection.',
            severity: 'HIGH',
            status: 'DANGEROUS'
        },
        {
            id: 'net-4',
            name: 'Public Wi-Fi',
            detail: 'Current network has no encryption (Open).',
            severity: 'HIGH',
            status: 'DANGEROUS'
        }
    ];

    setNetworkResults(mockNetworkIssues);

    // Log Event
    onLogEvent({
        type: 'NETWORK',
        severity: 'HIGH',
        message: 'Analyse Réseau: 4 anomalies détectées dont trafic non chiffré.',
        timestamp: new Date()
    });

    setScanning(false);
  };

  const handleBlockApp = (app: SuspiciousApp) => {
    setBlockedApps(prev => [...prev, app.packageName]);
    
    onLogEvent({
      type: 'SYSTEM',
      severity: 'HIGH',
      message: `Application bloquée par l'utilisateur: ${app.name}`,
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
        <h2 className="text-2xl font-bold text-white mb-1">Anti-Espionnage IA</h2>
        <p className="text-gray-400 text-sm">Détection avancée des menaces</p>
      </div>

      {!scanning && !appResults && !networkResults && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-700">
          
          <div className="w-40 h-40 bg-dark-card rounded-full flex items-center justify-center border border-gray-800 shadow-[0_0_30px_rgba(0,0,0,0.5)] mb-8 relative">
             <Shield size={64} className="text-gray-500" />
             <div className="absolute inset-0 border-2 border-neon-blue/20 rounded-full animate-pulse-fast"></div>
          </div>
          
          <div className="bg-dark-card/50 p-4 rounded-xl border border-gray-800 mb-8 max-w-xs text-center backdrop-blur-sm">
            <p className="text-sm text-gray-300">
              Sélectionnez un module d'analyse pour détecter les spywares ou les intrusions réseau.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <button 
                onClick={startAppScan}
                className="flex flex-col items-center justify-center gap-3 p-6 bg-dark-card border border-gray-700 hover:border-neon-blue hover:bg-dark-surface rounded-xl transition-all group"
            >
                <div className="p-3 bg-neon-blue/10 rounded-full group-hover:scale-110 transition">
                    <Terminal size={24} className="text-neon-blue" />
                </div>
                <span className="font-bold text-sm text-white">SCAN APPS</span>
            </button>

            <button 
                onClick={startNetworkScan}
                className="flex flex-col items-center justify-center gap-3 p-6 bg-dark-card border border-gray-700 hover:border-neon-purple hover:bg-dark-surface rounded-xl transition-all group"
            >
                <div className="p-3 bg-neon-purple/10 rounded-full group-hover:scale-110 transition">
                    <Wifi size={24} className="text-neon-purple" />
                </div>
                <span className="font-bold text-sm text-white">SCAN RÉSEAU</span>
            </button>
          </div>
        </div>
      )}

      {scanning && (
        <div className="flex-1 flex flex-col items-center justify-center">
           <div className="relative w-48 h-48">
             {/* Static Rings */}
             <div className="absolute inset-0 border-4 border-gray-800 rounded-full opacity-30"></div>
             
             {/* Spinning Rings */}
             <div className="absolute inset-0 border-4 border-t-transparent border-r-transparent border-b-transparent rounded-full animate-spin" 
                  style={{ borderColor: scanType === 'APPS' ? '#00f3ff' : '#bc13fe', borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent' }}></div>
             
             <div className="absolute inset-0 flex items-center justify-center">
               {scanType === 'APPS' ? (
                   <Search size={48} className="text-neon-blue animate-pulse" />
               ) : (
                   <Activity size={48} className="text-neon-purple animate-pulse" />
               )}
             </div>
           </div>
           
           <div className="mt-8 space-y-2 text-center">
             <p className={`font-mono text-lg animate-pulse tracking-widest ${scanType === 'APPS' ? 'text-neon-blue' : 'text-neon-purple'}`}>
                {scanType === 'APPS' ? 'ANALYSE EN COURS...' : 'ANALYSE DU TRAFIC...'}
             </p>
             <div className="flex flex-col items-center text-xs text-gray-500 font-mono h-12">
                {scanType === 'APPS' ? (
                    <>
                        <span className="animate-bounce delay-75">Vérification des signatures numériques...</span>
                        <span className="animate-bounce delay-150">Analyse heuristique des permissions...</span>
                    </>
                ) : (
                    <>
                        <span className="animate-bounce delay-75">Sniffing des paquets locaux (Port 80/443)...</span>
                        <span className="animate-bounce delay-150">Vérification des serveurs DNS...</span>
                    </>
                )}
             </div>
           </div>
        </div>
      )}

      {(appResults || networkResults) && (
        <div className="flex-1 overflow-y-auto space-y-4 animate-in slide-in-from-bottom-10 fade-in duration-500">
          <div className="flex items-center justify-between sticky top-0 bg-dark-bg/95 backdrop-blur py-2 z-10 border-b border-gray-800">
            <h3 className="font-bold text-lg flex items-center gap-2">
              {scanType === 'APPS' ? <Shield size={18} className="text-neon-green" /> : <Globe size={18} className="text-neon-purple" />}
              Résultats ({appResults ? appResults.length : networkResults?.length})
            </h3>
            <button onClick={resetView} className="text-xs text-gray-400 hover:text-white transition underline decoration-dotted">Fermer</button>
          </div>

          <div className="grid gap-4">
            {/* APP RESULTS */}
            {appResults?.map((app, idx) => {
              const isBlocked = blockedApps.includes(app.packageName);
              
              return (
                <div 
                  key={idx} 
                  className={`p-4 rounded-xl border relative overflow-hidden group transition-all hover:scale-[1.01] bg-dark-card ${
                    isBlocked 
                      ? 'border-gray-800 bg-black opacity-60' 
                      : app.status === 'DANGEROUS' 
                        ? 'border-neon-red/50 bg-gradient-to-br from-neon-red/10 to-transparent hover:border-neon-red' 
                        : app.status === 'WARNING' 
                          ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-transparent hover:border-yellow-500' 
                          : 'border-green-500/50 bg-gradient-to-br from-green-500/10 to-transparent hover:border-green-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        isBlocked ? 'bg-gray-800' : app.status === 'DANGEROUS' ? 'bg-neon-red/20' : app.status === 'WARNING' ? 'bg-yellow-500/20' : 'bg-green-500/20'
                      }`}>
                        {isBlocked ? <Ban size={20} className="text-gray-400" /> :
                         app.status === 'DANGEROUS' ? <Bug size={20} className="text-neon-red" /> : 
                         app.status === 'WARNING' ? <AlertTriangle size={20} className="text-yellow-500" /> : 
                         <CheckCircle size={20} className="text-green-500" />}
                      </div>
                      <div>
                        <span className={`font-bold block text-sm ${isBlocked ? 'text-gray-400 line-through' : 'text-white'}`}>{app.name}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{app.packageName}</span>
                      </div>
                    </div>
                    
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                      isBlocked ? 'bg-gray-800 text-gray-400 border-gray-700' :
                      app.status === 'DANGEROUS' ? 'bg-neon-red/20 text-neon-red border-neon-red' : 
                      app.status === 'WARNING' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500' : 
                      'bg-green-500/20 text-green-500 border-green-500'
                    }`}>
                      {isBlocked ? 'BLOQUÉ' : `RISQUE: ${app.riskScore}%`}
                    </span>
                  </div>
                  
                  <div className="relative z-10">
                    <p className={`text-xs mb-3 pl-1 border-l-2 ml-1 py-1 ${isBlocked ? 'text-gray-600 border-gray-800' : 'text-gray-300 border-gray-700'}`}>
                      {app.reason}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                          {app.permissions.map(p => (
                            <span key={p} className={`text-[9px] font-mono border px-2 py-1 rounded uppercase tracking-wide ${isBlocked ? 'bg-transparent border-gray-800 text-gray-600' : 'bg-dark-surface border-gray-700 text-gray-400'}`}>
                              {p}
                            </span>
                          ))}
                      </div>

                      {(app.status === 'DANGEROUS' || app.status === 'WARNING') && (
                        <button 
                          onClick={() => handleBlockApp(app)}
                          disabled={isBlocked}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold text-[10px] border transition ${
                            isBlocked 
                              ? 'bg-transparent border-red-900/30 text-red-900 cursor-not-allowed'
                              : 'bg-neon-red/10 border-neon-red/50 text-neon-red hover:bg-neon-red hover:text-black'
                          }`}
                        >
                          <Ban size={12} />
                          {isBlocked ? 'ACCÈS RESTREINT' : 'BLOQUER'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* NETWORK RESULTS */}
            {networkResults?.map((issue) => (
                <div 
                  key={issue.id} 
                  className={`p-4 rounded-xl border relative overflow-hidden bg-dark-card ${
                    issue.severity === 'HIGH' 
                        ? 'border-neon-red/50 bg-gradient-to-br from-neon-red/10 to-transparent' 
                        : issue.severity === 'MEDIUM' 
                          ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-transparent' 
                          : 'border-green-500/50'
                  }`}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${
                            issue.severity === 'HIGH' ? 'bg-neon-red/20' : issue.severity === 'MEDIUM' ? 'bg-yellow-500/20' : 'bg-green-500/20'
                        }`}>
                            <Wifi size={20} className={
                                issue.severity === 'HIGH' ? 'text-neon-red' : issue.severity === 'MEDIUM' ? 'text-yellow-500' : 'text-green-500'
                            } />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-white">{issue.name}</h4>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                issue.severity === 'HIGH' ? 'text-neon-red border-neon-red bg-neon-red/10' :
                                issue.severity === 'MEDIUM' ? 'text-yellow-500 border-yellow-500 bg-yellow-500/10' :
                                'text-green-500 border-green-500 bg-green-500/10'
                            }`}>
                                {issue.status}
                            </span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-300 pl-1 border-l-2 border-gray-700 ml-1 py-1">
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
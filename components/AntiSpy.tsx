import React, { useState } from 'react';
import { Shield, Search, AlertTriangle, CheckCircle, Bug, Terminal, Ban } from 'lucide-react';
import { analyzeAppsWithGemini } from '../services/geminiService';
import { SuspiciousApp, SecurityEvent } from '../types';

interface AntiSpyProps {
  onLogEvent: (event: Omit<SecurityEvent, 'id'>) => void;
}

const AntiSpy: React.FC<AntiSpyProps> = ({ onLogEvent }) => {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<SuspiciousApp[] | null>(null);
  const [blockedApps, setBlockedApps] = useState<string[]>([]);

  const startScan = async () => {
    setScanning(true);
    setResults(null);
    setBlockedApps([]);
    
    // Create a minimum delay for the scanning animation effect (UX)
    const delayPromise = new Promise(resolve => setTimeout(resolve, 2500));
    
    // Fetch analysis from Gemini service
    const analysisPromise = analyzeAppsWithGemini();

    try {
      // Wait for both the delay and the analysis to complete
      const [_, data] = await Promise.all([delayPromise, analysisPromise]);
      setResults(data);

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

  const handleBlockApp = (app: SuspiciousApp) => {
    setBlockedApps(prev => [...prev, app.packageName]);
    
    onLogEvent({
      type: 'SYSTEM',
      severity: 'HIGH',
      message: `Application bloquée par l'utilisateur: ${app.name}`,
      timestamp: new Date()
    });
  };

  return (
    <div className="p-6 space-y-6 pb-24 h-full flex flex-col">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-1">Anti-Espionnage IA</h2>
        <p className="text-gray-400 text-sm">Détection avancée des menaces et malwares</p>
      </div>

      {!scanning && !results && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-700">
          <div className="w-40 h-40 bg-dark-card rounded-full flex items-center justify-center border border-gray-800 shadow-[0_0_30px_rgba(0,0,0,0.5)] mb-8 relative group cursor-pointer" onClick={startScan}>
             <Shield size={64} className="text-gray-500 group-hover:text-neon-blue transition-colors duration-500" />
             
             {/* Idle Pulse Effect */}
             <div className="absolute inset-0 border-2 border-neon-blue/20 rounded-full animate-pulse-fast"></div>
             <div className="absolute inset-0 border border-neon-blue/10 rounded-full transform scale-125 opacity-30"></div>
          </div>
          
          <div className="bg-dark-card/50 p-4 rounded-xl border border-gray-800 mb-8 max-w-xs text-center backdrop-blur-sm">
            <p className="text-sm text-gray-300">
              L'IA Gemini va analyser les signatures des applications et les permissions critiques (Caméra, Micro, Localisation).
            </p>
          </div>

          <button 
            onClick={startScan}
            className="px-8 py-3 bg-neon-blue text-black font-bold rounded-full shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:bg-white hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-2"
          >
            <Terminal size={18} />
            LANCER L'ANALYSE
          </button>
        </div>
      )}

      {scanning && (
        <div className="flex-1 flex flex-col items-center justify-center">
           <div className="relative w-48 h-48">
             {/* Static Rings */}
             <div className="absolute inset-0 border-4 border-gray-800 rounded-full opacity-30"></div>
             
             {/* Spinning Rings */}
             <div className="absolute inset-0 border-4 border-t-neon-blue border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
             <div className="absolute inset-2 border-2 border-t-transparent border-r-neon-purple border-b-transparent border-l-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
             
             <div className="absolute inset-0 flex items-center justify-center">
               <Search size={48} className="text-neon-blue animate-pulse" />
             </div>
           </div>
           
           <div className="mt-8 space-y-2 text-center">
             <p className="text-neon-blue font-mono text-lg animate-pulse tracking-widest">ANALYSE EN COURS...</p>
             <div className="flex flex-col items-center text-xs text-gray-500 font-mono h-12">
                <span className="animate-bounce delay-75">Vérification des signatures numériques...</span>
                <span className="animate-bounce delay-150">Analyse heuristique des permissions...</span>
             </div>
           </div>
        </div>
      )}

      {results && (
        <div className="flex-1 overflow-y-auto space-y-4 animate-in slide-in-from-bottom-10 fade-in duration-500">
          <div className="flex items-center justify-between sticky top-0 bg-dark-bg/95 backdrop-blur py-2 z-10 border-b border-gray-800">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Shield size={18} className="text-neon-green" />
              Résultats ({results.length})
            </h3>
            <button onClick={startScan} className="text-xs text-neon-blue hover:text-white transition underline decoration-dotted">Relancer</button>
          </div>

          <div className="grid gap-4">
            {results.map((app, idx) => {
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

                      {/* BLOCK BUTTON */}
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

                  {/* Background Pattern for high risk */}
                  {app.status === 'DANGEROUS' && !isBlocked && (
                    <div className="absolute -right-4 -bottom-4 opacity-10 transform rotate-12">
                      <Bug size={80} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AntiSpy;
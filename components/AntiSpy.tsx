import React, { useState } from 'react';
import { Shield, Search, AlertTriangle, CheckCircle, Bug, Terminal } from 'lucide-react';
import { analyzeAppsWithGemini } from '../services/geminiService';
import { SuspiciousApp } from '../types';

const AntiSpy: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<SuspiciousApp[] | null>(null);

  const startScan = async () => {
    setScanning(true);
    setResults(null);
    
    // Create a minimum delay for the scanning animation effect (UX)
    const delayPromise = new Promise(resolve => setTimeout(resolve, 2500));
    
    // Fetch analysis from Gemini service
    const analysisPromise = analyzeAppsWithGemini();

    try {
      // Wait for both the delay and the analysis to complete
      const [_, data] = await Promise.all([delayPromise, analysisPromise]);
      setResults(data);
    } catch (error) {
      console.error("Scan failed", error);
    } finally {
      setScanning(false);
    }
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
            {results.map((app, idx) => (
              <div 
                key={idx} 
                className={`p-4 rounded-xl border relative overflow-hidden group transition-all hover:scale-[1.01] bg-dark-card ${
                  app.status === 'DANGEROUS' 
                    ? 'border-neon-red/50 bg-gradient-to-br from-neon-red/10 to-transparent hover:border-neon-red' 
                    : app.status === 'WARNING' 
                      ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-transparent hover:border-yellow-500' 
                      : 'border-green-500/50 bg-gradient-to-br from-green-500/10 to-transparent hover:border-green-500'
                }`}
              >
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                       app.status === 'DANGEROUS' ? 'bg-neon-red/20' : app.status === 'WARNING' ? 'bg-yellow-500/20' : 'bg-green-500/20'
                    }`}>
                      {app.status === 'DANGEROUS' ? <Bug size={20} className="text-neon-red" /> : 
                       app.status === 'WARNING' ? <AlertTriangle size={20} className="text-yellow-500" /> : 
                       <CheckCircle size={20} className="text-green-500" />}
                    </div>
                    <div>
                      <span className="font-bold block text-sm">{app.name}</span>
                      <span className="text-[10px] text-gray-500 font-mono">{app.packageName}</span>
                    </div>
                  </div>
                  
                  <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                    app.status === 'DANGEROUS' ? 'bg-neon-red/20 text-neon-red border-neon-red' : 
                    app.status === 'WARNING' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500' : 
                    'bg-green-500/20 text-green-500 border-green-500'
                  }`}>
                    RISQUE: {app.riskScore}%
                  </span>
                </div>
                
                <div className="relative z-10">
                  <p className="text-xs text-gray-300 mb-3 pl-1 border-l-2 border-gray-700 ml-1 py-1">
                    {app.reason}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {app.permissions.map(p => (
                      <span key={p} className="text-[9px] font-mono bg-dark-surface border border-gray-700 px-2 py-1 rounded text-gray-400 uppercase tracking-wide">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Background Pattern for high risk */}
                {app.status === 'DANGEROUS' && (
                  <div className="absolute -right-4 -bottom-4 opacity-10 transform rotate-12">
                    <Bug size={80} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AntiSpy;
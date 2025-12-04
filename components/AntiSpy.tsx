import React, { useState } from 'react';
import { Shield, Search, AlertTriangle, CheckCircle, Bug } from 'lucide-react';
import { analyzeAppsWithGemini } from '../services/geminiService';
import { SuspiciousApp } from '../types';

const AntiSpy: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<SuspiciousApp[] | null>(null);

  const startScan = async () => {
    setScanning(true);
    setResults(null);
    // Simulate scan delay for UX
    setTimeout(async () => {
      const data = await analyzeAppsWithGemini();
      setResults(data);
      setScanning(false);
    }, 2000);
  };

  return (
    <div className="p-6 space-y-6 pb-24 h-full flex flex-col">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-1">Anti-Espionnage IA</h2>
        <p className="text-gray-400 text-sm">Détection avancée des menaces et malwares</p>
      </div>

      {!scanning && !results && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-32 h-32 bg-dark-card rounded-full flex items-center justify-center border border-gray-800 shadow-lg mb-6 relative">
             <Shield size={64} className="text-gray-600" />
             <div className="absolute inset-0 border-2 border-neon-blue/30 rounded-full animate-pulse"></div>
          </div>
          <p className="text-center text-gray-400 mb-8 max-w-xs">
            L'intelligence artificielle va analyser vos applications et permissions pour détecter les logiciels espions.
          </p>
          <button 
            onClick={startScan}
            className="px-8 py-3 bg-neon-blue text-black font-bold rounded-full shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:bg-white transition-colors"
          >
            LANCER L'ANALYSE
          </button>
        </div>
      )}

      {scanning && (
        <div className="flex-1 flex flex-col items-center justify-center">
           <div className="relative w-40 h-40">
             <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
             <div className="absolute inset-0 border-4 border-t-neon-blue border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center">
               <Search size={40} className="text-neon-blue animate-pulse" />
             </div>
           </div>
           <p className="mt-6 text-neon-blue font-mono animate-pulse">ANALYSE EN COURS...</p>
           <p className="text-xs text-gray-500 mt-2">Vérification des signatures...</p>
        </div>
      )}

      {results && (
        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Résultats de l'analyse</h3>
            <button onClick={startScan} className="text-xs text-neon-blue hover:underline">Relancer</button>
          </div>

          {results.map((app, idx) => (
            <div key={idx} className={`p-4 rounded-xl border ${app.status === 'DANGEROUS' ? 'border-neon-red/50 bg-neon-red/10' : app.status === 'WARNING' ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-green-500/50 bg-green-500/10'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {app.status === 'DANGEROUS' ? <Bug size={18} className="text-neon-red" /> : <Shield size={18} className={app.status === 'SAFE' ? 'text-green-500' : 'text-yellow-500'} />}
                  <span className="font-bold">{app.name}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${app.status === 'DANGEROUS' ? 'bg-neon-red text-black' : app.status === 'WARNING' ? 'bg-yellow-500 text-black' : 'bg-green-500 text-black'}`}>
                  {app.riskScore}% RISQUE
                </span>
              </div>
              <p className="text-sm text-gray-300 mb-2">{app.reason}</p>
              <div className="flex flex-wrap gap-1">
                {app.permissions.map(p => (
                  <span key={p} className="text-[10px] bg-dark-bg px-2 py-0.5 rounded text-gray-400">{p}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AntiSpy;

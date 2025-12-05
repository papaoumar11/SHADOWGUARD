import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { FileText, Download, PhoneIncoming, MapPin, Clock } from 'lucide-react';
import { SecurityEvent } from '../types';

interface ReportsProps {
  events?: SecurityEvent[];
}

const data = [
  { name: 'Lun', intrusions: 2, blocked: 4 },
  { name: 'Mar', intrusions: 0, blocked: 3 },
  { name: 'Mer', intrusions: 5, blocked: 8 },
  { name: 'Jeu', intrusions: 1, blocked: 2 },
  { name: 'Ven', intrusions: 3, blocked: 5 },
  { name: 'Sam', intrusions: 0, blocked: 1 },
  { name: 'Dim', intrusions: 4, blocked: 6 },
];

const Reports: React.FC<ReportsProps> = ({ events = [] }) => {
  // Filter for Call Trace events
  const callLogs = events.filter(e => e.type === 'CALL_TRACE').slice(0, 5);

  const getTraceInfo = (message: string) => {
    // Expected format: "Appel Intercepté: <Caller> [GPS: <Lat>, <Lng>]"
    const callerMatch = message.match(/Intercepté: (.*?) \[/);
    const gpsMatch = message.match(/GPS: (.*?), (.*?)\]/);
    
    return {
      caller: callerMatch ? callerMatch[1] : "Unknown",
      lat: gpsMatch ? parseFloat(gpsMatch[1]) : null,
      lng: gpsMatch ? parseFloat(gpsMatch[2]) : null
    };
  };

  const getCityFromCoords = (lat: number | null, lng: number | null) => {
    if (!lat || !lng) return "Localisation Inconnue";
    // Mock Geocoding Logic for demo
    if (lat > 48.8 && lat < 48.9 && lng > 2.3 && lng < 2.4) return "Paris, Île-de-France";
    return "Secteur Inconnu (Triangulé)";
  };

  return (
    <div className="p-6 space-y-6 pb-24 h-full overflow-y-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-1">Rapport de Sécurité</h2>
        <p className="text-gray-400 text-sm">Analyses hebdomadaires</p>
      </div>

      {/* Chart 1 */}
      <div className="bg-dark-card p-4 rounded-xl border border-gray-800 shadow-lg">
        <h3 className="font-bold mb-4 text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neon-red"></span>
          Tentatives d'Intrusion
        </h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#121212', borderColor: '#333', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="intrusions" fill="#ff003c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2 */}
      <div className="bg-dark-card p-4 rounded-xl border border-gray-800 shadow-lg">
        <h3 className="font-bold mb-4 text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neon-blue"></span>
          Menaces Bloquées
        </h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#121212', borderColor: '#333', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="blocked" stroke="#00f3ff" strokeWidth={3} dot={{fill: '#00f3ff'}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Call Trace Log Section */}
      <div className="bg-dark-card p-4 rounded-xl border border-gray-800 shadow-lg">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-800">
           <PhoneIncoming size={18} className="text-neon-purple" />
           <h3 className="font-bold text-sm">Historique des Appels Tracés</h3>
        </div>
        
        <div className="space-y-3">
          {callLogs.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4 italic">Aucun appel intercepté récemment.</p>
          ) : (
            callLogs.map(log => {
              const info = getTraceInfo(log.message);
              return (
                <div key={log.id} className="bg-dark-surface/50 rounded-lg p-3 border border-gray-700/50 flex flex-col gap-2 relative overflow-hidden group hover:border-neon-purple/50 transition-colors">
                   <div className="flex justify-between items-start">
                      <span className="font-bold text-white text-sm tracking-wide">{info.caller}</span>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500">
                         <Clock size={10} />
                         <span>{log.timestamp.toLocaleDateString()} {log.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-2 text-xs">
                      <div className="p-1 rounded-full bg-neon-purple/10">
                        <MapPin size={12} className="text-neon-purple" />
                      </div>
                      <span className="text-gray-300 font-mono text-[10px]">
                        {getCityFromCoords(info.lat, info.lng)}
                      </span>
                   </div>
                   
                   {/* Decorative corner */}
                   <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-neon-purple/10 to-transparent rounded-bl-full pointer-events-none"></div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-dark-card to-dark-surface p-6 rounded-xl border border-gray-800 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Score de sécurité</p>
          <p className="text-4xl font-bold text-white">94<span className="text-lg text-gray-500">/100</span></p>
        </div>
        <div className="h-16 w-16 rounded-full border-4 border-neon-green flex items-center justify-center">
          <span className="text-xl">A+</span>
        </div>
      </div>

      <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition border border-white/10">
        <Download size={18} />
        <span>Télécharger PDF Complet</span>
      </button>
    </div>
  );
};

export default Reports;
import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Battery, Wifi, Activity } from 'lucide-react';
import { DeviceStatus, SecurityEvent } from '../types';

interface DashboardProps {
  status: DeviceStatus;
  events: SecurityEvent[];
}

const Dashboard: React.FC<DashboardProps> = ({ status, events }) => {
  const [rotation, setRotation] = useState(0);

  // Rotate the shield slowly
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(r => (r + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6 pb-24">
      {/* Header Status */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tighter text-white">
          SHADOW<span className="text-neon-blue">GUARD</span>
        </h1>
        <p className="text-gray-400 text-sm">Système de Défense Active</p>
      </div>

      {/* Main Status Circle */}
      <div className="flex justify-center py-4">
        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* Animated Rings */}
          <div className={`absolute w-full h-full border-4 rounded-full border-t-neon-blue border-r-transparent border-b-neon-blue border-l-transparent animate-spin`} style={{ animationDuration: '3s' }}></div>
          <div className={`absolute w-40 h-40 border-2 rounded-full border-t-transparent border-r-neon-purple border-b-transparent border-l-neon-purple animate-pulse`}></div>
          
          <div className="z-10 flex flex-col items-center">
            {status.isProtected ? (
              <ShieldCheck size={48} className="text-neon-blue mb-2" />
            ) : (
              <ShieldAlert size={48} className="text-neon-red mb-2 animate-bounce" />
            )}
            <span className={`text-2xl font-bold ${status.isProtected ? 'text-neon-blue' : 'text-neon-red'}`}>
              {status.isProtected ? 'SÉCURISÉ' : 'VULNÉRABLE'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-dark-card p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center shadow-lg backdrop-blur-md bg-opacity-80">
          <Battery className={`mb-2 ${status.batteryLevel < 20 ? 'text-neon-red' : 'text-neon-green'}`} />
          <span className="text-2xl font-bold">{status.batteryLevel}%</span>
          <span className="text-xs text-gray-500">Batterie</span>
        </div>
        <div className="bg-dark-card p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center shadow-lg backdrop-blur-md bg-opacity-80">
          <Wifi className="mb-2 text-neon-blue" />
          <span className="text-2xl font-bold">Sécurisé</span>
          <span className="text-xs text-gray-500">Réseau</span>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-dark-card rounded-xl border border-gray-800 p-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2">
            <Activity size={18} className="text-neon-purple" />
            Journal d'Activité
          </h2>
          <span className="text-xs text-neon-blue cursor-pointer">Voir tout</span>
        </div>
        <div className="space-y-3">
          {events.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">Aucune menace détectée.</p>
          ) : (
            events.slice(0, 3).map(event => (
              <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-dark-bg/50 border border-gray-800/50">
                <div className={`mt-1 w-2 h-2 rounded-full ${event.severity === 'HIGH' || event.severity === 'CRITICAL' ? 'bg-neon-red shadow-[0_0_8px_#ff003c]' : 'bg-neon-blue'}`} />
                <div>
                  <p className="text-sm font-medium text-gray-200">{event.message}</p>
                  <p className="text-xs text-gray-500">{event.timestamp.toLocaleTimeString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

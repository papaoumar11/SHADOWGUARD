import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Battery, Wifi, Activity, Phone, Edit2, Check, Users, User, X, Search, Satellite, Skull, AlertTriangle } from 'lucide-react';
import { DeviceStatus, SecurityEvent } from '../types';

interface DashboardProps {
  status: DeviceStatus;
  events: SecurityEvent[];
  onUpdatePhoneNumber: (number: string) => void;
  onSimulateTamper: () => void;
}

const MOCK_CONTACTS = [
  { name: "Maman", number: "+33 6 01 02 03 04" },
  { name: "Papa", number: "+33 6 99 88 77 66" },
  { name: "Alice (Bureau)", number: "+33 7 55 44 33 22" },
  { name: "Chéri", number: "+33 6 11 22 33 44" },
  { name: "S.O.S Urgence", number: "112" }
];

const Dashboard: React.FC<DashboardProps> = ({ status, events, onUpdatePhoneNumber, onSimulateTamper }) => {
  const [rotation, setRotation] = useState(0);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [tempPhone, setTempPhone] = useState(status.ownerPhoneNumber);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputError, setInputError] = useState(false);

  // Rotate the shield slowly
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(r => (r + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleSavePhone = () => {
    if (!tempPhone.trim()) {
        setInputError(true);
        return;
    }
    setInputError(false);
    onUpdatePhoneNumber(tempPhone);
    setIsEditingPhone(false);
  };

  const handleSelectContact = (number: string) => {
    setTempPhone(number);
    setInputError(false);
    setShowContactPicker(false);
  };

  const openContactPicker = () => {
    setSearchTerm("");
    setShowContactPicker(true);
  };

  const filteredContacts = MOCK_CONTACTS.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    contact.number.includes(searchTerm)
  );

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

      {/* Emergency Contact Configuration */}
      <div className="bg-dark-card p-4 rounded-xl border border-gray-800 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Phone size={18} className="text-neon-green" />
            <span className="font-bold text-sm">Contact d'Urgence</span>
          </div>
          <button 
            type="button"
            onClick={() => isEditingPhone ? handleSavePhone() : setIsEditingPhone(true)}
            className="text-xs text-neon-blue hover:text-white transition"
          >
            {isEditingPhone ? <Check size={16} /> : <Edit2 size={16} />}
          </button>
        </div>
        
        {isEditingPhone ? (
          <div className="flex flex-col gap-1">
            <div className="flex gap-2">
                <input 
                type="tel" 
                value={tempPhone}
                onChange={(e) => {
                    setTempPhone(e.target.value);
                    if(e.target.value.trim()) setInputError(false);
                }}
                className={`flex-1 bg-dark-surface border rounded px-3 py-2 text-white outline-none focus:border-neon-blue ${inputError ? 'border-neon-red' : 'border-gray-700'}`}
                placeholder="+33 6..."
                autoFocus
                />
                <button 
                type="button"
                onClick={openContactPicker}
                className="bg-dark-surface hover:bg-gray-700 text-neon-blue px-3 rounded border border-gray-700 flex items-center justify-center transition"
                title="Choisir un contact"
                >
                <Users size={18} />
                </button>
            </div>
            {inputError && <span className="text-[10px] text-neon-red">Phone number cannot be empty</span>}
          </div>
        ) : (
          <div className="flex justify-between items-center bg-dark-surface p-2 rounded border border-gray-800/50">
             <span className="font-mono text-gray-300">{status.ownerPhoneNumber || "Non configuré"}</span>
             <span className="text-[10px] text-gray-500 uppercase tracking-wider">SMS Alert</span>
          </div>
        )}
        <p className="text-[10px] text-gray-500 mt-2">
          Ce numéro recevra automatiquement un SMS avec la localisation GPS en cas de vol.
        </p>

        {/* Simulated Contact Picker Modal */}
        {showContactPicker && (
          <div className="absolute inset-0 bg-dark-card z-20 flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="flex items-center justify-between p-3 border-b border-gray-800 bg-dark-surface/50">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Users size={14} className="text-neon-blue" />
                Sélectionner
              </span>
              <button type="button" onClick={() => setShowContactPicker(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-2 border-b border-gray-800">
                <div className="relative">
                    <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <input 
                        type="text" 
                        placeholder="Rechercher..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-dark-surface border border-gray-700 rounded-lg pl-8 pr-2 py-1.5 text-xs text-white outline-none focus:border-neon-blue transition"
                        autoFocus
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredContacts.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-xs">Aucun contact trouvé</div>
              ) : (
                  filteredContacts.map((contact, idx) => (
                    <button 
                      type="button"
                      key={idx}
                      onClick={() => handleSelectContact(contact.number)}
                      className="w-full flex items-center gap-3 p-2 rounded hover:bg-dark-surface transition border border-transparent hover:border-gray-800 text-left group"
                    >
                      <div className="w-8 h-8 rounded-full bg-dark-surface flex items-center justify-center text-gray-400 group-hover:text-neon-blue group-hover:bg-neon-blue/10 transition">
                        <User size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-200">{contact.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{contact.number}</p>
                      </div>
                    </button>
                  ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-dark-card p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center shadow-lg backdrop-blur-md bg-opacity-80">
          <Battery className={`mb-2 ${status.batteryLevel < 20 ? 'text-neon-red' : 'text-neon-green'}`} />
          <span className="text-2xl font-bold">{status.batteryLevel}%</span>
          <span className="text-xs text-gray-500">Batterie</span>
        </div>
        
        <div className="bg-dark-card p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center shadow-lg backdrop-blur-md bg-opacity-80 relative overflow-hidden group">
            {/* Active Satellite Background Animation */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                {status.location ? (
                    <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neon-blue to-transparent"></div>
                ) : (
                    <div className="w-[200%] h-[200%] absolute -top-1/2 -left-1/2 bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] animate-spin opacity-20"></div>
                )}
            </div>
            
            {status.location ? (
                <>
                    <div className="relative mb-2">
                        <Satellite size={24} className="text-neon-blue relative z-10" />
                        <div className="absolute inset-0 bg-neon-blue blur-md opacity-50 animate-pulse"></div>
                    </div>
                    <span className="text-xl font-bold text-white tracking-wide">SAT LINKED</span>
                    <span className="text-[10px] text-neon-blue font-mono uppercase tracking-widest">Global Positioning</span>
                </>
            ) : (
                <>
                    <Satellite size={24} className="mb-2 text-gray-500 animate-bounce" />
                    <span className="text-lg font-bold text-gray-400 animate-pulse">ACQUIRING...</span>
                    <span className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">Searching Satellites</span>
                </>
            )}
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
              <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-dark-surface/30 border border-gray-800/50">
                <div className={`mt-1 w-2 h-2 rounded-full ${
                  event.severity === 'CRITICAL' ? 'bg-neon-red shadow-[0_0_8px_#ff003c]' : 
                  event.severity === 'HIGH' ? 'bg-orange-500' : 
                  event.severity === 'MEDIUM' ? 'bg-yellow-500' : 'bg-neon-blue'
                }`} />
                <div>
                  <p className="text-sm font-medium text-gray-200">{event.message}</p>
                  <p className="text-xs text-gray-500">{event.timestamp.toLocaleTimeString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Security Sandbox (Simulate Data Tamper) */}
      <div className="bg-gradient-to-br from-dark-card to-red-950/20 rounded-xl border border-red-900/50 p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-2 text-neon-red">
          <Skull size={18} />
          <h3 className="font-bold text-sm">Zone de Danger (Test)</h3>
        </div>
        <p className="text-[10px] text-gray-400 mb-3">
          Testez la résilience du système face à une altération des données ou une réinitialisation forcée.
        </p>
        <button 
          onClick={onSimulateTamper}
          className="w-full py-2 bg-red-900/20 hover:bg-neon-red hover:text-black text-neon-red text-xs font-bold rounded border border-neon-red/50 transition-all flex items-center justify-center gap-2"
        >
          <AlertTriangle size={14} />
          SIMULER ALTÉRATION DONNÉES
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
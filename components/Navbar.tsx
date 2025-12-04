import React from 'react';
import { Home, Shield, Lock, Smartphone, FileBarChart } from 'lucide-react';
import { AppView } from '../types';

interface NavbarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onChangeView }) => {
  const navItems = [
    { id: AppView.DASHBOARD, icon: Home, label: 'Accueil' },
    { id: AppView.ANTI_THEFT, icon: Lock, label: 'Anti-Vol' },
    { id: AppView.ANTI_SPY, icon: Shield, label: 'Anti-Espion' },
    { id: AppView.REMOTE, icon: Smartphone, label: 'Contrôle' },
    { id: AppView.REPORTS, icon: FileBarChart, label: 'Rapports' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-dark-card/90 backdrop-blur-lg border-t border-gray-800 pb-safe pt-2 px-2 z-50">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`flex flex-col items-center justify-center w-full py-2 transition-all duration-300 ${
              currentView === item.id 
                ? 'text-neon-blue translate-y-[-5px]' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <item.icon 
              size={24} 
              strokeWidth={currentView === item.id ? 2.5 : 2}
              className={`mb-1 transition-all ${currentView === item.id ? 'drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]' : ''}`}
            />
            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            
            {/* Active Indicator Dot */}
            <span className={`absolute bottom-0 w-1 h-1 rounded-full bg-neon-blue transition-all duration-300 ${currentView === item.id ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}></span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Navbar;

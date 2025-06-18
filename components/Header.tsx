import React from 'react';
import { View } from '../App'; // Import View for setCurrentView
import { BellIcon, UtensilsIcon } from '../components/icons';
import { useAppContext } from '../contexts/AppContext';
import { PizzaIcon, ChefHatIcon } from '../components/icons';
import { Bell, Search } from 'lucide-react';

interface HeaderProps {
  setCurrentView: (view: View) => void; // To navigate to settings
}

const Header: React.FC<HeaderProps> = ({ setCurrentView }) => {
  return (
    <header className="bg-gray-800 shadow-lg sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-full"> {/* Ensure header can span full width */}
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <img src="https://picsum.photos/seed/logo/40/40" alt="JáPede Logo" className="h-8 w-8 sm:h-10 sm:w-10 mr-2 sm:mr-3 rounded-full border-2 border-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Já<span className="text-primary">Pede</span> Admin
            </h1>
          </div>
          
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button className="text-gray-300 hover:text-white focus:outline-none relative p-1">
              <BellIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-gray-800 bg-red-500"></span>
            </button>
            <button 
              onClick={() => setCurrentView('settings')} 
              className="text-gray-300 hover:text-white focus:outline-none p-1"
              aria-label="Configurações"
            >
              <UtensilsIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

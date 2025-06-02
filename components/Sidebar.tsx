
import React from 'react';
import { View } from '../App';
import { 
  HomeIcon, 
  BookOpenIcon, // Changed from MenuAlt1Icon
  ShoppingCartIcon, 
  FireIcon, 
  TicketIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  CogIcon 
} from './icons'; 

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const navItems = [
  { view: 'dashboard' as View, label: 'Dashboard', icon: HomeIcon },
  { view: 'menu' as View, label: 'Cardápio', icon: BookOpenIcon }, // Use BookOpenIcon
  { view: 'orders' as View, label: 'Pedidos', icon: ShoppingCartIcon },
  { view: 'kitchen' as View, label: 'Cozinha', icon: FireIcon },
  { view: 'tables' as View, label: 'Mesas', icon: TicketIcon }, 
  { view: 'customers' as View, label: 'Clientes', icon: UserGroupIcon },
  { view: 'financials' as View, label: 'Financeiro', icon: CurrencyDollarIcon },
  { view: 'settings' as View, label: 'Configurações', icon: CogIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const navLinkClass = (view: View) =>
    `flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ease-in-out hover:bg-primary-dark hover:text-white group ${
      currentView === view
        ? 'bg-primary text-white shadow-md'
        : 'text-gray-200 hover:text-white'
    }`;

  return (
    <aside className="w-64 bg-gray-800 text-white p-4 space-y-2 flex-shrink-0 h-screen sticky top-0 overflow-y-auto">
      {/* Optional: Add a logo or branding here if header is minimal */}
      {/* <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold text-white">Já<span className="text-primary">Pede</span></h2>
      </div> */}
      <nav>
        <ul>
          {navItems.map(item => (
            <li key={item.view}>
              <button
                onClick={() => setCurrentView(item.view)}
                className={`${navLinkClass(item.view)} w-full text-left`}
                aria-current={currentView === item.view ? 'page' : undefined}
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;

import React from 'react';
import { View } from '../App';
import { 
  PizzaIcon, 
  MenuIcon, 
  CookingPotIcon, 
  ReceiptIcon, 
  ChefHatIcon, 
  DollarSignIcon, 
  UtensilsIcon 
} from '../components/icons';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const navItems = [
  { view: 'dashboard' as View, label: 'Dashboard', icon: PizzaIcon },
  { view: 'menu' as View, label: 'Cardápio', icon: MenuIcon },
  { view: 'orders' as View, label: 'Pedidos', icon: PizzaIcon },
  { view: 'kitchen' as View, label: 'Cozinha', icon: CookingPotIcon },
  { view: 'tables' as View, label: 'Mesas', icon: ReceiptIcon }, 
  { view: 'customers' as View, label: 'Clientes', icon: ChefHatIcon },
  { view: 'financials' as View, label: 'Financeiro', icon: DollarSignIcon },
  { view: 'settings' as View, label: 'Configurações', icon: UtensilsIcon },
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

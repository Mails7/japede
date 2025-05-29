
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MenuManagementPage from './pages/MenuManagementPage';
import OrderDashboardPage from './pages/OrderDashboardPage';
import DashboardPage from './pages/DashboardPage';
import KitchenDisplayPage from './pages/KitchenDisplayPage';
import TableManagementPage from './pages/TableManagementPage';
import CustomerManagementPage from './pages/CustomerManagementPage';
import FinancialsPage from './pages/FinancialsPage';
import SettingsPage from './pages/SettingsPage';
import CustomerAppLayout from './pages/customer/CustomerAppLayout';
import { useAppContext } from './contexts/AppContext';
import Alert from './components/shared/Alert';
import LoadingSpinner from './components/shared/LoadingSpinner';
import { SettingsProvider } from './contexts/SettingsContext'; // Import SettingsProvider


export type View = 
  | 'dashboard' 
  | 'menu' 
  | 'orders' 
  | 'kitchen' 
  | 'tables' 
  | 'customers' 
  | 'financials' 
  | 'settings';

const App: React.FC = () => {
  const [currentAdminView, setCurrentAdminView] = useState<View>('dashboard');
  const [isCustomerView, setIsCustomerView] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    const customerViewFromUrl = params.get('view') === 'customer';
    console.log(`[App.tsx] Initial isCustomerView state from URL: ${customerViewFromUrl}`);
    return customerViewFromUrl;
  });
  const { alert, setAlert: dismissAlert, isLoading } = useAppContext();

  useEffect(() => {
    const checkView = () => {
      const params = new URLSearchParams(window.location.search);
      const customerViewFromUrl = params.get('view') === 'customer';
      setIsCustomerView(customerViewFromUrl); 
      if (customerViewFromUrl) {
        document.title = 'JáPede - Cardápio Online';
      } else {
        document.title = 'JáPede - Painel de Controle';
      }
      console.log(`[App.tsx] useEffect (popstate/init) - Is Customer View from URL: ${customerViewFromUrl}, Title set.`);
    };

    checkView(); // Initial check on mount

    window.addEventListener('popstate', checkView); // Listen for back/forward navigation

    return () => {
      window.removeEventListener('popstate', checkView);
    };
  }, []); // Empty dependency array: runs once on mount, cleans up on unmount.

  const renderAdminView = () => {
    switch (currentAdminView) {
      case 'dashboard':
        return <DashboardPage />;
      case 'menu':
        return <MenuManagementPage />;
      case 'orders':
        return <OrderDashboardPage />;
      case 'kitchen':
        return <KitchenDisplayPage />;
      case 'tables':
        return <TableManagementPage />;
      case 'customers':
        return <CustomerManagementPage />;
      case 'financials':
        return <FinancialsPage />;
      case 'settings':
        return (
          <SettingsProvider>
            <SettingsPage />
          </SettingsProvider>
        );
      default:
        return <DashboardPage />;
    }
  };

  console.log(`[App.tsx] Rendering: isLoading=${isLoading}, isCustomerView=${isCustomerView}`);

  if (isLoading) {
    console.log('[App.tsx] Showing global loading spinner.');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <LoadingSpinner size="w-16 h-16" color="text-primary" />
        <p className="mt-4 text-lg text-gray-600">Carregando aplicação...</p>
      </div>
    );
  }

  if (isCustomerView) {
    console.log('[App.tsx] Rendering CustomerAppLayout.');
    return (
      <>
        {alert && <Alert message={alert.message} type={alert.type} onClose={() => dismissAlert(null)} duration={5000} />}
        <CustomerAppLayout />
      </>
    );
  }

  console.log('[App.tsx] Rendering Admin Panel.');
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header setCurrentView={setCurrentAdminView} />
      <div className="flex flex-1">
        <Sidebar currentView={currentAdminView} setCurrentView={setCurrentAdminView} />
        <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {alert && <Alert message={alert.message} type={alert.type} onClose={() => dismissAlert(null)} />}
          {renderAdminView()}
        </main>
      </div>
    </div>
  );
};

export default App;

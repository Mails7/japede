
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MenuManagementPage from './pages/MenuManagementPage';
import OrderDashboardPage from './pages/OrderDashboardPage';
import DashboardPage from './pages/DashboardPage';
import KitchenDisplayPage from './pages/KitchenDisplayPage';
import TableManagementPage from './pages/TableManagementPage';
import CustomerManagementPage from './pages/CustomerManagementPage'; // Re-added
import FinancialsPage from './pages/FinancialsPage';
import SettingsPage from './pages/SettingsPage';
import CustomerAppLayout from './pages/customer/CustomerAppLayout';
import { useAppContext } from './contexts/AppContext';
import Alert from './components/shared/Alert';
import LoadingSpinner from './components/shared/LoadingSpinner';
import PrintPage from './pages/PrintPage'; // Added PrintPage import


export type View = 
  | 'dashboard' 
  | 'menu' 
  | 'orders' 
  | 'kitchen' 
  | 'tables' 
  | 'customers' // Re-added
  | 'financials' 
  | 'settings';

const App: React.FC = () => {
  const [currentAdminView, setCurrentAdminView] = useState<View>('dashboard');
  const [isCustomerView, setIsCustomerView] = useState<boolean>(false);
  const [isPrintView, setIsPrintView] = useState<boolean>(false);
  const [printViewProps, setPrintViewProps] = useState<{orderId: string; printType: 'kitchen' | 'order'} | null>(null);


  const { 
    alert, 
    setAlert: dismissAlert, 
    isLoading: isAppContextLoading,
    isLoadingSettings, 
    settings,
    shouldOpenManualOrderModal,
  } = useAppContext();

  useEffect(() => {
    const checkView = () => {
      const params = new URLSearchParams(window.location.search);
      const customerViewFromUrl = params.get('view') === 'customer';
      const printViewFromUrl = params.get('view') === 'print';
      const orderIdFromUrl = params.get('orderId');
      const printTypeFromUrl = params.get('printType') as 'kitchen' | 'order' | null;
      
      setIsCustomerView(customerViewFromUrl);
      setIsPrintView(printViewFromUrl && !!orderIdFromUrl && !!printTypeFromUrl);

      if (printViewFromUrl && orderIdFromUrl && printTypeFromUrl) {
        setPrintViewProps({ orderId: orderIdFromUrl, printType: printTypeFromUrl });
        document.title = `Imprimir Pedido - ${orderIdFromUrl}`;
      } else if (customerViewFromUrl) {
        document.title = 'JáPede - Cardápio Online';
      } else {
        document.title = 'JáPede - Painel de Controle';
      }
      console.log(`[App.tsx] useEffect (popstate/init) - CustomerView: ${customerViewFromUrl}, PrintView: ${isPrintView}`);
    };

    checkView(); 
    window.addEventListener('popstate', checkView); 
    return () => {
      window.removeEventListener('popstate', checkView);
    };
  }, []); 

  useEffect(() => {
    if (shouldOpenManualOrderModal && !isCustomerView && !isPrintView) {
      setCurrentAdminView('orders');
    }
  }, [shouldOpenManualOrderModal, isCustomerView, isPrintView]);


  const renderAdminView = () => {
    switch (currentAdminView) {
      case 'dashboard': return <DashboardPage />;
      case 'menu': return <MenuManagementPage />;
      case 'orders': return <OrderDashboardPage />;
      case 'kitchen': return <KitchenDisplayPage />;
      case 'tables': return <TableManagementPage />;
      case 'customers': return <CustomerManagementPage />; // Re-added
      case 'financials': return <FinancialsPage />;
      case 'settings': return <SettingsPage />; 
      default: return <DashboardPage />;
    }
  };

  console.log(`[App.tsx] Rendering: isCustomerView=${isCustomerView}, isPrintView=${isPrintView}, isLoadingSettings=${isLoadingSettings}, isAppContextLoading=${isAppContextLoading}`);
  
  if (isPrintView && printViewProps) {
    console.log('[App.tsx] Rendering PrintPage.');
    return <PrintPage orderId={printViewProps.orderId} printType={printViewProps.printType} />;
  }
  
  if (isCustomerView) {
    console.log('[App.tsx] Rendering CustomerAppLayout.');
     if (isAppContextLoading || (isLoadingSettings && !settings)) { 
        console.log('[App.tsx] Showing loading spinner for customer view settings/app context.');
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <LoadingSpinner size="w-16 h-16" color="text-primary" />
            <p className="mt-4 text-lg text-gray-600">Carregando informações da loja...</p>
          </div>
        );
    }
    return (
      <>
        {alert && <Alert message={alert.message} type={alert.type} onClose={() => dismissAlert(null)} duration={5000} />}
        <CustomerAppLayout />
      </>
    );
  }

  // Admin View
  console.log('[App.tsx] Rendering Admin Panel.');
  if (isAppContextLoading || (isLoadingSettings && !settings)) { 
    console.log('[App.tsx] Showing global loading spinner for admin app/settings.');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <LoadingSpinner size="w-16 h-16" color="text-primary" />
        <p className="mt-4 text-lg text-gray-600">Carregando painel de controle...</p>
      </div>
    );
  }

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


import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import CustomerMenuPage from './CustomerMenuPage';
import ShoppingCartModal from '../../components/customer/ShoppingCartModal';
import CustomerDetailsForm from '../../components/customer/CustomerDetailsForm';
import OrderConfirmationModal from '../../components/customer/OrderConfirmationModal';
import PizzaCustomizationModal from '../../components/customer/PizzaCustomizationModal';
import { MenuItem, Order } from '../../types';
// FIX: Replaced UserCircleIcon with UserGroupIcon, LoginIcon with KeyIcon, and LogoutIcon with BanIcon as they were not exported from ../../components/icons.
import { ShoppingCartIcon, UserGroupIcon, KeyIcon, BanIcon } from '../../components/icons'; // Added icons
import LoginForm from '../../components/customer/auth/LoginForm'; // Import LoginForm
import RegisterForm from '../../components/customer/auth/RegisterForm'; // Import RegisterForm

type CustomerStep = 'menu' | 'cart' | 'details' | 'confirmation' | 'customizePizza';

const CustomerAppLayout: React.FC = () => {
  console.log('[CustomerAppLayout] Component rendering/mounting...');
  const { 
    cart, 
    placeOrder, 
    setAlert, 
    currentUser, 
    currentProfile, 
    signOut,
    authLoading 
  } = useAppContext();

  const [currentStep, setCurrentStep] = useState<CustomerStep>('menu');
  const [orderPlacedId, setOrderPlacedId] = useState<string | null>(null);
  const [pizzaToCustomize, setPizzaToCustomize] = useState<MenuItem | null>(null);
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [checkoutAfterAuth, setCheckoutAfterAuth] = useState(false);


  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleProceedToDetails = () => {
    if (cart.length === 0) {
      setAlert({ message: 'Seu carrinho está vazio.', type: 'info'});
      return;
    }
    if (!currentUser) {
      setCheckoutAfterAuth(true); 
      setShowLoginModal(true);
      return;
    }
    setCurrentStep('details');
  };

  const handlePlaceOrder = async () => {
    const newOrder: Order | null = await placeOrder();
    if (newOrder && typeof newOrder === 'object' && 'id' in newOrder && newOrder.id) {
      setOrderPlacedId(newOrder.id);
      setCurrentStep('confirmation');
    } 
  };
  
  const resetToMenu = () => {
    setOrderPlacedId(null);
    setCurrentStep('menu');
  };

  const openPizzaCustomizationModal = (pizza: MenuItem) => {
    setPizzaToCustomize(pizza);
    setCurrentStep('customizePizza');
  };

  const closePizzaCustomizationModal = () => {
    setPizzaToCustomize(null);
    setCurrentStep('menu'); 
  };

  const onLoginSuccess = () => {
    setShowLoginModal(false);
    if (checkoutAfterAuth) {
      setCurrentStep('details');
      setCheckoutAfterAuth(false);
    }
  };

  const onRegisterSuccess = () => {
    setShowRegisterModal(false);
    setAlert({message: "Cadastro realizado! Faça login para continuar.", type: "success"});
    setShowLoginModal(true); 
  };


  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-primary text-white shadow-md sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            Já<span className="text-primary-light">Pede</span> Cardápio
          </h1>
          <div className="flex items-center space-x-3">
            {authLoading ? (
                <span className="text-sm text-white/80">Verificando...</span>
            ) : currentUser && currentProfile ? (
              <div className="flex items-center space-x-2">
                <UserGroupIcon className="w-6 h-6 text-white/90"/>
                <span className="text-sm hidden sm:inline">Olá, {currentProfile.full_name?.split(' ')[0] || 'Cliente'}</span>
                <button onClick={signOut} title="Sair" className="p-1 hover:bg-primary-dark rounded-full"><BanIcon className="w-5 h-5"/></button>
              </div>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)} 
                className="flex items-center text-sm py-1 px-2 hover:bg-primary-dark rounded-md transition-colors"
                title="Entrar ou Cadastrar"
              >
                <KeyIcon className="w-5 h-5 mr-1"/>
                Entrar/Cadastrar
              </button>
            )}
            <button
              onClick={() => cart.length > 0 ? setCurrentStep('cart') : setAlert({message: "Carrinho vazio!", type: "info"})}
              className="relative p-2 hover:bg-primary-dark rounded-full transition-colors"
              aria-label={`Ver carrinho com ${totalCartItems} itens`}
            >
              <ShoppingCartIcon className="w-7 h-7" />
              {totalCartItems > 0 && (
                <span className="absolute top-0 right-0 block h-5 w-5 transform -translate-y-1 translate-x-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow">
                  {totalCartItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {(currentStep === 'menu' || currentStep === 'customizePizza') && (
            <CustomerMenuPage onCustomizePizza={openPizzaCustomizationModal} />
        )}
      </main>

      {currentStep === 'cart' && (
        <ShoppingCartModal onClose={() => setCurrentStep('menu')} onCheckout={handleProceedToDetails} />
      )}

      {currentStep === 'details' && (
        <CustomerDetailsForm onClose={() => setCurrentStep('cart')} onSubmit={handlePlaceOrder} />
      )}
      
      {currentStep === 'confirmation' && orderPlacedId && (
        <OrderConfirmationModal orderId={orderPlacedId} onClose={resetToMenu} />
      )}

      {currentStep === 'customizePizza' && pizzaToCustomize && (
        <PizzaCustomizationModal pizzaItem={pizzaToCustomize} onClose={closePizzaCustomizationModal} />
      )}

      {showLoginModal && (
        <LoginForm 
            onClose={() => setShowLoginModal(false)} 
            onSuccess={onLoginSuccess}
            onSwitchToRegister={() => { setShowLoginModal(false); setShowRegisterModal(true); }}
        />
      )}
      {showRegisterModal && (
        <RegisterForm 
            onClose={() => setShowRegisterModal(false)}
            onSuccess={onRegisterSuccess}
            onSwitchToLogin={() => { setShowRegisterModal(false); setShowLoginModal(true); }}
        />
      )}
      
      <footer className="text-center py-6 mt-8 text-sm text-gray-500 border-t border-gray-200">
        <p>&copy; {new Date().getFullYear()} JáPede. Tecnologia para seu delivery.</p>
      </footer>
    </div>
  );
};

export default CustomerAppLayout;

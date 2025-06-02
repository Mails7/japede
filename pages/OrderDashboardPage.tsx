import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import OrderDashboardComponent from '../../components/orders/OrderDashboardComponent';

const OrderDashboardPage: React.FC = () => {
  const { isLoading } = useAppContext();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <OrderDashboardComponent />;
};

export default OrderDashboardPage;

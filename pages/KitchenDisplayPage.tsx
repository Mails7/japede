import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import KitchenDisplayComponent from '../components/kitchen/KitchenDisplayComponent';

const KitchenDisplayPage: React.FC = () => {
  const { isLoading } = useAppContext();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <KitchenDisplayComponent />;
};

export default KitchenDisplayPage;

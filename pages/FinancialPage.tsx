import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import FinanceiroComponent from '../../components/financeiro/FinanceiroComponent';

const FinanceiroPage: React.FC = () => {
  const { isLoading } = useAppContext();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <FinanceiroComponent />;
};

export default FinanceiroPage;

import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import FinalizarPedidoComponent from '../../components/orders/FinalizarPedidoComponent';
import { useParams } from 'react-router-dom';

const FinalizarPedidoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isLoading } = useAppContext();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-800">
          <h2 className="text-lg font-semibold">ID do pedido não fornecido</h2>
          <p>É necessário fornecer um ID de pedido válido para finalização.</p>
        </div>
      </div>
    );
  }

  return <FinalizarPedidoComponent orderId={id} />;
};

export default FinalizarPedidoPage;

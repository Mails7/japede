import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Order, OrderStatus, OrderType, CashRegisterSessionStatus } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowsExpandIcon, XIcon, PlusIcon, RefreshIcon } from 'lucide-react';
import OrderCardComponent from './OrderCard';
import ManualOrderFormModal from '../shared/ManualOrderFormModal';

const OrderDashboardComponent: React.FC = () => {
  const { orders, updateOrderStatus, setAlert, forceCheckOrderTransitions, toggleOrderAutoProgress, activeCashSession } = useAppContext();
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false);
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState(false);
  const [expandedColumnKey, setExpandedColumnKey] = useState<string | null>(null);

  const handleToggleExpandColumn = (key: string) => {
    setExpandedColumnKey(prevKey => (prevKey === key ? null : key));
  };

  const openOrderDetailsModal = (order: Order) => {
    setSelectedOrderForDetails(order);
    setIsOrderDetailsModalOpen(true);
  };

  const closeOrderDetailsModal = () => {
    setSelectedOrderForDetails(null);
    setIsOrderDetailsModalOpen(false);
  };

  const handleUpdateStatus = (id: string, status: OrderStatus, manual: boolean = true) => {
    updateOrderStatus(id, status, manual);
    if (manual) {
      setAlert({ message: `Status do pedido #${id.substring(0, 6)} atualizado para ${status}.`, type: 'info' });
    }
  };

  const handleToggleAutoProgress = (orderId: string) => {
    toggleOrderAutoProgress(orderId);
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setAlert({ message: `Progresso automático ${!order.auto_progress ? 'ativado' : 'desativado'} para o pedido #${orderId.substring(0, 6)}.`, type: 'info' });
    }
  };

  const orderColumnsConfig = [
    { key: OrderStatus.PENDING, title: 'Pendentes', statuses: [OrderStatus.PENDING] },
    { key: OrderStatus.PREPARING, title: 'Em Preparo', statuses: [OrderStatus.PREPARING] },
    { key: 'READY_OUT', title: 'Pronto/Entrega', statuses: [OrderStatus.READY_FOR_PICKUP, OrderStatus.OUT_FOR_DELIVERY] },
    { key: OrderStatus.DELIVERED, title: 'Entregues', statuses: [OrderStatus.DELIVERED] },
    { key: OrderStatus.CANCELLED, title: 'Cancelados', statuses: [OrderStatus.CANCELLED] },
  ];

  return (
    <div className="space-y-6">
      <div className={`flex flex-wrap justify-between items-center gap-4 ${expandedColumnKey ? 'hidden' : ''}`}>
        <h2 className="text-3xl font-semibold text-gray-800">Painel de Pedidos</h2>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => setIsManualOrderModalOpen(true)}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" /> Novo Pedido Manual
          </Button>
          <Button
            onClick={forceCheckOrderTransitions}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
            title="Forçar verificação de transições automáticas"
          >
            <RefreshIcon className="w-5 h-5 mr-2" /> Atualizar Fluxo
          </Button>
        </div>
      </div>

      {orders.length === 0 && !expandedColumnKey && (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-xl">Nenhum pedido encontrado.</p>
          <p className="text-gray-400 mt-2">Novos pedidos aparecerão aqui assim que forem recebidos.</p>
        </div>
      )}

      <div className={`gap-6 ${expandedColumnKey ? 'flex h-full' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'}`}>
        {orderColumnsConfig.map(col => {
          let columnOrders = orders.filter(order => col.statuses.includes(order.status));
          const todayDateString = new Date().toDateString();

          if (col.key === OrderStatus.DELIVERED) {
            columnOrders = columnOrders.filter(order => {
              const orderDateString = new Date(order.order_time).toDateString();
              return orderDateString === todayDateString;
            });
          } else if (col.key === OrderStatus.CANCELLED) {
            columnOrders = columnOrders.filter(order => {
              const orderDateString = new Date(order.order_time).toDateString();
              if (orderDateString !== todayDateString) {
                return false; // Don't show cancelled orders from previous days
              }
              // For today's cancelled orders, only show if cash register is open
              return activeCashSession && activeCashSession.status === CashRegisterSessionStatus.OPEN;
            });
          }

          const columnKey = col.key;
          const isExpanded = expandedColumnKey === columnKey;
          const isAnotherColumnExpanded = expandedColumnKey !== null && !isExpanded;

          return (
            <div
              key={columnKey}
              className={`
                ${isExpanded ? 'flex flex-col flex-1 w-full bg-gray-200 p-4 rounded-lg shadow-xl' :
                isAnotherColumnExpanded ? 'hidden' :
                'bg-gray-100 p-4 rounded-lg shadow-sm flex flex-col'}
              `}
            >
              <h3 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-300 flex items-center justify-between">
                <span className="flex items-center">
                  {col.title} ({columnOrders.length})
                </span>
                <button
                  onClick={() => handleToggleExpandColumn(columnKey)}
                  className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
                  title={isExpanded ? "Recolher coluna" : "Expandir coluna"}
                  aria-label={isExpanded ? "Recolher coluna" : "Expandir coluna"}
                >
                  {isExpanded ? <XIcon className="w-5 h-5" /> : <ArrowsExpandIcon className="w-5 h-5" />}
                </button>
              </h3>
              <div className={`
                ${isExpanded
                  ? 'flex-grow flex flex-row flex-wrap gap-4 p-1 overflow-y-auto overflow-x-auto'
                  : 'h-[60vh] space-y-3 pr-1 overflow-y-auto'
                }
              `}>
                {columnOrders.length > 0 ? (
                  columnOrders.sort((a, b) => new Date(b.order_time).getTime() - new Date(a.order_time).getTime())
                    .map(order => (
                      <div key={order.id} className={`${isExpanded ? 'w-80 flex-shrink-0' : ''}`}>
                        <OrderCardComponent
                          order={order}
                          onOpenDetails={openOrderDetailsModal}
                          onUpdateStatus={handleUpdateStatus}
                          onToggleAutoProgress={handleToggleAutoProgress}
                        />
                      </div>
                    ))
                ) : (
                  <p className="text-gray-500 text-sm italic text-center pt-4">Nenhum pedido aqui.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isOrderDetailsModalOpen && selectedOrderForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Detalhes do Pedido #{selectedOrderForDetails.id.substring(0, 6)}</span>
                <Button variant="ghost" size="icon" onClick={closeOrderDetailsModal}>
                  <XIcon className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Cliente</p>
                    <p className="font-medium">{selectedOrderForDetails.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium">{selectedOrderForDetails.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Data/Hora</p>
                    <p className="font-medium">{new Date(selectedOrderForDetails.order_time).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tipo</p>
                    <p className="font-medium">{selectedOrderForDetails.order_type || OrderType.BALCAO}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Itens do Pedido</h4>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Item</th>
                        <th className="text-center py-2">Qtd</th>
                        <th className="text-right py-2">Preço</th>
                        <th className="text-right py-2">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrderForDetails.items.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">{item.name}</td>
                          <td className="py-2 text-center">{item.quantity}</td>
                          <td className="py-2 text-right">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                          </td>
                          <td className="py-2 text-right">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} className="py-2 text-right font-medium">Total:</td>
                        <td className="py-2 text-right font-medium">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOrderForDetails.total_amount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {selectedOrderForDetails.notes && (
                  <div>
                    <h4 className="font-medium mb-2">Observações</h4>
                    <p className="text-gray-700">{selectedOrderForDetails.notes}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  {selectedOrderForDetails.status === OrderStatus.PENDING && (
                    <Button onClick={() => {
                      handleUpdateStatus(selectedOrderForDetails.id, OrderStatus.PREPARING);
                      closeOrderDetailsModal();
                    }}>
                      Iniciar Preparo
                    </Button>
                  )}
                  {selectedOrderForDetails.status === OrderStatus.PREPARING && (
                    <Button onClick={() => {
                      handleUpdateStatus(selectedOrderForDetails.id, OrderStatus.READY_FOR_PICKUP);
                      closeOrderDetailsModal();
                    }}>
                      Marcar como Pronto
                    </Button>
                  )}
                  {(selectedOrderForDetails.status === OrderStatus.READY_FOR_PICKUP || selectedOrderForDetails.status === OrderStatus.OUT_FOR_DELIVERY) && (
                    <Button onClick={() => {
                      handleUpdateStatus(selectedOrderForDetails.id, OrderStatus.DELIVERED);
                      closeOrderDetailsModal();
                    }}>
                      Finalizar Pedido
                    </Button>
                  )}
                  {selectedOrderForDetails.status !== OrderStatus.CANCELLED && selectedOrderForDetails.status !== OrderStatus.DELIVERED && (
                    <Button variant="destructive" onClick={() => {
                      handleUpdateStatus(selectedOrderForDetails.id, OrderStatus.CANCELLED);
                      closeOrderDetailsModal();
                    }}>
                      Cancelar Pedido
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isManualOrderModalOpen && (
        <ManualOrderFormModal
          isOpen={isManualOrderModalOpen}
          onClose={() => setIsManualOrderModalOpen(false)}
        />
      )}
    </div>
  );
};

export default OrderDashboardComponent;

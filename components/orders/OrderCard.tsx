import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowRight, Clock, DollarSign } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { useNavigate } from 'react-router-dom';

interface OrderCardProps {
  order: Order;
  onOpenDetails: (order: Order) => void;
  onUpdateStatus: (id: string, status: OrderStatus, manual?: boolean) => void;
  onToggleAutoProgress: (orderId: string) => void;
}

const OrderCardComponent: React.FC<OrderCardProps> = ({
  order,
  onOpenDetails,
  onUpdateStatus,
  onToggleAutoProgress
}) => {
  const navigate = useNavigate();
  const { formatCurrency } = useAppContext();
  
  // Determinar cor do card baseado no status
  let statusColor = 'bg-gray-100';
  let statusTextColor = 'text-gray-700';
  
  switch (order.status) {
    case OrderStatus.PENDING:
      statusColor = 'bg-yellow-50 border-yellow-200';
      statusTextColor = 'text-yellow-700';
      break;
    case OrderStatus.PREPARING:
      statusColor = 'bg-blue-50 border-blue-200';
      statusTextColor = 'text-blue-700';
      break;
    case OrderStatus.READY_FOR_PICKUP:
      statusColor = 'bg-green-50 border-green-200';
      statusTextColor = 'text-green-700';
      break;
    case OrderStatus.OUT_FOR_DELIVERY:
      statusColor = 'bg-purple-50 border-purple-200';
      statusTextColor = 'text-purple-700';
      break;
    case OrderStatus.DELIVERED:
      statusColor = 'bg-gray-50 border-gray-200';
      statusTextColor = 'text-gray-700';
      break;
    case OrderStatus.CANCELLED:
      statusColor = 'bg-red-50 border-red-200';
      statusTextColor = 'text-red-700';
      break;
  }

  // Formatar data/hora
  const formatTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Calcular tempo desde o pedido
  const getTimeSinceOrder = () => {
    const orderTime = new Date(order.order_time).getTime();
    const now = new Date().getTime();
    const diffMs = now - orderTime;
    
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  // Determinar próxima ação baseada no status
  const getNextActionButton = () => {
    switch (order.status) {
      case OrderStatus.PENDING:
        return (
          <Button 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              onUpdateStatus(order.id, OrderStatus.PREPARING);
            }}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Iniciar Preparo
          </Button>
        );
      case OrderStatus.PREPARING:
        return (
          <Button 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              onUpdateStatus(order.id, OrderStatus.READY_FOR_PICKUP);
            }}
            className="bg-green-500 hover:bg-green-600"
          >
            Marcar Pronto
          </Button>
        );
      case OrderStatus.READY_FOR_PICKUP:
      case OrderStatus.OUT_FOR_DELIVERY:
        return (
          <Button 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/orders/finalizar/${order.id}`);
            }}
            className="bg-purple-500 hover:bg-purple-600"
          >
            Finalizar
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Card 
      className={`${statusColor} border shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
      onClick={() => onOpenDetails(order)}
    >
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-base flex justify-between items-center">
          <span>#{order.id.substring(0, 6)}</span>
          <span className={`text-xs px-2 py-1 rounded-full ${statusTextColor} bg-opacity-20`}>
            {order.status}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="font-medium truncate" title={order.customer_name}>
              {order.customer_name}
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              {formatTime(order.order_time)}
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            {order.items.length} {order.items.length === 1 ? 'item' : 'itens'} • {getTimeSinceOrder()}
          </div>
          
          <div className="flex justify-between items-center pt-1">
            <div className="flex items-center font-semibold">
              <DollarSign className="h-4 w-4 text-green-600" />
              {formatCurrency(order.total_amount)}
            </div>
            {getNextActionButton()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCardComponent;

import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { CookingPotIcon, PizzaIcon, UsersIcon, DollarSignIcon, MenuIcon } from '../components/icons';
import { BarChart3 } from 'lucide-react';
import { OrderStatus } from '../types';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; colorClass: string }> = ({ title, value, icon, colorClass }) => (
  <div className={`bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4 ${colorClass}`}>
    <div className="p-3 rounded-full bg-white bg-opacity-30">
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-white opacity-90">{title}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
    </div>
  </div>
);


const DashboardPage: React.FC = () => {
  const { orders, menuItems, categories } = useAppContext();

  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING).length;
  const totalRevenueToday = orders
    .filter(o => o.status === OrderStatus.DELIVERED && new Date(o.order_time).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + o.total_amount, 0);
  const activeMenuItems = menuItems.filter(item => item.available).length;
  
  // More complex stats can be added here

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-gray-800">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Pedidos Pendentes" 
          value={pendingOrders} 
          icon={<CookingPotIcon className="w-8 h-8 text-white"/>} 
          colorClass="bg-yellow-500"
        />
        <StatCard 
          title="Receita de Hoje (Entregues)" 
          value={`R$ ${totalRevenueToday.toFixed(2)}`}
          icon={<DollarSignIcon className="w-8 h-8 text-white"/>} 
          colorClass="bg-green-500"
        />
        <StatCard 
          title="Itens Ativos no Cardápio" 
          value={activeMenuItems}
          icon={<MenuIcon className="w-8 h-8 text-white"/>} 
          colorClass="bg-blue-500"
        />
        <StatCard 
          title="Total de Pedidos Hoje" 
          value={orders.filter(o => new Date(o.order_time).toDateString() === new Date().toDateString()).length}
          icon={<PizzaIcon className="w-8 h-8 text-white"/>}
          colorClass="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Últimos Pedidos</h2>
          {orders.slice(0, 5).map(order => (
            <div key={order.id} className="border-b last:border-b-0 py-2">
              <div className="flex justify-between items-center">
                <p className="text-gray-700">{order.customer_name} - Pedido #{order.id.substring(0,6)}</p>
                <span className={`px-2 py-1 text-xs font-semibold text-white rounded-full ${
                    order.status === OrderStatus.PENDING ? 'bg-yellow-400' :
                    order.status === OrderStatus.PREPARING ? 'bg-blue-400' :
                    order.status === OrderStatus.DELIVERED ? 'bg-green-400' : 'bg-gray-400'
                }`}>{order.status}</span>
              </div>
              <p className="text-sm text-gray-500">Total: R$ {order.total_amount.toFixed(2)}</p>
            </div>
          ))}
          {orders.length === 0 && <p className="text-gray-500 italic">Nenhum pedido recente.</p>}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Visão Geral do Cardápio</h2>
          <p className="text-gray-600">Total de Categorias: <span className="font-semibold">{categories.length}</span></p>
          <p className="text-gray-600">Total de Itens no Cardápio: <span className="font-semibold">{menuItems.length}</span></p>
          <p className="text-gray-600">Itens Indisponíveis: <span className="font-semibold">{menuItems.filter(item => !item.available).length}</span></p>
           {/* Placeholder for a chart */}
          <div className="mt-4 h-48 bg-gray-100 rounded flex items-center justify-center">
            <BarChart3 className="w-16 h-16 text-gray-400"/>
            <p className="text-gray-500 ml-2">Gráfico de exemplo em breve</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-lg text-center">
        <img src="https://picsum.photos/seed/welcome-dashboard/200/150" alt="Bem-vindo" className="mx-auto mb-4 rounded-lg opacity-80"/>
        <p className="text-xl text-gray-700">Bem-vindo ao Painel Administrativo JáPede!</p>
        <p className="text-gray-500 mt-1">Utilize a barra lateral para navegar entre as seções.</p>
      </div>
    </div>
  );
};

export default DashboardPage;

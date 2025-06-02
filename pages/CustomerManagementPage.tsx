
import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { UserGroupIcon, PlusIcon, PencilAltIcon, TrashIcon, EyeIcon, SearchIcon } from '../components/icons';
import { Order } from '../types'; // Assuming Order might be part of customer details

// Mock customer data for placeholder
interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  lastOrderDate?: Date;
  totalOrders: number;
  totalSpent: number;
}

const mockCustomers: Customer[] = [
  { id: 'cust1', name: 'Ana Beatriz Costa', phone: '(11) 98765-4321', email: 'ana.costa@email.com', lastOrderDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), totalOrders: 5, totalSpent: 250.75 },
  { id: 'cust2', name: 'Carlos Eduardo Lima', phone: '(21) 91234-5678', email: 'carlos.lima@email.com', lastOrderDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), totalOrders: 2, totalSpent: 95.50 },
  { id: 'cust3', name: 'Fernanda Alves', phone: '(31) 99999-8888', lastOrderDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), totalOrders: 8, totalSpent: 410.20 },
  { id: 'cust4', name: 'Ricardo Souza', phone: '(41) 98888-7777', email: 'ricardo.souza@email.com', totalOrders: 1, totalSpent: 30.00 },
];


const CustomerManagementPage: React.FC = () => {
  const { orders } = useAppContext(); // Can be used to derive customer data in a real app
  const [searchTerm, setSearchTerm] = useState('');
  
  // In a real app, customers would come from context or API
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <UserGroupIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-semibold text-gray-800">Gerenciamento de Clientes</h1>
        </div>
        <button className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center">
          <PlusIcon className="w-5 h-5 mr-2" /> Novo Cliente
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar cliente por nome, telefone ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
      </div>
      
      {filteredCustomers.length === 0 && !searchTerm && (
         <div className="text-center py-10 bg-white rounded-lg shadow">
            <img src="https://picsum.photos/seed/empty-customers/150/150" alt="Nenhum cliente" className="mx-auto mb-4 rounded-lg opacity-70" />
            <p className="text-gray-500 text-xl">Nenhum cliente cadastrado.</p>
            <p className="text-gray-400 mt-2">Clientes aparecerão aqui após o primeiro pedido ou cadastro manual.</p>
        </div>
      )}
      {filteredCustomers.length === 0 && searchTerm && (
         <div className="text-center py-6 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">Nenhum cliente encontrado para "{searchTerm}".</p>
        </div>
      )}


      <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Pedido</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Pedidos</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Gasto</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{customer.phone}</div>
                  {customer.email && <div className="text-xs text-gray-500">{customer.email}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{customer.totalOrders}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {customer.totalSpent.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button className="text-primary hover:text-primary-dark" title="Ver Detalhes"><EyeIcon className="w-5 h-5"/></button>
                  <button className="text-yellow-500 hover:text-yellow-600" title="Editar"><PencilAltIcon className="w-5 h-5"/></button>
                  <button className="text-red-500 hover:text-red-600" title="Excluir"><TrashIcon className="w-5 h-5"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerManagementPage;

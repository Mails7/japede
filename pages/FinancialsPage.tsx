

import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
// FIX: Replaced PlusCircleIcon with PlusIcon as it was not exported.
// FIX: Replaced MinusSmIcon with MinusCircleIcon as it was not exported.
import { CurrencyDollarIcon, ChartBarIcon, DocumentTextIcon, CheckCircleIcon, XCircleIcon, PlusIcon, MinusCircleIcon, CalendarIcon } from '../components/icons';
import { Order, OrderStatus, PaymentMethod, CashRegisterSession, CashRegisterSessionStatus, AlertInfo, CashAdjustment, CashAdjustmentType } from '../types'; 
import Modal from '../components/shared/Modal';
import Alert from '../components/shared/Alert';
import CashAdjustmentModal from '../components/shared/CashAdjustmentModal'; // Import the new modal


const OpenCashRegisterModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onOpen: (openingBalance: number, notes?: string) => void;
  setAlertProp: (alertInfo: AlertInfo | null) => void; 
}> = ({ isOpen, onClose, onOpen, setAlertProp }) => {
  const [openingBalance, setOpeningBalance] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseFloat(openingBalance);
    if (isNaN(balance) || balance < 0) {
      setAlertProp({ message: "Saldo inicial inválido. Deve ser um número não negativo.", type: "error" }); 
      return;
    }
    onOpen(balance, notes);
    setOpeningBalance('');
    setNotes('');
  };

  if (!isOpen) return null;

  return (
    <Modal title="Abrir Caixa" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="openingBalance" className="block text-sm font-medium text-gray-700">Saldo Inicial (R$)*</label>
          <input
            type="number"
            id="openingBalance"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            step="0.01"
            min="0"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            required
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="openingNotes" className="block text-sm font-medium text-gray-700">Observações de Abertura</label>
          <textarea
            id="openingNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Ex: Fundo de troco, etc."
          />
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm">Cancelar</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-md shadow-sm">Confirmar Abertura</button>
        </div>
      </form>
    </Modal>
  );
};

const CloseCashRegisterModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCloseSession: (closingBalanceInformed: number, notes?: string) => void;
  activeSession: CashRegisterSession | null;
  ordersInSession: Order[];
  adjustmentsInSession: CashAdjustment[]; // Added adjustments
}> = ({ isOpen, onClose, onCloseSession, activeSession, ordersInSession, adjustmentsInSession }) => {
  const [closingBalanceInformed, setClosingBalanceInformed] = useState('');
  const [notes, setNotes] = useState('');

  const { setAlert } = useAppContext();

  const calculatedSalesFromOrders = useMemo(() => {
    return ordersInSession
        .filter(o => o.status === OrderStatus.DELIVERED && (o.payment_method === PaymentMethod.DINHEIRO || o.payment_method === PaymentMethod.PIX))
        .reduce((sum, order) => sum + order.total_amount, 0);
  }, [ordersInSession]);

  const totalAddedAdjustments = useMemo(() => {
    return adjustmentsInSession.filter(adj => adj.type === CashAdjustmentType.ADD).reduce((sum, adj) => sum + adj.amount, 0);
  }, [adjustmentsInSession]);
  
  const totalRemovedAdjustments = useMemo(() => {
    return adjustmentsInSession.filter(adj => adj.type === CashAdjustmentType.REMOVE).reduce((sum, adj) => sum + adj.amount, 0);
  }, [adjustmentsInSession]);

  const expectedInCash = activeSession ? activeSession.opening_balance + calculatedSalesFromOrders + totalAddedAdjustments - totalRemovedAdjustments : 0;
  const difference = closingBalanceInformed ? parseFloat(closingBalanceInformed) - expectedInCash : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseFloat(closingBalanceInformed);
    if (isNaN(balance) || balance < 0) {
      setAlert({ message: "Saldo final informado inválido. Deve ser um número não negativo.", type: 'error' });
      return;
    }
    if (!activeSession) {
        setAlert({ message: "Nenhuma sessão ativa para fechar.", type: 'error'});
        return;
    }
    onCloseSession(balance, notes);
    setClosingBalanceInformed('');
    setNotes('');
  };

  if (!isOpen || !activeSession) return null;

  return (
    <Modal title="Fechar Caixa" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="p-3 bg-gray-50 rounded-md border">
            <p><strong>Caixa Aberto em:</strong> {new Date(activeSession.opened_at).toLocaleString()}</p>
            <p><strong>Saldo Inicial:</strong> <span className="font-semibold text-blue-600">R$ {activeSession.opening_balance.toFixed(2)}</span></p>
        </div>
         <div className="p-3 bg-yellow-50 rounded-md border border-yellow-300">
            <p><strong>Vendas (Dinheiro/PIX):</strong> <span className="font-semibold text-green-600">R$ {calculatedSalesFromOrders.toFixed(2)}</span></p>
            <p><strong>Ajustes de Entrada:</strong> <span className="font-semibold text-green-500">R$ {totalAddedAdjustments.toFixed(2)}</span></p>
            <p><strong>Ajustes de Saída:</strong> <span className="font-semibold text-red-500">R$ {totalRemovedAdjustments.toFixed(2)}</span></p>
            <p><strong>Total Esperado em Caixa:</strong> <span className="font-semibold text-indigo-600">R$ {expectedInCash.toFixed(2)}</span></p>
        </div>
        <div>
          <label htmlFor="closingBalanceInformed" className="block text-sm font-medium text-gray-700">Saldo Contado em Caixa (R$)*</label>
          <input
            type="number"
            id="closingBalanceInformed"
            value={closingBalanceInformed}
            onChange={(e) => setClosingBalanceInformed(e.target.value)}
            step="0.01"
            min="0"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            required
          />
        </div>
        {difference !== undefined && (
             <div className={`p-3 rounded-md border ${difference === 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                <p><strong>Diferença:</strong> 
                    <span className={`font-semibold ${difference === 0 ? 'text-green-700' : 'text-red-700'}`}>
                        R$ {difference.toFixed(2)} {difference > 0 ? "(Sobra)" : difference < 0 ? "(Falta)" : "(Correto)"}
                    </span>
                </p>
            </div>
        )}
        <div>
          <label htmlFor="closingNotes" className="block text-sm font-medium text-gray-700">Observações de Fechamento</label>
          <textarea
            id="closingNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Ex: Diferença devido a troco, etc."
          />
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm">Cancelar</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md shadow-sm">Confirmar Fechamento</button>
        </div>
      </form>
    </Modal>
  );
};


const FinancialsPage: React.FC = () => {
  const { orders, activeCashSession, cashSessions, cashAdjustments, openCashRegister, closeCashRegister, alert: globalAlert, setAlert } = useAppContext();
  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  const today = new Date().toDateString();
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  const calculateTotalSales = (filteredOrders: Order[]) => 
    filteredOrders.reduce((sum, order) => sum + order.total_amount, 0);

  const deliveredOrders = orders.filter(o => o.status === OrderStatus.DELIVERED);
  
  const salesToday = calculateTotalSales(
    deliveredOrders.filter(o => new Date(o.order_time).toDateString() === today)
  );
  const salesThisMonth = calculateTotalSales(
    deliveredOrders.filter(o => new Date(o.order_time).getMonth() === thisMonth && new Date(o.order_time).getFullYear() === thisYear)
  );
  const salesThisYear = calculateTotalSales(
    deliveredOrders.filter(o => new Date(o.order_time).getFullYear() === thisYear)
  );
  const averageTicket = deliveredOrders.length > 0 ? calculateTotalSales(deliveredOrders) / deliveredOrders.length : 0;

  const adjustmentsForActiveSession = useMemo(() => {
    if (!activeCashSession) return [];
    return cashAdjustments.filter(adj => adj.session_id === activeCashSession.id);
  }, [cashAdjustments, activeCashSession]);

  const totalAddedInActiveSession = useMemo(() => 
    adjustmentsForActiveSession.filter(adj => adj.type === CashAdjustmentType.ADD).reduce((sum, adj) => sum + adj.amount, 0),
  [adjustmentsForActiveSession]);

  const totalRemovedInActiveSession = useMemo(() =>
    adjustmentsForActiveSession.filter(adj => adj.type === CashAdjustmentType.REMOVE).reduce((sum, adj) => sum + adj.amount, 0),
  [adjustmentsForActiveSession]);

  const ordersInActiveSession = useMemo(() => {
    if (!activeCashSession) return [];
    return orders.filter(order => order.cash_register_session_id === activeCashSession.id);
  }, [orders, activeCashSession]);

  const salesInActiveSessionFromOrders = useMemo(() => {
    if (!activeCashSession) return 0;
    return ordersInActiveSession
        .filter(o => o.status === OrderStatus.DELIVERED && (o.payment_method === PaymentMethod.DINHEIRO || o.payment_method === PaymentMethod.PIX))
        .reduce((sum, order) => sum + order.total_amount, 0);
  }, [ordersInActiveSession, activeCashSession]);

  const expectedInActiveCash = activeCashSession 
    ? activeCashSession.opening_balance + salesInActiveSessionFromOrders + totalAddedInActiveSession - totalRemovedInActiveSession
    : 0;


  const handleOpenCashRegister = async (openingBalance: number, notes?: string) => {
    await openCashRegister(openingBalance, notes);
    setIsOpeningModalOpen(false);
  };

  const handleCloseCashRegister = async (closingBalanceInformed: number, notes?: string) => {
    if (activeCashSession) {
      await closeCashRegister(activeCashSession.id, closingBalanceInformed, notes);
      setIsClosingModalOpen(false);
    } else {
        setAlert({message: "Nenhuma sessão de caixa ativa para fechar.", type: 'error'});
    }
  };

  return (
    <div className="space-y-8">
      {globalAlert && <Alert message={globalAlert.message} type={globalAlert.type} onClose={() => setAlert(null)} />}
      <div className="flex items-center space-x-2">
        <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
        <h1 className="text-3xl font-semibold text-gray-800">Financeiro e Caixa</h1>
      </div>

      {/* Caixa Section */}
      <section className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 border-b pb-2">Gerenciamento de Caixa</h2>
        {activeCashSession ? (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-green-50 border-l-4 border-green-500 rounded-md">
                <div className="mb-2 sm:mb-0">
                    <p className="text-xl font-semibold text-green-700">Caixa Aberto</p>
                    <p className="text-xs text-gray-600">Aberto em: {new Date(activeCashSession.opened_at).toLocaleString()}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button 
                        onClick={() => setIsAdjustmentModalOpen(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg shadow-sm flex items-center justify-center text-sm"
                    >
                        <PlusIcon className="w-4 h-4 mr-1.5"/> Ajustar Caixa
                    </button>
                    <button 
                        onClick={() => setIsClosingModalOpen(true)}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-3 rounded-lg shadow-sm flex items-center justify-center text-sm"
                    >
                        <MinusCircleIcon className="w-4 h-4 mr-1.5"/> Fechar Caixa
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-gray-100 rounded-md border">
                    <p className="text-gray-600">Saldo Inicial:</p>
                    <p className="text-lg font-semibold text-blue-600">R$ {activeCashSession.opening_balance.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-md border">
                    <p className="text-gray-600">Vendas (Dinheiro/PIX) na Sessão:</p>
                    <p className="text-lg font-semibold text-green-600">R$ {salesInActiveSessionFromOrders.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-md border">
                    <p className="text-gray-600">Ajustes de Entrada (Manual):</p>
                    <p className="text-lg font-semibold text-green-500">R$ {totalAddedInActiveSession.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-md border">
                    <p className="text-gray-600">Ajustes de Saída (Manual):</p>
                    <p className="text-lg font-semibold text-red-500">R$ {totalRemovedInActiveSession.toFixed(2)}</p>
                </div>
            </div>
             <div className="p-3 bg-indigo-50 rounded-md border border-indigo-300 mt-2">
                <p className="text-gray-600 text-sm">Total Esperado em Caixa (Atual):</p>
                <p className="text-xl font-bold text-indigo-700">R$ {expectedInActiveCash.toFixed(2)}</p>
            </div>
            {activeCashSession.notes_opening && <p className="text-xs italic text-gray-500 mt-2">Obs. Abertura: {activeCashSession.notes_opening}</p>}
            
            {adjustmentsForActiveSession.length > 0 && (
              <div className="mt-4">
                <h3 className="text-md font-semibold text-gray-600 mb-1">Ajustes Manuais Nesta Sessão:</h3>
                <ul className="max-h-40 overflow-y-auto space-y-1 text-xs border p-2 rounded-md bg-gray-50">
                  {adjustmentsForActiveSession.map(adj => (
                    <li key={adj.id} className={`p-1.5 rounded flex justify-between items-center ${adj.type === CashAdjustmentType.ADD ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div>
                        <span className={`font-medium ${adj.type === CashAdjustmentType.ADD ? 'text-green-700' : 'text-red-700'}`}>
                          {adj.type === CashAdjustmentType.ADD ? 'ENTRADA' : 'SAÍDA'}: R$ {adj.amount.toFixed(2)}
                        </span>
                        <span className="text-gray-500 block text-xxs">Motivo: {adj.reason}</span>
                      </div>
                      <span className="text-gray-400 text-xxs">{new Date(adj.adjusted_at).toLocaleTimeString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        ) : (
           <div className="flex items-center justify-between p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
                <div>
                    <p className="text-xl font-semibold text-red-700">Caixa Fechado</p>
                    <p className="text-xs text-gray-600">Nenhuma sessão de caixa ativa no momento.</p>
                </div>
                <button 
                    onClick={() => setIsOpeningModalOpen(true)}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm flex items-center"
                >
                   <PlusIcon className="w-5 h-5 mr-2"/> Abrir Caixa
                </button>
            </div>
        )}
      </section>

      <OpenCashRegisterModal 
        isOpen={isOpeningModalOpen}
        onClose={() => setIsOpeningModalOpen(false)}
        onOpen={handleOpenCashRegister}
        setAlertProp={setAlert} 
      />
      <CloseCashRegisterModal
        isOpen={isClosingModalOpen}
        onClose={() => setIsClosingModalOpen(false)}
        onCloseSession={handleCloseCashRegister}
        activeSession={activeCashSession}
        ordersInSession={ordersInActiveSession}
        adjustmentsInSession={adjustmentsForActiveSession} // Pass adjustments
      />
      {activeCashSession && (
        <CashAdjustmentModal
          isOpen={isAdjustmentModalOpen}
          onClose={() => setIsAdjustmentModalOpen(false)}
          activeSessionId={activeCashSession.id}
        />
      )}


      {/* General Financial Stats Section */}
      <section className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Estatísticas Gerais de Vendas (Todos os Pedidos Entregues)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="text-sm font-medium text-gray-500">Vendas Hoje</p>
                <p className="text-2xl font-semibold text-green-600 mt-1">R$ {salesToday.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="text-sm font-medium text-gray-500">Vendas Este Mês</p>
                <p className="text-2xl font-semibold text-green-600 mt-1">R$ {salesThisMonth.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="text-sm font-medium text-gray-500">Vendas Este Ano</p>
                <p className="text-2xl font-semibold text-green-600 mt-1">R$ {salesThisYear.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="text-sm font-medium text-gray-500">Ticket Médio Geral</p>
                <p className="text-2xl font-semibold text-blue-600 mt-1">R$ {averageTicket.toFixed(2)}</p>
            </div>
        </div>
      </section>
      
       {/* Histórico de Caixas */}
      <section className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
          <CalendarIcon className="w-6 h-6 mr-2 text-gray-600"/> Histórico de Caixas
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Abertura</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Fechamento</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Saldo Inicial</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Vendas (Din/PIX)</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Esperado</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Contado Final</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Diferença</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cashSessions.length > 0 ? cashSessions.map(session => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap">{new Date(session.opened_at).toLocaleString()}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{session.closed_at ? new Date(session.closed_at).toLocaleString() : '---'}</td>
                  <td className="px-4 py-2 text-right">R$ {session.opening_balance.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right text-green-600">R$ {session.calculated_sales?.toFixed(2) || '0.00'}</td>
                  <td className="px-4 py-2 text-right text-indigo-600">R$ {session.expected_in_cash?.toFixed(2) || '0.00'}</td>
                  <td className="px-4 py-2 text-right">R$ {session.closing_balance_informed?.toFixed(2) || '---'}</td>
                  <td className={`px-4 py-2 text-right font-semibold ${session.difference === 0 ? 'text-green-700' : session.difference && session.difference > 0 ? 'text-blue-700' : session.difference && session.difference < 0 ? 'text-red-700' : ''}`}>
                    {session.difference?.toFixed(2) || '---'}
                    {session.difference !== undefined && session.difference !== 0 && (
                        <span className="ml-1 text-xs">({session.difference > 0 ? "Sobra" : "Falta"})</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white ${session.status === CashRegisterSessionStatus.OPEN ? 'bg-green-500' : 'bg-gray-500'}`}>
                      {session.status === CashRegisterSessionStatus.OPEN ? 'Aberto' : 'Fechado'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="px-4 py-3 text-center text-gray-500 italic">Nenhuma sessão de caixa registrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {orders.length === 0 && cashSessions.length === 0 && (
         <div className="text-center py-10 bg-white rounded-lg shadow mt-6">
            <img src="https://picsum.photos/seed/empty-financials/150/150" alt="Sem dados financeiros" className="mx-auto mb-4 rounded-lg opacity-70" />
            <p className="text-gray-500 text-xl">Nenhum dado financeiro ou de caixa disponível.</p>
            <p className="text-gray-400 mt-2">Abra um caixa e registre pedidos para ver os dados aqui.</p>
        </div>
      )}
    </div>
  );
};

export default FinancialsPage;
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { CashRegisterSessionStatus, CashAdjustmentType, PaymentMethod } from '../../types';
import { DollarSign, TrendingUp, ArrowDownCircle, ArrowUpCircle, PlusCircle, MinusCircle } from 'lucide-react';

const FinanceiroComponent: React.FC = () => {
  const { 
    activeCashSession, 
    cashSessions, 
    cashAdjustments, 
    openCashRegister, 
    closeCashRegister, 
    addCashAdjustment, 
    orders, 
    setAlert 
  } = useAppContext();

  const [openingBalance, setOpeningBalance] = useState('');
  const [openingNotes, setOpeningNotes] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<CashAdjustmentType>(CashAdjustmentType.ADD);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('resumo');

  // Calcular resumo financeiro
  const calculateFinancialSummary = () => {
    if (!activeCashSession) return { sales: 0, cash: 0, credit: 0, debit: 0, pix: 0 };

    // Filtrar pedidos da sessão atual
    const sessionOrders = orders.filter(order => 
      order.cash_register_session_id === activeCashSession.id
    );

    // Calcular vendas por método de pagamento
    const salesByMethod = sessionOrders.reduce((acc, order) => {
      if (order.payment_method) {
        acc.total += order.total_amount;
        
        switch (order.payment_method) {
          case PaymentMethod.DINHEIRO:
            acc.cash += order.total_amount;
            break;
          case PaymentMethod.CARTAO_CREDITO:
            acc.credit += order.total_amount;
            break;
          case PaymentMethod.CARTAO_DEBITO:
            acc.debit += order.total_amount;
            break;
          case PaymentMethod.PIX:
            acc.pix += order.total_amount;
            break;
        }
      }
      return acc;
    }, { total: 0, cash: 0, credit: 0, debit: 0, pix: 0 });

    // Calcular ajustes de caixa
    const sessionAdjustments = cashAdjustments.filter(adj => 
      adj.session_id === activeCashSession.id
    );

    const adjustmentsTotal = sessionAdjustments.reduce((total, adj) => {
      return total + (adj.type === CashAdjustmentType.ADD ? adj.amount : -adj.amount);
    }, 0);

    // Calcular saldo esperado em caixa
    const expectedCashBalance = activeCashSession.opening_balance + salesByMethod.cash + adjustmentsTotal;

    return {
      sales: salesByMethod.total,
      cash: salesByMethod.cash,
      credit: salesByMethod.credit,
      debit: salesByMethod.debit,
      pix: salesByMethod.pix,
      adjustments: adjustmentsTotal,
      expectedCashBalance
    };
  };

  const summary = calculateFinancialSummary();

  // Abrir caixa
  const handleOpenCashRegister = async () => {
    if (!openingBalance || isNaN(parseFloat(openingBalance)) || parseFloat(openingBalance) < 0) {
      setAlert({ message: 'Informe um valor válido para o saldo inicial', type: 'error' });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await openCashRegister(parseFloat(openingBalance), openingNotes);
      if (result) {
        setAlert({ message: 'Caixa aberto com sucesso!', type: 'success' });
        setOpeningBalance('');
        setOpeningNotes('');
      }
    } catch (error) {
      setAlert({ message: `Erro ao abrir caixa: ${error.message}`, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Fechar caixa
  const handleCloseCashRegister = async () => {
    if (!activeCashSession) {
      setAlert({ message: 'Nenhum caixa aberto para fechar', type: 'error' });
      return;
    }

    if (!closingBalance || isNaN(parseFloat(closingBalance)) || parseFloat(closingBalance) < 0) {
      setAlert({ message: 'Informe um valor válido para o saldo final', type: 'error' });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await closeCashRegister(
        activeCashSession.id, 
        parseFloat(closingBalance), 
        closingNotes
      );
      
      if (result) {
        setAlert({ message: 'Caixa fechado com sucesso!', type: 'success' });
        setClosingBalance('');
        setClosingNotes('');
      }
    } catch (error) {
      setAlert({ message: `Erro ao fechar caixa: ${error.message}`, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Adicionar ajuste (suprimento/sangria)
  const handleAddAdjustment = async () => {
    if (!activeCashSession) {
      setAlert({ message: 'Nenhum caixa aberto para realizar ajustes', type: 'error' });
      return;
    }

    if (!adjustmentAmount || isNaN(parseFloat(adjustmentAmount)) || parseFloat(adjustmentAmount) <= 0) {
      setAlert({ message: 'Informe um valor válido para o ajuste', type: 'error' });
      return;
    }

    if (!adjustmentReason.trim()) {
      setAlert({ message: 'Informe um motivo para o ajuste', type: 'error' });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await addCashAdjustment(
        activeCashSession.id,
        adjustmentType,
        parseFloat(adjustmentAmount),
        adjustmentReason
      );
      
      if (result) {
        setAlert({ 
          message: `${adjustmentType === CashAdjustmentType.ADD ? 'Suprimento' : 'Sangria'} registrado com sucesso!`, 
          type: 'success' 
        });
        setAdjustmentAmount('');
        setAdjustmentReason('');
      }
    } catch (error) {
      setAlert({ message: `Erro ao registrar ajuste: ${error.message}`, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Financeiro</h1>
        {!activeCashSession && (
          <Button 
            onClick={() => setActiveTab('abrir-caixa')}
            className="bg-green-500 hover:bg-green-600"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Abrir Caixa
          </Button>
        )}
        {activeCashSession && activeCashSession.status === CashRegisterSessionStatus.OPEN && (
          <Button 
            onClick={() => setActiveTab('fechar-caixa')}
            className="bg-red-500 hover:bg-red-600"
          >
            <MinusCircle className="mr-2 h-4 w-4" />
            Fechar Caixa
          </Button>
        )}
      </div>

      {/* Status do Caixa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5 text-primary" />
            Status do Caixa
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeCashSession ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-medium">
                    {activeCashSession.status === CashRegisterSessionStatus.OPEN ? (
                      <span className="text-green-600">Aberto</span>
                    ) : (
                      <span className="text-red-600">Fechado</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aberto em</p>
                  <p className="text-lg font-medium">{formatDate(activeCashSession.opened_at.toString())}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Inicial</p>
                  <p className="text-lg font-medium">{formatCurrency(activeCashSession.opening_balance)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Atual Esperado</p>
                  <p className="text-lg font-medium">{formatCurrency(summary.expectedCashBalance)}</p>
                </div>
              </div>
              
              {activeCashSession.status === CashRegisterSessionStatus.OPEN && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  <Card className="bg-blue-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600">Vendas Totais</p>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-blue-700 mt-2">{formatCurrency(summary.sales)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-green-600">Dinheiro</p>
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-700 mt-2">{formatCurrency(summary.cash)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-purple-600">Cartões</p>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                          <rect width="20" height="14" x="2" y="5" rx="2" />
                          <line x1="2" x2="22" y1="10" y2="10" />
                        </svg>
                      </div>
                      <p className="text-2xl font-bold text-purple-700 mt-2">{formatCurrency(summary.credit + summary.debit)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-yellow-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-yellow-600">PIX</p>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600">
                          <path d="M12 2v20M2 12h20" />
                        </svg>
                      </div>
                      <p className="text-2xl font-bold text-yellow-700 mt-2">{formatCurrency(summary.pix)}</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">Nenhum caixa aberto no momento.</p>
              <p className="text-sm text-muted-foreground mt-1">Abra um caixa para começar a registrar transações.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs para operações */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="abrir-caixa" disabled={!!activeCashSession}>Abrir Caixa</TabsTrigger>
          <TabsTrigger value="fechar-caixa" disabled={!activeCashSession || activeCashSession.status !== CashRegisterSessionStatus.OPEN}>Fechar Caixa</TabsTrigger>
          <TabsTrigger value="ajustes" disabled={!activeCashSession || activeCashSession.status !== CashRegisterSessionStatus.OPEN}>Suprimento/Sangria</TabsTrigger>
        </TabsList>
        
        {/* Tab: Resumo */}
        <TabsContent value="resumo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
            </CardHeader>
            <CardContent>
              {activeCashSession ? (
                <div className="space-y-4">
                  <h3 className="font-medium">Vendas</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Pedido</th>
                          <th className="text-left py-2">Cliente</th>
                          <th className="text-left py-2">Hora</th>
                          <th className="text-left py-2">Pagamento</th>
                          <th className="text-right py-2">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders
                          .filter(order => order.cash_register_session_id === activeCashSession.id)
                          .sort((a, b) => new Date(b.order_time).getTime() - new Date(a.order_time).getTime())
                          .map(order => (
                            <tr key={order.id} className="border-b hover:bg-muted/50">
                              <td className="py-2">{order.id.substring(0, 6)}</td>
                              <td className="py-2">{order.customer_name}</td>
                              <td className="py-2">{new Date(order.order_time).toLocaleTimeString()}</td>
                              <td className="py-2">{order.payment_method || '-'}</td>
                              <td className="py-2 text-right">{formatCurrency(order.total_amount)}</td>
                            </tr>
                          ))}
                        {orders.filter(order => order.cash_register_session_id === activeCashSession.id).length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-4 text-center text-muted-foreground">
                              Nenhuma venda registrada nesta sessão de caixa.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <h3 className="font-medium mt-6">Ajustes de Caixa</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Tipo</th>
                          <th className="text-left py-2">Hora</th>
                          <th className="text-left py-2">Motivo</th>
                          <th className="text-right py-2">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cashAdjustments
                          .filter(adj => adj.session_id === activeCashSession.id)
                          .sort((a, b) => new Date(b.adjusted_at).getTime() - new Date(a.adjusted_at).getTime())
                          .map(adjustment => (
                            <tr key={adjustment.id} className="border-b hover:bg-muted/50">
                              <td className="py-2">
                                {adjustment.type === CashAdjustmentType.ADD ? (
                                  <span className="flex items-center text-green-600">
                                    <ArrowUpCircle className="h-4 w-4 mr-1" /> Suprimento
                                  </span>
                                ) : (
                                  <span className="flex items-center text-red-600">
                                    <ArrowDownCircle className="h-4 w-4 mr-1" /> Sangria
                                  </span>
                                )}
                              </td>
                              <td className="py-2">{new Date(adjustment.adjusted_at).toLocaleTimeString()}</td>
                              <td className="py-2">{adjustment.reason}</td>
                              <td className="py-2 text-right">
                                <span className={adjustment.type === CashAdjustmentType.ADD ? 'text-green-600' : 'text-red-600'}>
                                  {adjustment.type === CashAdjustmentType.ADD ? '+' : '-'}
                                  {formatCurrency(adjustment.amount)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        {cashAdjustments.filter(adj => adj.session_id === activeCashSession.id).length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-muted-foreground">
                              Nenhum ajuste de caixa registrado nesta sessão.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">Nenhum caixa aberto no momento.</p>
                  <p className="text-sm text-muted-foreground mt-1">Abra um caixa para visualizar transações.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab: Abrir Caixa */}
        <TabsContent value="abrir-caixa">
          <Card>
            <CardHeader>
              <CardTitle>Abrir Caixa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openingBalance">Saldo Inicial (R$)</Label>
                  <Input
                    id="openingBalance"
                    type="number"
                    step="0.01"
                    min="0"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="openingNotes">Observações (opcional)</Label>
                  <Input
                    id="openingNotes"
                    value={openingNotes}
                    onChange={(e) => setOpeningNotes(e.target.value)}
                    placeholder="Observações sobre a abertura do caixa"
                  />
                </div>
                <Button 
                  onClick={handleOpenCashRegister} 
                  disabled={isProcessing || !openingBalance}
                  className="w-full"
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processando...
                    </div>
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Abrir Caixa
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab: Fechar Caixa */}
        <TabsContent value="fechar-caixa">
          <Card>
            <CardHeader>
              <CardTitle>Fechar Caixa</CardTitle>
            </CardHeader>
            <CardContent>
              {activeCashSession && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Saldo Inicial</p>
                      <p className="text-lg font-medium">{formatCurrency(activeCashSession.opening_balance)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Vendas em Dinheiro</p>
                      <p className="text-lg font-medium">{formatCurrency(summary.cash)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ajustes de Caixa</p>
                      <p className="text-lg font-medium">{formatCurrency(summary.adjustments)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Saldo Esperado</p>
                      <p className="text-lg font-medium">{formatCurrency(summary.expectedCashBalance)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="closingBalance">Saldo Final Informado (R$)</Label>
                    <Input
                      id="closingBalance"
                      type="number"
                      step="0.01"
                      min="0"
                      value={closingBalance}
                      onChange={(e) => setClosingBalance(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  {closingBalance && (
                    <div className="p-3 rounded-md bg-gray-100">
                      <div className="flex justify-between items-center">
                        <span>Diferença:</span>
                        <span className={
                          parseFloat(closingBalance) === summary.expectedCashBalance
                            ? 'text-green-600 font-medium'
                            : parseFloat(closingBalance) > summary.expectedCashBalance
                              ? 'text-blue-600 font-medium'
                              : 'text-red-600 font-medium'
                        }>
                          {formatCurrency(parseFloat(closingBalance) - summary.expectedCashBalance)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="closingNotes">Observações (opcional)</Label>
                    <Input
                      id="closingNotes"
                      value={closingNotes}
                      onChange={(e) => setClosingNotes(e.target.value)}
                      placeholder="Observações sobre o fechamento do caixa"
                    />
                  </div>

                  <Button 
                    onClick={handleCloseCashRegister} 
                    disabled={isProcessing || !closingBalance}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processando...
                      </div>
                    ) : (
                      <>
                        <MinusCircle className="mr-2 h-4 w-4" />
                        Fechar Caixa
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab: Ajustes (Suprimento/Sangria) */}
        <TabsContent value="ajustes">
          <Card>
            <CardHeader>
              <CardTitle>Suprimento / Sangria</CardTitle>
            </CardHeader>
            <CardContent>
              {activeCashSession && activeCashSession.status === CashRegisterSessionStatus.OPEN && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adjustmentType">Tipo de Ajuste</Label>
                    <Select
                      value={adjustmentType}
                      onValueChange={(value) => setAdjustmentType(value as CashAdjustmentType)}
                    >
                      <SelectTrigger id="adjustmentType">
                        <SelectValue placeholder="Selecione o tipo de ajuste" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={CashAdjustmentType.ADD}>Suprimento (Entrada)</SelectItem>
                        <SelectItem value={CashAdjustmentType.REMOVE}>Sangria (Saída)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adjustmentAmount">Valor (R$)</Label>
                    <Input
                      id="adjustmentAmount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adjustmentReason">Motivo</Label>
                    <Input
                      id="adjustmentReason"
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                      placeholder="Motivo do ajuste"
                    />
                  </div>

                  <Button 
                    onClick={handleAddAdjustment} 
                    disabled={isProcessing || !adjustmentAmount || !adjustmentReason}
                    className={`w-full ${adjustmentType === CashAdjustmentType.ADD ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                    {isProcessing ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processando...
                      </div>
                    ) : (
                      <>
                        {adjustmentType === CashAdjustmentType.ADD ? (
                          <>
                            <ArrowUpCircle className="mr-2 h-4 w-4" />
                            Registrar Suprimento
                          </>
                        ) : (
                          <>
                            <ArrowDownCircle className="mr-2 h-4 w-4" />
                            Registrar Sangria
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceiroComponent;

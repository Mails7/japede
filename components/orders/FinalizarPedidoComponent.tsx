import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Order, OrderStatus, PaymentMethod } from '../../types';
import { Button } from '../../src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { ArrowLeft, Check, Printer } from 'lucide-react';
import ImpressaoComandaComponent from '../shared/ImpressaoComandaComponent';
import { useRouter } from 'next/router';

interface FinalizarPedidoProps {
  orderId: string;
}

const FinalizarPedidoComponent: React.FC<FinalizarPedidoProps> = ({ orderId }) => {
  const router = useRouter();
  const { orders, updateOrderStatus, setAlert, fetchOrderWithItems } = useAppContext();
  
  const [pedido, setPedido] = useState<Order | null>(null);
  const [formaPagamento, setFormaPagamento] = useState<PaymentMethod>(PaymentMethod.DINHEIRO);
  const [observacoes, setObservacoes] = useState('');
  const [valorRecebido, setValorRecebido] = useState('');
  const [troco, setTroco] = useState('0.00');
  const [finalizando, setFinalizando] = useState(false);
  const [pedidoFinalizado, setPedidoFinalizado] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Buscar dados do pedido
  useEffect(() => {
    const carregarPedido = async () => {
      setIsLoading(true);
      try {
        const pedidoCarregado = await fetchOrderWithItems(orderId);
        if (pedidoCarregado) {
          setPedido(pedidoCarregado);
          
          // Se o pedido já estiver finalizado
          if (pedidoCarregado.status === OrderStatus.DELIVERED) {
            setPedidoFinalizado(true);
            if (pedidoCarregado.payment_method) {
              setFormaPagamento(pedidoCarregado.payment_method);
            }
            if (pedidoCarregado.notes) {
              setObservacoes(pedidoCarregado.notes);
            }
            if (pedidoCarregado.amount_paid) {
              setValorRecebido(pedidoCarregado.amount_paid.toString());
            }
          }
        } else {
          setAlert({
            message: 'Não foi possível carregar os dados do pedido',
            type: 'error'
          });
        }
      } catch (error) {
        console.error('Erro ao carregar pedido:', error);
        setAlert({
          message: 'Erro ao carregar dados do pedido',
          type: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      carregarPedido();
    }
  }, [orderId, fetchOrderWithItems, setAlert]);

  // Calcular troco quando valor recebido mudar
  useEffect(() => {
    if (valorRecebido && pedido) {
      const troco = parseFloat(valorRecebido) - pedido.total_amount;
      setTroco(troco > 0 ? troco.toFixed(2) : '0.00');
    } else {
      setTroco('0.00');
    }
  }, [valorRecebido, pedido]);

  // Finalizar pedido
  const handleFinalizarPedido = async () => {
    if (!formaPagamento) {
      setAlert({
        message: 'Selecione uma forma de pagamento para continuar',
        type: 'error'
      });
      return;
    }

    setFinalizando(true);
    try {
      // Atualizar status do pedido para "Entregue"
      await updateOrderStatus(orderId, OrderStatus.DELIVERED, true);
      
      // Registrar forma de pagamento e outras informações
      // Nota: Isso já é feito pelo updateOrderStatus no contexto

      setAlert({
        message: 'Pedido finalizado com sucesso',
        type: 'success'
      });
      
      setPedidoFinalizado(true);
      
      // Atualizar o pedido local para refletir o novo status
      const pedidoAtualizado = await fetchOrderWithItems(orderId);
      if (pedidoAtualizado) {
        setPedido(pedidoAtualizado);
      }
      
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      setAlert({
        message: 'Não foi possível finalizar o pedido',
        type: 'error'
      });
    } finally {
      setFinalizando(false);
    }
  };

  // Formatar valor monetário
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  // Preparar dados para impressão da comanda
  const prepararDadosComanda = () => {
    if (!pedido) return null;
    
    return {
      pedido: {
        id: pedido.id,
        valorTotal: pedido.total_amount,
        formaPagamento: formaPagamento,
        observacao: observacoes || pedido.notes,
      },
      itens: pedido.items.map(item => ({
        quantidade: item.quantity,
        nome: item.name,
        preco: item.price,
        observacao: '',
      })),
      cliente: {
        nome: pedido.customer_name,
        telefone: pedido.customer_phone,
      },
      mesa: pedido.table_id ? {
        numero: pedido.table_id
      } : null,
      data: new Date().toISOString(),
    };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-800">
          <h2 className="text-lg font-semibold">Pedido não encontrado</h2>
          <p>O pedido solicitado não foi encontrado.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.push('/orders')}
          >
            Voltar para Pedidos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push('/orders')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Finalizar Pedido #{orderId.substring(0, 6)}</h1>
        </div>
        {pedidoFinalizado && (
          <div className="flex gap-2">
            <ImpressaoComandaComponent pedidoData={prepararDadosComanda()} />
            <Button onClick={() => router.push('/orders')}>
              Voltar para Pedidos
            </Button>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Coluna 1: Resumo do Pedido */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              {pedido.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum item no pedido
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">Item</th>
                          <th className="text-center py-2 px-2">Qtd</th>
                          <th className="text-right py-2 px-2">Valor Unit.</th>
                          <th className="text-right py-2 px-2">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pedido.items.map((item) => (
                          <tr key={item.id} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-2">
                              <div>
                                <p className="font-medium">{item.name}</p>
                              </div>
                            </td>
                            <td className="py-2 px-2 text-center">{item.quantity}</td>
                            <td className="py-2 px-2 text-right">{formatarValor(item.price)}</td>
                            <td className="py-2 px-2 text-right">{formatarValor(item.price * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2">
                          <td colSpan={3} className="py-2 px-2 text-right font-semibold">Total:</td>
                          <td className="py-2 px-2 text-right font-semibold">{formatarValor(pedido.total_amount)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Informações adicionais */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    {pedido.customer_name && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Cliente</h3>
                        <p className="font-medium">{pedido.customer_name}</p>
                        {pedido.customer_phone && <p className="text-sm">{pedido.customer_phone}</p>}
                      </div>
                    )}
                    {pedido.table_id && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Mesa</h3>
                        <p className="font-medium">Mesa {pedido.table_id}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna 2: Finalização */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Finalizar Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              {pedidoFinalizado ? (
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium">Pedido Finalizado</h3>
                  <p className="text-center text-muted-foreground">
                    O pedido foi finalizado com sucesso e registrado no sistema financeiro.
                  </p>
                  <div className="w-full pt-4">
                    <div className="flex justify-between py-2 border-b">
                      <span>Forma de Pagamento:</span>
                      <span className="font-medium">{formaPagamento}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Valor Total:</span>
                      <span className="font-medium">{formatarValor(pedido.total_amount)}</span>
                    </div>
                    {valorRecebido && (
                      <>
                        <div className="flex justify-between py-2 border-b">
                          <span>Valor Recebido:</span>
                          <span className="font-medium">{formatarValor(parseFloat(valorRecebido))}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span>Troco:</span>
                          <span className="font-medium">{formatarValor(parseFloat(troco))}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
                    <Select
                      value={formaPagamento}
                      onValueChange={(value) => setFormaPagamento(value as PaymentMethod)}
                    >
                      <SelectTrigger id="formaPagamento">
                        <SelectValue placeholder="Selecione a forma de pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PaymentMethod.DINHEIRO}>Dinheiro</SelectItem>
                        <SelectItem value={PaymentMethod.CARTAO_DEBITO}>Cartão de Débito</SelectItem>
                        <SelectItem value={PaymentMethod.CARTAO_CREDITO}>Cartão de Crédito</SelectItem>
                        <SelectItem value={PaymentMethod.PIX}>PIX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formaPagamento === PaymentMethod.DINHEIRO && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="valorRecebido">Valor Recebido</Label>
                        <Input
                          id="valorRecebido"
                          type="number"
                          step="0.01"
                          min={pedido.total_amount}
                          value={valorRecebido}
                          onChange={(e) => setValorRecebido(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="troco">Troco</Label>
                        <Input
                          id="troco"
                          type="text"
                          value={formatarValor(parseFloat(troco))}
                          readOnly
                          disabled
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Observações adicionais sobre o pagamento"
                      rows={3}
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleFinalizarPedido}
                    disabled={finalizando}
                  >
                    {finalizando ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Finalizando...
                      </div>
                    ) : (
                      'Finalizar Pedido'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FinalizarPedidoComponent;

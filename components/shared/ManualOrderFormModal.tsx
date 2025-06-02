import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { OrderType, PaymentMethod, ManualOrderData, CartItem } from '../../types';

interface ManualOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManualOrderFormModal: React.FC<ManualOrderFormModalProps> = ({ isOpen, onClose }) => {
  const { tables, createManualOrder, setAlert } = useAppContext();
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderType, setOrderType] = useState<OrderType>(OrderType.BALCAO);
  const [tableId, setTableId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.DINHEIRO);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Campos para adicionar item
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  
  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setOrderType(OrderType.BALCAO);
    setTableId('');
    setPaymentMethod(PaymentMethod.DINHEIRO);
    setNotes('');
    setItems([]);
    setItemName('');
    setItemPrice('');
    setItemQuantity('1');
  };
  
  const handleAddItem = () => {
    if (!itemName.trim()) {
      setAlert({ message: 'Informe o nome do item', type: 'error' });
      return;
    }
    
    if (!itemPrice || isNaN(parseFloat(itemPrice)) || parseFloat(itemPrice) <= 0) {
      setAlert({ message: 'Informe um preço válido para o item', type: 'error' });
      return;
    }
    
    if (!itemQuantity || isNaN(parseInt(itemQuantity)) || parseInt(itemQuantity) <= 0) {
      setAlert({ message: 'Informe uma quantidade válida para o item', type: 'error' });
      return;
    }
    
    const newItem: CartItem = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      menuItemId: `manual-${Date.now()}`,
      name: itemName,
      price: parseFloat(itemPrice),
      quantity: parseInt(itemQuantity),
      itemType: 'standard'
    };
    
    setItems([...items, newItem]);
    setItemName('');
    setItemPrice('');
    setItemQuantity('1');
  };
  
  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };
  
  const handleSubmit = async () => {
    if (!customerName.trim()) {
      setAlert({ message: 'Informe o nome do cliente', type: 'error' });
      return;
    }
    
    if (items.length === 0) {
      setAlert({ message: 'Adicione pelo menos um item ao pedido', type: 'error' });
      return;
    }
    
    if (orderType === OrderType.MESA && !tableId) {
      setAlert({ message: 'Selecione uma mesa para o pedido', type: 'error' });
      return;
    }
    
    if (orderType === OrderType.DELIVERY && !customerAddress.trim()) {
      setAlert({ message: 'Informe o endereço do cliente para delivery', type: 'error' });
      return;
    }
    
    const orderData: ManualOrderData = {
      customerName,
      customerPhone: customerPhone.trim() || undefined,
      customerAddress: customerAddress.trim() || undefined,
      notes: notes.trim() || undefined,
      items,
      orderType,
      tableId: orderType === OrderType.MESA ? tableId : undefined,
      paymentMethod
    };
    
    setIsSubmitting(true);
    try {
      await createManualOrder(orderData);
      setAlert({ message: 'Pedido criado com sucesso!', type: 'success' });
      resetForm();
      onClose();
    } catch (error) {
      setAlert({ message: `Erro ao criar pedido: ${error.message}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Calcular total do pedido
  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Pedido Manual</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {/* Coluna 1: Dados do Cliente e Pedido */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Nome do Cliente *</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nome do cliente"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Telefone</Label>
              <Input
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="orderType">Tipo de Pedido *</Label>
              <Select
                value={orderType}
                onValueChange={(value) => setOrderType(value as OrderType)}
              >
                <SelectTrigger id="orderType">
                  <SelectValue placeholder="Selecione o tipo de pedido" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={OrderType.BALCAO}>Balcão</SelectItem>
                  <SelectItem value={OrderType.MESA}>Mesa</SelectItem>
                  <SelectItem value={OrderType.DELIVERY}>Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {orderType === OrderType.MESA && (
              <div className="space-y-2">
                <Label htmlFor="tableId">Mesa *</Label>
                <Select
                  value={tableId}
                  onValueChange={setTableId}
                >
                  <SelectTrigger id="tableId">
                    <SelectValue placeholder="Selecione uma mesa" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map((table) => (
                      <SelectItem key={table.id} value={table.id}>
                        {table.name} ({table.capacity} lugares)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {orderType === OrderType.DELIVERY && (
              <div className="space-y-2">
                <Label htmlFor="customerAddress">Endereço de Entrega *</Label>
                <Textarea
                  id="customerAddress"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Endereço completo para entrega"
                  rows={3}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              >
                <SelectTrigger id="paymentMethod">
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
            
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre o pedido"
                rows={3}
              />
            </div>
          </div>
          
          {/* Coluna 2: Itens do Pedido */}
          <div className="space-y-4">
            <div className="p-4 border rounded-md bg-gray-50">
              <h3 className="font-medium mb-2">Adicionar Item</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="itemName">Nome do Item *</Label>
                  <Input
                    id="itemName"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="Ex: Pizza de Calabresa"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="itemPrice">Preço (R$) *</Label>
                    <Input
                      id="itemPrice"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="itemQuantity">Quantidade *</Label>
                    <Input
                      id="itemQuantity"
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(e.target.value)}
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleAddItem}
                  className="w-full"
                >
                  Adicionar Item
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Itens do Pedido</h3>
              {items.length === 0 ? (
                <div className="text-center py-4 border rounded-md bg-gray-50 text-gray-500">
                  Nenhum item adicionado
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-2">Item</th>
                        <th className="text-center p-2">Qtd</th>
                        <th className="text-right p-2">Preço</th>
                        <th className="text-right p-2">Subtotal</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">{item.name}</td>
                          <td className="p-2 text-center">{item.quantity}</td>
                          <td className="p-2 text-right">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                          </td>
                          <td className="p-2 text-right">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
                          </td>
                          <td className="p-2 text-center">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr className="border-t">
                        <td colSpan={3} className="p-2 text-right font-medium">Total:</td>
                        <td className="p-2 text-right font-medium">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotal())}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || items.length === 0}>
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Criando...
              </div>
            ) : (
              'Criar Pedido'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManualOrderFormModal;

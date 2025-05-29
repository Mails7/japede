
import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, PizzaSize, PizzaCrust, CartItem } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import Modal from '../shared/Modal';
import { generateId, DEFAULT_PIZZA_IMAGE } from '../../constants';
import { PlusIcon, CheckCircleIcon } from '../icons';

interface PizzaCustomizationModalProps {
  pizzaItem: MenuItem;
  onClose: () => void;
}

const PizzaCustomizationModal: React.FC<PizzaCustomizationModalProps> = ({ pizzaItem, onClose }) => {
  const { menuItems, addRawCartItem, setAlert } = useAppContext();

  const [selectedSize, setSelectedSize] = useState<PizzaSize | null>(null);
  const [selectedCrust, setSelectedCrust] = useState<PizzaCrust | null>(null);
  const [isHalfAndHalf, setIsHalfAndHalf] = useState(false);
  const [firstHalfFlavor, setFirstHalfFlavor] = useState<MenuItem>(pizzaItem);
  const [secondHalfFlavor, setSecondHalfFlavor] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Initialize default selections
  useEffect(() => {
    if (pizzaItem.sizes && pizzaItem.sizes.length > 0) {
      const defaultSize = pizzaItem.sizes[0];
      setSelectedSize(defaultSize);
      // Set default crust for the default size
      if (defaultSize.crusts && defaultSize.crusts.length > 0) {
        const defaultCrustForSize = defaultSize.crusts.find(c => c.additionalPrice === 0) || defaultSize.crusts[0];
        setSelectedCrust(defaultCrustForSize);
      } else {
        setSelectedCrust(null); // No crusts for this size
      }
    }
    setFirstHalfFlavor(pizzaItem); 
    setIsHalfAndHalf(false); 
    setSecondHalfFlavor(null); 
  }, [pizzaItem]);

  // Update selectedCrust when selectedSize changes
  useEffect(() => {
    if (selectedSize && selectedSize.crusts && selectedSize.crusts.length > 0) {
      const defaultCrustForSize = selectedSize.crusts.find(c => c.additionalPrice === 0) || selectedSize.crusts[0];
      setSelectedCrust(defaultCrustForSize);
    } else {
      setSelectedCrust(null); // No crusts for this size, or no size selected
    }
  }, [selectedSize]);


  const availablePizzaFlavors = useMemo(() => {
    return menuItems.filter(
      item => item.id !== firstHalfFlavor.id && item.item_type === 'pizza' && item.available && item.allow_half_and_half && item.sizes && item.sizes.length > 0
    );
  }, [menuItems, firstHalfFlavor]);

  const calculatedPrice = useMemo(() => {
    if (!selectedSize) return 0;

    let basePrice = 0;
    if (isHalfAndHalf && firstHalfFlavor && secondHalfFlavor && selectedSize) {
        // For half-and-half, the price of the size is determined by the more expensive half.
        // We need to find the price of each flavor *for the selected size*.
        // This assumes that flavors (which are MenuItems) also have `sizes` array.
        const firstFlavorSizeData = firstHalfFlavor.sizes?.find(s => s.id === selectedSize.id || s.name === selectedSize.name); // Match by id or name
        const secondFlavorSizeData = secondHalfFlavor.sizes?.find(s => s.id === selectedSize.id || s.name === selectedSize.name);
        
        if (firstFlavorSizeData && secondFlavorSizeData) {
            basePrice = Math.max(firstFlavorSizeData.price, secondFlavorSizeData.price);
        } else if (firstFlavorSizeData) { 
            basePrice = firstFlavorSizeData.price;
        } else if (secondFlavorSizeData) { // If firstHalfFlavor IS pizzaItem, and it doesn't have specific sizes listed itself but secondFlavor does
            basePrice = secondFlavorSizeData.price;
        } else { // Fallback to selectedSize's own price if flavor specific sizes not found (should not happen if configured correctly)
            basePrice = selectedSize.price; 
        }
    } else if (firstHalfFlavor && selectedSize) { // Single flavor
        // Use the price of the firstHalfFlavor for the selectedSize
        const flavorSizeData = firstHalfFlavor.sizes?.find(s => s.id === selectedSize.id || s.name === selectedSize.name);
        basePrice = flavorSizeData ? flavorSizeData.price : selectedSize.price; // Fallback to selectedSize's price
    }
    
    const crustPrice = selectedCrust ? selectedCrust.additionalPrice : 0;
    return (basePrice + crustPrice) * quantity;
  }, [selectedSize, selectedCrust, isHalfAndHalf, firstHalfFlavor, secondHalfFlavor, quantity]);

  const handleAddToCart = () => {
    if (!selectedSize) {
      setAlert({ message: 'Por favor, selecione um tamanho para a pizza.', type: 'error' });
      return;
    }
    if (isHalfAndHalf && !secondHalfFlavor) {
      setAlert({ message: 'Por favor, selecione o segundo sabor para a pizza meia a meia.', type: 'error' });
      return;
    }

    let cartItemName = `${firstHalfFlavor.name}`;
    if (isHalfAndHalf && secondHalfFlavor) {
      cartItemName = `Meia/Meia: ${firstHalfFlavor.name} / ${secondHalfFlavor.name}`;
    }
    if (selectedSize) cartItemName += ` (${selectedSize.name})`;
    
    // Add crust name only if a crust is selected and it has a name (it might be "Sem Borda" with price 0)
    if (selectedCrust && selectedCrust.name) {
        if (selectedCrust.additionalPrice > 0 || (selectedCrust.additionalPrice === 0 && selectedCrust.name.toLowerCase() !== "sem borda" && selectedCrust.name.toLowerCase() !== "borda padrão")) {
             cartItemName += ` - ${selectedCrust.name}`;
        } else if (selectedCrust.additionalPrice === 0 && (selectedCrust.name.toLowerCase() === "sem borda" || selectedCrust.name.toLowerCase() === "borda padrão")) {
            // Optionally, don't add "Sem borda" or "Borda Padrão" if it's free and implied
        } else {
             cartItemName += ` - Borda ${selectedCrust.name}`; // Fallback for other free crusts
        }
    }


    const firstFlavorPriceForSize = firstHalfFlavor.sizes?.find(s => s.id === selectedSize.id || s.name === selectedSize.name)?.price || selectedSize.price;
    const secondFlavorPriceForSize = isHalfAndHalf && secondHalfFlavor 
        ? (secondHalfFlavor.sizes?.find(s => s.id === selectedSize.id || s.name === selectedSize.name)?.price || selectedSize.price) 
        : undefined;

    const newCartItem: CartItem = {
      id: generateId(), 
      menuItemId: firstHalfFlavor.id, 
      name: cartItemName,
      price: calculatedPrice / quantity, 
      quantity,
      imageUrl: firstHalfFlavor.image_url || DEFAULT_PIZZA_IMAGE,
      itemType: 'pizza',
      selectedSize: selectedSize,
      selectedCrust: selectedCrust || undefined,
      isHalfAndHalf: isHalfAndHalf,
      firstHalfFlavor: { 
        menuItemId: firstHalfFlavor.id, 
        name: firstHalfFlavor.name, 
        priceForSize: firstFlavorPriceForSize,
        imageUrl: firstHalfFlavor.image_url 
      },
      secondHalfFlavor: isHalfAndHalf && secondHalfFlavor ? { 
        menuItemId: secondHalfFlavor.id, 
        name: secondHalfFlavor.name,
        priceForSize: secondFlavorPriceForSize || 0, 
        imageUrl: secondHalfFlavor.image_url
      } : undefined,
    };

    addRawCartItem(newCartItem);
    setAlert({ message: `${cartItemName} adicionada ao carrinho!`, type: 'success' });
    onClose();
  };

  if (!pizzaItem || pizzaItem.item_type !== 'pizza' || !pizzaItem.sizes || pizzaItem.sizes.length === 0) {
    return (
      <Modal title="Erro" onClose={onClose}>
        <p>Item de pizza inválido ou não configurado corretamente.</p>
      </Modal>
    );
  }
  
  return (
    <Modal title={`Montar Pizza: ${pizzaItem.name}`} onClose={onClose}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
        {/* Size Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">1. Escolha o Tamanho:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {pizzaItem.sizes.map(size => (
              <button
                key={size.id}
                onClick={() => setSelectedSize(size)}
                className={`p-3 border rounded-lg text-sm text-center transition-all duration-150 ease-in-out
                  ${selectedSize?.id === size.id 
                    ? 'bg-primary text-white ring-2 ring-primary-dark shadow-md' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                <p className="font-semibold">{size.name}</p>
                <p>R$ {size.price.toFixed(2).replace('.', ',')}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Crust Selection - Now from selectedSize.crusts */}
        {selectedSize && selectedSize.crusts && selectedSize.crusts.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">2. Escolha a Borda (para {selectedSize.name}):</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {selectedSize.crusts.map(crust => (
                <button
                  key={crust.id}
                  onClick={() => setSelectedCrust(crust)}
                  className={`p-3 border rounded-lg text-sm text-center transition-all duration-150 ease-in-out
                    ${selectedCrust?.id === crust.id 
                      ? 'bg-primary text-white ring-2 ring-primary-dark shadow-md' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  <p className="font-semibold">{crust.name}</p>
                  <p>{crust.additionalPrice > 0 ? `+ R$ ${crust.additionalPrice.toFixed(2).replace('.', ',')}` : 'Grátis'}</p>
                </button>
              ))}
            </div>
          </div>
        )}
         {selectedSize && (!selectedSize.crusts || selectedSize.crusts.length === 0) && (
            <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">2. Borda:</h3>
                <p className="text-sm text-gray-500 italic">Nenhuma opção de borda para o tamanho {selectedSize.name}.</p>
            </div>
        )}


        {/* Half-and-Half Selection */}
        {pizzaItem.allow_half_and_half && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">3. Sabores:</h3>
            <label className={`flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer 
                            ${isHalfAndHalf ? 'bg-primary-light/10 border-primary' : 'bg-white'}`}>
              <input
                type="checkbox"
                checked={isHalfAndHalf}
                onChange={e => {
                  setIsHalfAndHalf(e.target.checked);
                  if (!e.target.checked) setSecondHalfFlavor(null); 
                }}
                className="h-5 w-5 text-primary rounded border-gray-300 focus:ring-primary"
              />
              <span className={`font-medium ${isHalfAndHalf ? 'text-primary-dark' : 'text-gray-700'}`}>Quero Meia a Meia (dois sabores)</span>
            </label>

            {isHalfAndHalf && (
              <div className="mt-3 space-y-3">
                <div className="p-3 border rounded-md bg-gray-50">
                  <p className="text-sm font-medium text-gray-600">1º Sabor (Principal):</p>
                  <p className="text-md font-semibold text-gray-800">{firstHalfFlavor.name}</p>
                </div>
                <div>
                  <label htmlFor="secondFlavor" className="block text-sm font-medium text-gray-600 mb-1">2º Sabor:</label>
                  {availablePizzaFlavors.length > 0 ? (
                    <select
                        id="secondFlavor"
                        value={secondHalfFlavor?.id || ''}
                        onChange={e => {
                            const selected = availablePizzaFlavors.find(p => p.id === e.target.value);
                            setSecondHalfFlavor(selected || null);
                        }}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white"
                        required={isHalfAndHalf}
                    >
                        <option value="" disabled>Selecione o segundo sabor</option>
                        {availablePizzaFlavors.map(flavor => (
                        <option key={flavor.id} value={flavor.id}>{flavor.name}</option>
                        ))}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Nenhum outro sabor disponível para meia a meia no momento.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quantity */}
        <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-700">Quantidade:</h3>
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-1 border rounded-full hover:bg-gray-200">-</button>
            <span className="text-lg font-medium">{quantity}</span>
            <button onClick={() => setQuantity(q => q + 1)} className="p-1 border rounded-full hover:bg-gray-200">+</button>
        </div>

        {/* Total Price & Add to Cart Button */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xl font-semibold text-gray-800">Total:</span>
            <span className="text-2xl font-bold text-primary">R$ {calculatedPrice.toFixed(2).replace('.', ',')}</span>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!selectedSize || (isHalfAndHalf && !secondHalfFlavor)}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-colors duration-150 ease-in-out flex items-center justify-center text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="w-6 h-6 mr-2"/> Adicionar ao Carrinho
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PizzaCustomizationModal;


import React from 'react';
import { CartItem } from '../../types';
import { PlusIcon, TrashIcon, XIcon as MinusIcon } from '../icons'; 
import { DEFAULT_PIZZA_IMAGE } from '../../constants';

interface ShoppingCartItemProps {
  item: CartItem;
  onRemove: () => void;
  onUpdateQuantity: (newQuantity: number) => void;
}

const ShoppingCartItem: React.FC<ShoppingCartItemProps> = ({ item, onRemove, onUpdateQuantity }) => {
  const increment = () => onUpdateQuantity(item.quantity + 1);
  const decrement = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.quantity - 1);
    } else {
      onRemove(); 
    }
  };

  return (
    <div className="flex items-start sm:items-center space-x-3 p-3 bg-white rounded-lg shadow-sm border border-gray-200">
      <img 
        src={item.imageUrl || (item.itemType === 'pizza' ? DEFAULT_PIZZA_IMAGE : `https://picsum.photos/seed/${item.menuItemId}/100/100`)} 
        alt={item.name} 
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-md object-cover flex-shrink-0"
        onError={(e) => (e.currentTarget.src = item.itemType === 'pizza' ? DEFAULT_PIZZA_IMAGE : 'https://picsum.photos/seed/placeholder_cart/100/100')}
      />
      <div className="flex-grow min-w-0"> {/* Added min-w-0 for better truncation */}
        <h5 className="text-sm sm:text-base font-semibold text-gray-800 truncate" title={item.name}>
          {item.name}
        </h5>
        <p className="text-xs sm:text-sm text-primary font-medium">
            R$ {item.price.toFixed(2).replace('.', ',')} (unid.)
        </p>
        <div className="flex items-center mt-1 sm:mt-2">
          <button 
            onClick={decrement} 
            className="p-1 text-gray-600 hover:text-red-500 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Diminuir quantidade"
          >
            {item.quantity > 1 ? <MinusIcon className="w-4 h-4" /> : <TrashIcon className="w-4 h-4 text-red-500"/>}
          </button>
          <span className="mx-2 text-sm sm:text-base font-medium w-6 text-center">{item.quantity}</span>
          <button 
            onClick={increment} 
            className="p-1 text-gray-600 hover:text-green-500 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Aumentar quantidade"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-auto pl-2">
        <p className="text-sm sm:text-base font-semibold text-gray-800">
          R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
        </p>
        <button 
            onClick={onRemove} // This already calls the onRemove passed from ShoppingCartModal which should use item.id
            className="text-xs text-red-500 hover:text-red-700 hover:underline mt-1"
            aria-label="Remover item"
        >
            Remover
        </button>
      </div>
    </div>
  );
};

export default ShoppingCartItem;
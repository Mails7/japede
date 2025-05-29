
import React from 'react';
import { MenuItem } from '../../types';
import { PlusIcon } from '../icons'; 
import { DEFAULT_PIZZA_IMAGE } from '../../constants';

interface CustomerProductCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void; 
  onCustomizePizza: (item: MenuItem) => void; 
}

const CustomerProductCard: React.FC<CustomerProductCardProps> = ({ item, onAddToCart, onCustomizePizza }) => {
  
  const smallestSizePrice = item.item_type === 'pizza' && item.sizes && item.sizes.length > 0
    ? Math.min(...item.sizes.map(s => s.price))
    : item.price;

  const displayPrice = item.item_type === 'pizza' 
    ? `A partir de R$ ${smallestSizePrice.toFixed(2).replace('.', ',')}`
    : `R$ ${item.price.toFixed(2).replace('.', ',')}`;

  const handleCardClick = () => {
    if (!item.available) return;
    if (item.item_type === 'pizza') {
      onCustomizePizza(item);
    } else {
      onAddToCart(item);
    }
  };
  
  const handleButtonClick = (e: React.MouseEvent) => {
    if (!item.available) return;
    e.stopPropagation(); 
    handleCardClick(); 
  };


  return (
    <div 
      className={`bg-white rounded-xl shadow-lg overflow-hidden flex flex-col transition-transform duration-300 hover:shadow-xl hover:scale-105 ${!item.available ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={handleCardClick} 
      role="button"
      tabIndex={item.available ? 0 : -1}
      aria-label={item.available ? `${item.item_type === 'pizza' ? 'Montar' : 'Adicionar'} ${item.name}` : `${item.name} (Indisponível)`}
    >
      <div className="relative">
        <img 
          src={item.image_url || (item.item_type === 'pizza' ? DEFAULT_PIZZA_IMAGE : `https://picsum.photos/seed/${item.id}/400/250`)} 
          alt={item.name} 
          className="w-full h-52 object-cover"
          onError={(e) => (e.currentTarget.src = item.item_type === 'pizza' ? DEFAULT_PIZZA_IMAGE : 'https://picsum.photos/seed/placeholder_food/400/250')}
        />
        {!item.available && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold text-lg bg-red-600 px-3 py-1 rounded">Indisponível</span>
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h4 className="text-xl font-semibold text-gray-800 mb-1 truncate" title={item.name}>{item.name}</h4>
        <p className="text-gray-600 text-sm mb-3 min-h-[40px] line-clamp-2" title={item.description}>{item.description || "Delicioso item do nosso cardápio."}</p>
        <div className="mt-auto">
          <p className={`text-xl font-bold mb-3 ${item.item_type === 'pizza' ? 'text-gray-700' : 'text-primary'}`}>
            {displayPrice}
          </p>
          <button
            onClick={handleButtonClick} 
            disabled={!item.available}
            className={`w-full flex items-center justify-center text-sm font-semibold py-2 px-4 rounded-lg transition-colors duration-150 ease-in-out
              ${item.available 
                ? 'bg-primary hover:bg-primary-dark text-white shadow-md' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            <PlusIcon className="w-5 h-5 mr-2"/>
            {item.available ? (item.item_type === 'pizza' ? 'Montar Pizza' : 'Adicionar') : 'Indisponível'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerProductCard;

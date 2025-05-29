
import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import CustomerProductCard from '../../components/customer/CustomerProductCard';
import { MenuItem } from '../../types';
import { BookOpenIcon } from '../../components/icons'; // Changed to BookOpenIcon for Menu

interface CustomerMenuPageProps {
  onCustomizePizza: (pizzaItem: MenuItem) => void;
}

const CustomerMenuPage: React.FC<CustomerMenuPageProps> = ({ onCustomizePizza }) => {
  const { categories, menuItems, addToCart, setAlert } = useAppContext();

  const handleStandardItemAddToCart = (item: MenuItem) => {
    if (!item.available) {
      setAlert({ message: `${item.name} está indisponível no momento.`, type: 'info'});
      return;
    }
    addToCart(item); // Uses context's addToCart for standard items
    setAlert({ message: `${item.name} adicionado ao carrinho!`, type: 'success'});
  };

  const availableMenuItems = menuItems.filter(item => item.available);

  return (
    <div className="space-y-8">
      <div className="text-center my-8">
        <h2 className="text-4xl font-bold text-gray-800">Nosso Cardápio</h2>
        <p className="text-lg text-gray-600 mt-2">Escolha seus pratos favoritos!</p>
      </div>

      {categories.length === 0 && availableMenuItems.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <BookOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-500">Nosso cardápio está sendo preparado!</p>
          <p className="text-gray-400 mt-2">Volte em breve para conferir as novidades.</p>
        </div>
      )}

      {categories.map(category => {
        const itemsInCategory = availableMenuItems.filter(item => item.category_id === category.id);
        if (itemsInCategory.length === 0) return null; 

        return (
          <section key={category.id} aria-labelledby={`category-title-${category.id}`}>
            <h3 id={`category-title-${category.id}`} className="text-3xl font-semibold text-gray-700 mb-6 border-b-2 border-primary pb-2">
              {category.name}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {itemsInCategory.map(item => (
                <CustomerProductCard 
                  key={item.id} 
                  item={item} 
                  onAddToCart={handleStandardItemAddToCart} 
                  onCustomizePizza={onCustomizePizza}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default CustomerMenuPage;

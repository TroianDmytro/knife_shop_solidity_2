import React, { useState } from 'react';
import { Web3Provider } from './contexts/Web3Context';
import { useWeb3 } from './contexts/Web3Context';
import { CartItem } from './types/types';
import Header from './components/Header';
import KnifeList from './components/KnifeList';
import ShoppingCart from './components/ShoppingCart';
import AdminPanel from './components/AdminPanel';
import './App.css';

const AppContent: React.FC = () => {
  const { web3, accounts, knifeShopContract, connected } = useWeb3();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState<boolean>(false);
  const [showAdmin, setShowAdmin] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Добавление товара в корзину
  const addToCart = (item: CartItem) => {
    setCartItems(prevItems => {
      // Проверяем, есть ли уже такой нож в корзине
      const existingItemIndex = prevItems.findIndex(i => i.knife.id === item.knife.id);

      if (existingItemIndex !== -1) {
        // Если нож уже в корзине, увеличиваем количество
        const updatedItems = [...prevItems];
        const newQuantity = updatedItems[existingItemIndex].quantity + item.quantity;

        // Проверяем, не превышает ли новое количество доступное на складе
        if (newQuantity <= item.knife.stock) {
          updatedItems[existingItemIndex].quantity = newQuantity;
        } else {
          // Устанавливаем максимально доступное количество
          updatedItems[existingItemIndex].quantity = item.knife.stock;

          // Показываем уведомление о достижении максимального количества
          setNotification({
            message: `Вы достигли максимального доступного количества для "${item.knife.name}"`,
            type: 'error'
          });

          // Автоматически скрываем уведомление через 3 секунды
          setTimeout(() => setNotification(null), 3000);
        }

        return updatedItems;
      } else {
        // Если ножа еще нет в корзине, добавляем его
        return [...prevItems, item];
      }
    });

    // Показываем уведомление о добавлении товара в корзину
    setNotification({
      message: `"${item.knife.name}" добавлен в корзину`,
      type: 'success'
    });

    // Автоматически скрываем уведомление через 3 секунды
    setTimeout(() => setNotification(null), 3000);

    // Показываем корзину после добавления товара
    setShowCart(true);
  };

  // Обновление количества товара в корзине
  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Если новое количество <= 0, удаляем товар из корзины
      removeFromCart(id);
      return;
    }

    setCartItems(prevItems => {
      const itemIndex = prevItems.findIndex(item => item.knife.id === id);

      if (itemIndex !== -1) {
        const knife = prevItems[itemIndex].knife;

        // Проверяем, не превышает ли новое количество доступное на складе
        if (newQuantity > knife.stock) {
          // Показываем уведомление о достижении максимального количества
          setNotification({
            message: `Максимально доступное количество для "${knife.name}" - ${knife.stock}`,
            type: 'error'
          });

          // Автоматически скрываем уведомление через 3 секунды
          setTimeout(() => setNotification(null), 3000);

          // Устанавливаем максимально доступное количество
          newQuantity = knife.stock;
        }

        const updatedItems = [...prevItems];
        updatedItems[itemIndex].quantity = newQuantity;
        return updatedItems;
      }

      return prevItems;
    });
  };

  // Удаление товара из корзины
  const removeFromCart = (id: number) => {
    setCartItems(prevItems => {
      const itemToRemove = prevItems.find(item => item.knife.id === id);

      if (itemToRemove) {
        // Показываем уведомление об удалении товара
        setNotification({
          message: `"${itemToRemove.knife.name}" удален из корзины`,
          type: 'success'
        });

        // Автоматически скрываем уведомление через 3 секунды
        setTimeout(() => setNotification(null), 3000);
      }

      return prevItems.filter(item => item.knife.id !== id);
    });
  };

  // Оформление заказа
  const checkout = async () => {
    if (!web3 || !knifeShopContract || !connected || cartItems.length === 0) {
      return;
    }

    setIsProcessing(true);

    try {
      // Обрабатываем каждый товар в корзине
      for (const item of cartItems) {
        const knifeId = item.knife.id;
        const quantity = item.quantity;
        const price = item.knife.price;
        const totalPrice = web3.utils.toBN(price).mul(web3.utils.toBN(quantity));

        // Вызываем метод покупки в смарт-контракте
        await knifeShopContract.methods.purchaseKnife(knifeId, quantity)
          .send({
            from: accounts[0],
            value: totalPrice
          });
      }

      // Очищаем корзину после успешной покупки
      setCartItems([]);

      // Показываем уведомление об успешной покупке
      setNotification({
        message: 'Заказ успешно оформлен! Спасибо за покупку!',
        type: 'success'
      });

      // Закрываем корзину после успешной покупки
      setShowCart(false);
    } catch (err: any) {
      console.error('Ошибка при оформлении заказа:', err);

      // Показываем уведомление об ошибке
      setNotification({
        message: 'Ошибка при оформлении заказа. Пожалуйста, попробуйте еще раз.',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);

      // Автоматически скрываем уведомление через 5 секунд
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Переключение между разделами
  const toggleCart = () => {
    setShowCart(prev => !prev);
    if (showAdmin) setShowAdmin(false);
  };

  const toggleAdmin = () => {
    setShowAdmin(prev => !prev);
    if (showCart) setShowCart(false);
  };

  return (
    <div className="app">
      <Header
        cartItemsCount={cartItems.reduce((total, item) => total + item.quantity, 0)}
        toggleCart={toggleCart}
        toggleAdmin={toggleAdmin}
      />

      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <main className="main-content">
        {showAdmin ? (
          <AdminPanel />
        ) : showCart ? (
          <ShoppingCart
            cartItems={cartItems}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            checkout={checkout}
            isProcessing={isProcessing}
          />
        ) : (
          <KnifeList addToCart={addToCart} />
        )}
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Магазин ножей на блокчейне. Все права защищены.</p>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  );
}
import React from 'react';
import { CartItem } from '../types/types';
import { useWeb3 } from '../contexts/Web3Context';
import Web3 from 'web3';

interface ShoppingCartProps {
    cartItems: CartItem[];
    updateQuantity: (id: number, newQuantity: number) => void;
    removeFromCart: (id: number) => void;
    checkout: () => Promise<void>;
    isProcessing: boolean;
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({
    cartItems,
    updateQuantity,
    removeFromCart,
    checkout,
    isProcessing
}) => {
    const { connected } = useWeb3();

    // Расчет общей стоимости
    const totalPrice = cartItems.reduce((total, item) => {
        const itemPrice = Web3.utils.toBN(item.knife.price).mul(Web3.utils.toBN(item.quantity));
        return total.add(itemPrice);
    }, Web3.utils.toBN(0));

    // Форматирование суммы в Эфирах
    const totalPriceEther = Web3.utils.fromWei(totalPrice.toString(), 'ether');

    if (!connected) {
        return (
            <div className="shopping-cart-container">
                <h2>Корзина</h2>
                <p>Пожалуйста, подключите кошелек для использования корзины.</p>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="shopping-cart-container">
                <h2>Корзина</h2>
                <p className="empty-cart-message">Ваша корзина пуста</p>
            </div>
        );
    }

    return (
        <div className="shopping-cart-container">
            <h2>Корзина</h2>
            <div className="cart-items">
                {cartItems.map((item) => (
                    <div key={item.knife.id} className="cart-item">
                        <div className="cart-item-image">
                            <img src={item.knife.imageUrl} alt={item.knife.name} />
                        </div>
                        <div className="cart-item-details">
                            <h3>{item.knife.name}</h3>
                            <p className="cart-item-price">
                                {Web3.utils.fromWei(item.knife.price, 'ether')} ETH x {item.quantity} =
                                {Web3.utils.fromWei(
                                    Web3.utils.toBN(item.knife.price).mul(Web3.utils.toBN(item.quantity)).toString(),
                                    'ether'
                                )} ETH
                            </p>
                        </div>
                        <div className="cart-item-actions">
                            <div className="quantity-control">
                                <button
                                    className="quantity-btn"
                                    onClick={() => updateQuantity(item.knife.id, item.quantity - 1)}
                                    disabled={item.quantity <= 1 || isProcessing}
                                >
                                    -
                                </button>
                                <span className="quantity">{item.quantity}</span>
                                <button
                                    className="quantity-btn"
                                    onClick={() => updateQuantity(item.knife.id, item.quantity + 1)}
                                    disabled={item.quantity >= item.knife.stock || isProcessing}
                                >
                                    +
                                </button>
                            </div>
                            <button
                                className="remove-btn"
                                onClick={() => removeFromCart(item.knife.id)}
                                disabled={isProcessing}
                            >
                                Удалить
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="cart-summary">
                <div className="cart-total">
                    <span>Итого:</span>
                    <span className="total-price">{totalPriceEther} ETH</span>
                </div>
                <button
                    className="checkout-btn"
                    onClick={checkout}
                    disabled={isProcessing}
                >
                    {isProcessing ? 'Обработка...' : 'Оформить заказ'}
                </button>
            </div>
        </div>
    );
};

export default ShoppingCart;
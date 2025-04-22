import React from 'react';
import { Knife } from '../types/types';
import Web3 from 'web3';

interface KnifeItemProps {
    knife: Knife;
    onAddToCart: (knife: Knife) => void;
}

const KnifeItem: React.FC<KnifeItemProps> = ({ knife, onAddToCart }) => {
    // Преобразуем цену из Wei в Ether для отображения
    const priceInEther = Web3.utils.fromWei(knife.price, 'ether');

    return (
        <div className="knife-item">
            <div className="knife-image">
                <img src={knife.imageUrl} alt={knife.name} />
            </div>
            <div className="knife-details">
                <h3>{knife.name}</h3>
                <p className="knife-description">{knife.description}</p>
                <div className="knife-price-stock">
                    <p className="knife-price">{priceInEther} ETH</p>
                    <p className={`knife-stock ${knife.stock < 5 ? 'low-stock' : ''}`}>
                        {knife.stock > 0 ? `В наличии: ${knife.stock}` : 'Нет в наличии'}
                    </p>
                </div>
                <button
                    className="add-to-cart-btn"
                    onClick={() => onAddToCart(knife)}
                    disabled={!knife.isAvailable || knife.stock === 0}
                >
                    {knife.isAvailable && knife.stock > 0 ? 'Добавить в корзину' : 'Недоступно'}
                </button>
            </div>
        </div>
    );
};

export default KnifeItem;
import React, { useState, useEffect } from 'react';
import { Knife, CartItem } from '../types/types';
import { useWeb3 } from '../contexts/Web3Context';
import KnifeItem from './KnifeItem';
import LoadingSpinner from './LoadingSpinner';

interface KnifeListProps {
    addToCart: (item: CartItem) => void;
}

const KnifeList: React.FC<KnifeListProps> = ({ addToCart }) => {
    const { knifeShopContract, connected } = useWeb3();
    const [knives, setKnives] = useState<Knife[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Получаем все ножи из смарт-контракта
    useEffect(() => {
        const fetchKnives = async () => {
            if (!knifeShopContract || !connected) {
                return;
            }

            setLoading(true);
            try {
                // Получаем количество ножей
                const knifeCount = await knifeShopContract.methods.getKnifeCount().call();

                // Загружаем информацию о каждом ноже
                const knivesArray: Knife[] = [];

                for (let i = 1; i <= knifeCount; i++) {
                    const knife = await knifeShopContract.methods.getKnife(i).call();

                    // Преобразуем данные в наш тип Knife
                    knivesArray.push({
                        id: parseInt(knife.id),
                        name: knife.name,
                        description: knife.description,
                        imageUrl: knife.imageUrl,
                        price: knife.price.toString(),
                        stock: parseInt(knife.stock),
                        isAvailable: knife.isAvailable
                    });
                }

                setKnives(knivesArray);
                setError(null);
            } catch (err: any) {
                console.error('Ошибка при получении списка ножей:', err);
                setError('Не удалось загрузить список ножей. Пожалуйста, попробуйте еще раз.');
            } finally {
                setLoading(false);
            }
        };

        fetchKnives();
    }, [knifeShopContract, connected]);

    // Обработчик добавления ножа в корзину
    const handleAddToCart = (knife: Knife) => {
        addToCart({ knife, quantity: 1 });
    };

    if (!connected) {
        return (
            <div className="knife-list-container connect-wallet-prompt">
                <p>Пожалуйста, подключите кошелек для просмотра доступных ножей.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="knife-list-container loading">
                <LoadingSpinner />
                <p>Загрузка списка ножей...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="knife-list-container error">
                <p className="error-message">{error}</p>
                <button onClick={() => window.location.reload()}>Попробовать снова</button>
            </div>
        );
    }

    if (knives.length === 0) {
        return (
            <div className="knife-list-container empty">
                <p>В магазине пока нет доступных ножей.</p>
            </div>
        );
    }

    return (
        <div className="knife-list-container">
            <h2>Наш ассортимент</h2>
            <div className="knife-list">
                {knives.map((knife) => (
                    <KnifeItem
                        key={knife.id}
                        knife={knife}
                        onAddToCart={handleAddToCart}
                    />
                ))}
            </div>
        </div>
    );
};

export default KnifeList;
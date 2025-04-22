import React, { useState, useEffect, FormEvent } from 'react';
import { Knife } from '../types/types';
import { useWeb3 } from '../contexts/Web3Context';
import Web3 from 'web3';
import LoadingSpinner from './LoadingSpinner';
////
const AdminPanel: React.FC = () => {
    const { knifeShopContract, accounts, connected } = useWeb3();
    const [knives, setKnives] = useState<Knife[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isOwner, setIsOwner] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Состояние для формы добавления/редактирования ножа
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [currentKnife, setCurrentKnife] = useState<Knife | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        imageUrl: '',
        price: '',
        stock: 0,
        isAvailable: true
    });

    // Проверка, является ли текущий пользователь владельцем магазина
    useEffect(() => {
        const checkOwner = async () => {
            if (!knifeShopContract || !connected || accounts.length === 0) {
                setIsOwner(false);
                return;
            }

            try {
                const owner = await knifeShopContract.methods.owner().call();
                setIsOwner(accounts[0].toLowerCase() === owner.toLowerCase());
            } catch (err) {
                console.error('Ошибка при проверке владельца:', err);
                setIsOwner(false);
            }
        };

        checkOwner();
    }, [knifeShopContract, accounts, connected]);

    // Загрузка всех ножей из смарт-контракта
    useEffect(() => {
        const fetchKnives = async () => {
            if (!knifeShopContract || !connected) {
                setLoading(false);
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

    // Обработчик изменения полей формы
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData({ ...formData, [name]: checked });
        } else if (name === 'price') {
            // Проверка на корректность ввода для цены (должна быть в ETH)
            setFormData({ ...formData, [name]: value });
        } else if (name === 'stock') {
            // Преобразование строки в число для запасов
            setFormData({ ...formData, [name]: parseInt(value) || 0 });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    // Функция для добавления нового ножа
    const addKnife = async (e: FormEvent) => {
        e.preventDefault();
        if (!knifeShopContract || !connected || !isOwner) {
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Преобразуем цену из ETH в Wei
            const priceInWei = Web3.utils.toWei(formData.price, 'ether');

            // Вызываем метод смарт-контракта для добавления ножа
            await knifeShopContract.methods.addKnife(
                formData.name,
                formData.description,
                formData.imageUrl,
                priceInWei,
                formData.stock
            ).send({ from: accounts[0] });

            // Очищаем форму после успешного добавления
            setFormData({
                name: '',
                description: '',
                imageUrl: '',
                price: '',
                stock: 0,
                isAvailable: true
            });

            // Обновляем список ножей
            const knifeCount = await knifeShopContract.methods.getKnifeCount().call();
            const newKnife = await knifeShopContract.methods.getKnife(knifeCount).call();

            setKnives([...knives, {
                id: parseInt(newKnife.id),
                name: newKnife.name,
                description: newKnife.description,
                imageUrl: newKnife.imageUrl,
                price: newKnife.price.toString(),
                stock: parseInt(newKnife.stock),
                isAvailable: newKnife.isAvailable
            }]);

            setSuccess('Нож успешно добавлен!');
        } catch (err: any) {
            console.error('Ошибка при добавлении ножа:', err);
            setError('Не удалось добавить нож. Пожалуйста, проверьте данные и попробуйте снова.');
        } finally {
            setLoading(false);
        }
    };

    // Функция для обновления существующего ножа
    const updateKnife = async (e: FormEvent) => {
        e.preventDefault();
        if (!knifeShopContract || !connected || !isOwner || !currentKnife) {
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Преобразуем цену из ETH в Wei
            const priceInWei = Web3.utils.toWei(formData.price, 'ether');

            // Вызываем метод смарт-контракта для обновления ножа
            await knifeShopContract.methods.updateKnife(
                currentKnife.id,
                formData.name,
                formData.description,
                formData.imageUrl,
                priceInWei,
                formData.stock,
                formData.isAvailable
            ).send({ from: accounts[0] });

            // Обновляем нож в локальном состоянии
            const updatedKnives = knives.map(knife =>
                knife.id === currentKnife.id ? {
                    ...knife,
                    name: formData.name,
                    description: formData.description,
                    imageUrl: formData.imageUrl,
                    price: priceInWei.toString(),
                    stock: formData.stock,
                    isAvailable: formData.isAvailable
                } : knife
            );

            setKnives(updatedKnives);
            setIsEditing(false);
            setCurrentKnife(null);

            // Очищаем форму
            setFormData({
                name: '',
                description: '',
                imageUrl: '',
                price: '',
                stock: 0,
                isAvailable: true
            });

            setSuccess('Нож успешно обновлен!');
        } catch (err: any) {
            console.error('Ошибка при обновлении ножа:', err);
            setError('Не удалось обновить нож. Пожалуйста, проверьте данные и попробуйте снова.');
        } finally {
            setLoading(false);
        }
    };

    // Функция для начала редактирования ножа
    const startEditing = (knife: Knife) => {
        setIsEditing(true);
        setCurrentKnife(knife);
        setFormData({
            name: knife.name,
            description: knife.description,
            imageUrl: knife.imageUrl,
            price: Web3.utils.fromWei(knife.price, 'ether'),
            stock: knife.stock,
            isAvailable: knife.isAvailable
        });
    };

    // Функция для отмены редактирования
    const cancelEditing = () => {
        setIsEditing(false);
        setCurrentKnife(null);
        setFormData({
            name: '',
            description: '',
            imageUrl: '',
            price: '',
            stock: 0,
            isAvailable: true
        });
    };

    if (!connected) {
        return (
            <div className="admin-panel-container">
                <h2>Панель администратора</h2>
                <p>Пожалуйста, подключите кошелек для доступа к панели администратора.</p>
            </div>
        );
    }

    if (!isOwner) {
        return (
            <div className="admin-panel-container">
                <h2>Панель администратора</h2>
                <p>У вас нет прав для доступа к панели администратора.</p>
            </div>
        );
    }

    return (
        <div className="admin-panel-container">
            <h2>Панель администратора</h2>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="admin-section">
                <h3>{isEditing ? 'Редактирование ножа' : 'Добавление нового ножа'}</h3>

                <form onSubmit={isEditing ? updateKnife : addKnife} className="knife-form">
                    <div className="form-group">
                        <label htmlFor="name">Название ножа</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Описание</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="imageUrl">URL изображения</label>
                        <input
                            type="url"
                            id="imageUrl"
                            name="imageUrl"
                            value={formData.imageUrl}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="price">Цена (в ETH)</label>
                        <input
                            type="text"
                            id="price"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            placeholder="0.1"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="stock">Количество в наличии</label>
                        <input
                            type="number"
                            id="stock"
                            name="stock"
                            value={formData.stock}
                            onChange={handleInputChange}
                            min="0"
                            required
                        />
                    </div>

                    {isEditing && (
                        <div className="form-group checkbox">
                            <label htmlFor="isAvailable">
                                <input
                                    type="checkbox"
                                    id="isAvailable"
                                    name="isAvailable"
                                    checked={formData.isAvailable}
                                    onChange={handleInputChange}
                                />
                                Доступен для продажи
                            </label>
                        </div>
                    )}

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={loading}
                        >
                            {loading ? <LoadingSpinner /> : (isEditing ? 'Сохранить изменения' : 'Добавить нож')}
                        </button>

                        {isEditing && (
                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={cancelEditing}
                                disabled={loading}
                            >
                                Отменить
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="admin-section">
                <h3>Управление ассортиментом</h3>

                {loading && <LoadingSpinner />}

                {knives.length === 0 ? (
                    <p>В магазине пока нет ножей.</p>
                ) : (
                    <div className="knives-table-container">
                        <table className="knives-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Изображение</th>
                                    <th>Название</th>
                                    <th>Цена (ETH)</th>
                                    <th>В наличии</th>
                                    <th>Статус</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {knives.map(knife => (
                                    <tr key={knife.id}>
                                        <td>{knife.id}</td>
                                        <td>
                                            <img
                                                src={knife.imageUrl}
                                                alt={knife.name}
                                                className="knife-thumbnail"
                                            />
                                        </td>
                                        <td>{knife.name}</td>
                                        <td>{Web3.utils.fromWei(knife.price, 'ether')}</td>
                                        <td>{knife.stock}</td>
                                        <td>
                                            <span className={`status ${knife.isAvailable ? 'active' : 'inactive'}`}>
                                                {knife.isAvailable ? 'Активен' : 'Неактивен'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="edit-btn"
                                                onClick={() => startEditing(knife)}
                                                disabled={loading}
                                            >
                                                Редактировать
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;
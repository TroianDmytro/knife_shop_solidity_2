// client/src/contexts/Web3Context.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { Web3ContextType } from '../types/types';
import KnifeShopABI from '../contracts/KnifeShop.json';
import { KnifeShopAbi } from '../types/contract-types';

// Создаем контекст с начальными пустыми значениями
const Web3Context = createContext<Web3ContextType>({
    web3: null,
    accounts: [],
    knifeShopContract: null,
    connected: false,
    loading: true,
    error: null,
    connectWallet: async () => { },
});

// Адрес контракта (замените на реальный после деплоя)
const KNIFE_SHOP_ADDRESS = "0x0000000000000000000000000000000000000000";

interface Web3ProviderProps {
    children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
    const [web3, setWeb3] = useState<Web3 | null>(null);
    const [accounts, setAccounts] = useState<string[]>([]);
    const [knifeShopContract, setKnifeShopContract] = useState<Contract<KnifeShopAbi> | null>(null);
    const [connected, setConnected] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Функция для подключения к MetaMask
    const connectWallet = async () => {
        setLoading(true);
        try {
            // Проверяем наличие MetaMask
            if (window.ethereum) {
                const web3Instance = new Web3(window.ethereum);

                // Запрашиваем доступ к аккаунтам пользователя
                const userAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

                // Создаем экземпляр контракта
                const networkId = await web3Instance.eth.net.getId();
                const networkIdString = networkId.toString();

                // Проверяем, что networks существует
                const deployedNetwork = KnifeShopABI.networks && KnifeShopABI.networks[networkIdString];

                if (!deployedNetwork) {
                    throw new Error('Контракт не развернут в текущей сети. Убедитесь, что вы подключены к правильной сети.');
                }

                const knifeShopInstance = new web3Instance.eth.Contract(
                    KnifeShopABI.abi,
                    deployedNetwork.address || KNIFE_SHOP_ADDRESS
                ) as Contract<KnifeShopAbi>;

                // Обновляем состояние
                setWeb3(web3Instance);
                setAccounts(userAccounts);
                setKnifeShopContract(knifeShopInstance);
                setConnected(true);
                setError(null);

                // Слушаем событие изменения аккаунтов
                window.ethereum.on('accountsChanged', (newAccounts: string[]) => {
                    setAccounts(newAccounts);
                    if (newAccounts.length === 0) {
                        setConnected(false);
                    }
                });

                // Слушаем событие изменения сети
                window.ethereum.on('chainChanged', () => {
                    window.location.reload();
                });

            } else {
                throw new Error('MetaMask не установлен. Пожалуйста, установите MetaMask для использования этого приложения.');
            }
        } catch (err: any) {
            console.error('Ошибка подключения к MetaMask:', err);
            setError(err.message || 'Произошла ошибка при подключении к кошельку');
            setConnected(false);
        } finally {
            setLoading(false);
        }
    };

    // Пытаемся подключиться автоматически при загрузке приложения
    useEffect(() => {
        const autoConnect = async () => {
            if (window.ethereum) {
                try {
                    // Проверяем, есть ли уже разрешение на доступ к аккаунтам
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    if (accounts.length > 0) {
                        connectWallet(); // Если есть разрешение, подключаемся
                    } else {
                        setLoading(false); // Иначе просто убираем загрузку
                    }
                } catch (error) {
                    console.error('Ошибка автоподключения:', error);
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        autoConnect();
    }, []);

    const contextValue: Web3ContextType = {
        web3,
        accounts,
        knifeShopContract,
        connected,
        loading,
        error,
        connectWallet,
    };

    return (
        <Web3Context.Provider value={contextValue}>
            {children}
        </Web3Context.Provider>
    );
};

// Хук для использования Web3 контекста
export const useWeb3 = () => useContext(Web3Context);
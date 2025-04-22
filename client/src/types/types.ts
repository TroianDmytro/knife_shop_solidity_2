// client/src/types.ts
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { KnifeShopAbi } from './contract-types';

// Тип для ножа
export interface Knife {
    id: number;
    name: string;
    description: string;
    imageUrl: string;
    price: string; // Цена в Wei (строка для BigNumber)
    stock: number;
    isAvailable: boolean;
}

// Тип для корзины
export interface CartItem {
    knife: Knife;
    quantity: number;
}

// Тип для заказа
export interface Order {
    id: string;
    items: CartItem[];
    totalPrice: string;
    timestamp: number;
    transactionHash: string;
}

// Тип для пользователя
export interface User {
    address: string;
    orders: Order[];
}

export interface Web3ContextType {
    web3: Web3 | null;
    accounts: string[];
    knifeShopContract: Contract<KnifeShopAbi> | null;
    connected: boolean;
    loading: boolean;
    error: string | null;
    connectWallet: () => Promise<void>;
}
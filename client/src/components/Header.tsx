import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';

interface HeaderProps {
    cartItemsCount: number;
    toggleCart: () => void;
    toggleAdmin: () => void;
}

const Header: React.FC<HeaderProps> = ({ cartItemsCount, toggleCart, toggleAdmin }) => {
    const { connected, accounts, connectWallet, loading } = useWeb3();

    // Сокращаем адрес кошелька для отображения
    const shortenedAddress = connected && accounts.length > 0
        ? `${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`
        : '';

    return (
        <header className="header">
            <div className="logo">
                <h1>Магазин ножей на блокчейне</h1>
            </div>

            <nav className="nav">
                <button className="nav-btn" onClick={() => window.location.reload()}>
                    Главная
                </button>
                <button className="nav-btn" onClick={toggleAdmin}>
                    Администрирование
                </button>
            </nav>

            <div className="header-actions">
                {connected ? (
                    <>
                        <div className="wallet-info">
                            <span className="wallet-address" title={accounts[0]}>
                                {shortenedAddress}
                            </span>
                        </div>

                        <button
                            className="cart-btn"
                            onClick={toggleCart}
                        >
                            Корзина {cartItemsCount > 0 && <span className="cart-badge">{cartItemsCount}</span>}
                        </button>
                    </>
                ) : (
                    <button
                        className="connect-wallet-btn"
                        onClick={connectWallet}
                        disabled={loading}
                    >
                        {loading ? 'Подключение...' : 'Подключить кошелек'}
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
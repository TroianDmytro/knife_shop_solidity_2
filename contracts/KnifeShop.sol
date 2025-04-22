// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract KnifeShop {
    // Структура для хранения информации о ноже
    struct Knife {
        uint256 id;
        string name;
        string description;
        string imageUrl;
        uint256 price;
        uint256 stock;
        bool isAvailable;
    }

    // Владелец магазина
    address public owner;

    // Счетчик ножей
    uint256 private nextKnifeId;

    // Хранилище ножей по id
    mapping(uint256 => Knife) public knives;

    // Маппинг для отслеживания заказов пользователей
    mapping(address => mapping(uint256 => uint256)) public userOrders; // user -> knifeId -> quantity

    // События
    event KnifeAdded(
        uint256 knifeId,
        string name,
        uint256 price,
        uint256 stock
    );
    event KnifePurchased(
        address buyer,
        uint256 knifeId,
        uint256 quantity,
        uint256 totalPrice
    );
    event StockUpdated(uint256 knifeId, uint256 newStock);

    // Модификатор для проверки владельца
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    // Конструктор
    constructor() {
        owner = msg.sender;
        nextKnifeId = 1;
    }

    // Функция для добавления нового ножа (только владелец)
    function addKnife(
        string memory _name,
        string memory _description,
        string memory _imageUrl,
        uint256 _price,
        uint256 _stock
    ) public onlyOwner {
        uint256 knifeId = nextKnifeId;

        knives[knifeId] = Knife({
            id: knifeId,
            name: _name,
            description: _description,
            imageUrl: _imageUrl,
            price: _price,
            stock: _stock,
            isAvailable: true
        });

        nextKnifeId++;

        emit KnifeAdded(knifeId, _name, _price, _stock);
    }

    // Функция для обновления информации о ноже (только владелец)
    function updateKnife(
        uint256 _knifeId,
        string memory _name,
        string memory _description,
        string memory _imageUrl,
        uint256 _price,
        uint256 _stock,
        bool _isAvailable
    ) public onlyOwner {
        require(_knifeId > 0 && _knifeId < nextKnifeId, "Invalid knife ID");

        Knife storage knife = knives[_knifeId];

        knife.name = _name;
        knife.description = _description;
        knife.imageUrl = _imageUrl;
        knife.price = _price;
        knife.stock = _stock;
        knife.isAvailable = _isAvailable;

        emit StockUpdated(_knifeId, _stock);
    }

    // Функция для покупки ножа
    function purchaseKnife(uint256 _knifeId, uint256 _quantity) public payable {
        require(_knifeId > 0 && _knifeId < nextKnifeId, "Invalid knife ID");

        Knife storage knife = knives[_knifeId];

        require(knife.isAvailable, "Knife is not available for purchase");
        require(knife.stock >= _quantity, "Insufficient stock");

        uint256 totalPrice = knife.price * _quantity;
        require(msg.value >= totalPrice, "Insufficient funds sent");

        // Обновляем запасы
        knife.stock -= _quantity;

        // Записываем заказ пользователя
        userOrders[msg.sender][_knifeId] += _quantity;

        // Возвращаем излишки средств, если они есть
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }

        // Перечисляем средства владельцу магазина
        payable(owner).transfer(totalPrice);

        emit KnifePurchased(msg.sender, _knifeId, _quantity, totalPrice);
        emit StockUpdated(_knifeId, knife.stock);
    }

    // Функция для получения общего количества типов ножей в магазине
    function getKnifeCount() public view returns (uint256) {
        return nextKnifeId - 1;
    }

    // Функция для получения информации о ноже
    function getKnife(
        uint256 _knifeId
    )
        public
        view
        returns (
            uint256 id,
            string memory name,
            string memory description,
            string memory imageUrl,
            uint256 price,
            uint256 stock,
            bool isAvailable
        )
    {
        require(_knifeId > 0 && _knifeId < nextKnifeId, "Invalid knife ID");

        Knife storage knife = knives[_knifeId];

        return (
            knife.id,
            knife.name,
            knife.description,
            knife.imageUrl,
            knife.price,
            knife.stock,
            knife.isAvailable
        );
    }

    // Функция для проверки количества заказов пользователя
    function getUserOrderQuantity(
        address _user,
        uint256 _knifeId
    ) public view returns (uint256) {
        return userOrders[_user][_knifeId];
    }
}

const KnifeShop = artifacts.require("KnifeShop");
const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');

contract("KnifeShop", accounts => {
    const owner = accounts[0];
    const buyer = accounts[1];
    const nonOwner = accounts[2];

    let knifeShopInstance;

    beforeEach(async () => {
        knifeShopInstance = await KnifeShop.new({ from: owner });
    });

    describe("Базовые функции владельца", () => {
        it("должен установить правильного владельца", async () => {
            const contractOwner = await knifeShopInstance.owner();
            assert.equal(contractOwner, owner, "Владелец контракта установлен неправильно");
        });

        it("должен позволить владельцу добавить нож", async () => {
            const result = await knifeShopInstance.addKnife(
                "Охотничий нож",
                "Острый нож для охоты",
                "https://example.com/hunting-knife.jpg",
                web3.utils.toWei("0.1", "ether"),
                10,
                { from: owner }
            );

            // Проверяем событие
            expectEvent(result, 'KnifeAdded', {
                knifeId: new BN(1),
                name: "Охотничий нож",
                price: web3.utils.toWei("0.1", "ether"),
                stock: new BN(10)
            });

            // Проверяем, что нож действительно добавлен
            const knife = await knifeShopInstance.getKnife(1);
            assert.equal(knife.name, "Охотничий нож", "Имя ножа записано неправильно");
        });

        it("не должен позволить не-владельцу добавить нож", async () => {
            await expectRevert(
                knifeShopInstance.addKnife(
                    "Охотничий нож",
                    "Острый нож для охоты",
                    "https://example.com/hunting-knife.jpg",
                    web3.utils.toWei("0.1", "ether"),
                    10,
                    { from: nonOwner }
                ),
                "Only owner can call this function"
            );
        });
    });

    describe("Покупка ножей", () => {
        beforeEach(async () => {
            // Добавляем тестовый нож
            await knifeShopInstance.addKnife(
                "Тестовый нож",
                "Нож для тестирования",
                "https://example.com/test-knife.jpg",
                web3.utils.toWei("0.1", "ether"),
                5,
                { from: owner }
            );
        });

        it("должен позволить пользователю купить нож", async () => {
            const knifeId = 1;
            const quantity = 2;
            const price = web3.utils.toWei("0.1", "ether");
            const totalPrice = web3.utils.toWei("0.2", "ether");

            const initialOwnerBalance = new BN(await web3.eth.getBalance(owner));

            const result = await knifeShopInstance.purchaseKnife(
                knifeId,
                quantity,
                { from: buyer, value: totalPrice }
            );

            // Проверяем событие покупки
            expectEvent(result, 'KnifePurchased', {
                buyer: buyer,
                knifeId: new BN(knifeId),
                quantity: new BN(quantity),
                totalPrice: new BN(totalPrice)
            });

            // Проверяем обновление запасов
            const knife = await knifeShopInstance.getKnife(knifeId);
            assert.equal(knife.stock, 3, "Запасы ножа не уменьшились");

            // Проверяем запись заказа пользователя
            const userOrder = await knifeShopInstance.getUserOrderQuantity(buyer, knifeId);
            assert.equal(userOrder, 2, "Заказ пользователя записан неправильно");

            // Проверяем, что владелец получил оплату
            const finalOwnerBalance = new BN(await web3.eth.getBalance(owner));
            assert(finalOwnerBalance.gt(initialOwnerBalance), "Владелец не получил оплату");
        });

        it("не должен позволить купить больше, чем есть в наличии", async () => {
            const knifeId = 1;
            const quantity = 10; // Больше, чем есть в наличии (5)
            const price = web3.utils.toWei("0.1", "ether");
            const totalPrice = web3.utils.toWei("1", "ether");

            await expectRevert(
                knifeShopInstance.purchaseKnife(
                    knifeId,
                    quantity,
                    { from: buyer, value: totalPrice }
                ),
                "Insufficient stock"
            );
        });

        it("не должен позволить купить, если отправлено недостаточно средств", async () => {
            const knifeId = 1;
            const quantity = 2;
            const insufficientPrice = web3.utils.toWei("0.1", "ether"); // Нужно 0.2 эфира

            await expectRevert(
                knifeShopInstance.purchaseKnife(
                    knifeId,
                    quantity,
                    { from: buyer, value: insufficientPrice }
                ),
                "Insufficient funds sent"
            );
        });
    });
});
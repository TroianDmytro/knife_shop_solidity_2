const KnifeShop = artifacts.require("KnifeShop");

module.exports = function (deployer) {
    deployer.deploy(KnifeShop);
};
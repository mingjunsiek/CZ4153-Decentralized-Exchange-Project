let ExchangeV2 = artifacts.require("exchangev2");
let SCSE = artifacts.require("SCSE");
let MAE = artifacts.require("MAE");
let EEE = artifacts.require("EEE");
let WETH = artifacts.require("WETH");

module.exports = async function (deployer) {
  let deploySCSE = await deployer.deploy(SCSE);
  let deployEEE = await deployer.deploy(EEE);
  let deployMAE = await deployer.deploy(MAE);
  let deployWETH = await deployer.deploy(WETH);
  let deployExchange = await deployer.deploy(ExchangeV2);

  // deployer
  //   .deploy(SCSE)
  //   .then(() => SCSE.deployed())
  //   .then(() => deployer.deploy(ExchangeV2));
};

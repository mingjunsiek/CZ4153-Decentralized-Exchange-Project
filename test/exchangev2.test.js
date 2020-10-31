const {assert} = require("chai");

const Exchange = artifacts.require("exchangev2");
const SCSEToken = artifacts.require("SCSE");
const MAEToken = artifacts.require("MAE");
const EEEToken = artifacts.require("EEE");
const WETHToken = artifacts.require("WETH");

require("chai").use(require("chai-as-promised")).should();

function tokens(n) {
  return web3.utils.toWei(n, "ether");
}

function toEther(n) {
  return web3.utils.fromWei(n, "ether");
}

async function approveToken(sender, exchange, token, amount) {
  const result = await token.approve(sender, exchange.address, tokens(amount), {
    from: sender,
  });
  const {logs} = result;
  assert.ok(Array.isArray(logs));
  assert.equal(logs.length, 1);
  const log = logs[0];
  assert.equal(log.event, "Approval");
  assert.equal(log.args._owner.toString(), sender);
  assert.equal(log.args._spender.toString(), exchange.address);
  assert.equal(log.args._value.toString(), tokens(amount));
}

contract("Exchange", (accounts) => {
  let scseToken, eeeToken, maeToken, wethToken, exchange;
  let owner = accounts[0];

  before(async () => {
    // Load Contracts
    scseToken = await SCSEToken.new();
    maeToken = await MAEToken.new();
    eeeToken = await EEEToken.new();
    wethToken = await WETHToken.new();
    exchange = await Exchange.new();
  });

  // Token successfully deployed
  describe("SCSE Token Deployment", async () => {
    it("has a name", async () => {
      const name = await scseToken.name();
      assert.equal(name, "NTU SCSE Coin");
    });
  });

  // Token successfully deployed
  describe("MAE Token Deployment", async () => {
    it("has a name", async () => {
      const name = await maeToken.name();
      assert.equal(name, "NTU MAE Coin");
    });
  });

  // Token successfully deployed
  describe("EEE Token Deployment", async () => {
    it("has a name", async () => {
      const name = await eeeToken.name();
      assert.equal(name, "NTU EEE Coin");
    });
  });

  // Token successfully deployed
  describe("WETH Token Deployment", async () => {
    it("has a name", async () => {
      const name = await wethToken.name();
      assert.equal(name, "Wrapped Ethereum");
    });
  });

  // Swap ETH to WETH
  describe("Swap ETH to WETH", async () => {
    it("can swap ETH to WETH", async () => {
      const result = await exchange.ethToWethSwap(wethToken.address, {
        value: tokens("5"),
        from: owner,
      });

      const wethBalance = await wethToken.balanceOf(owner);
      assert.equal(wethBalance, tokens("5"));
    });
  });

  // Swap WETH to ETH
  describe("Swap WETH to ETH", async () => {
    it("can swap WETH to ETH", async () => {
      const initialBalance = await web3.eth.getBalance(owner);
      const result = await exchange.wethToEthSwap(
        wethToken.address,
        tokens("5")
      );
      const currentBalance = await web3.eth.getBalance(owner);
      const wethBalance = await wethToken.balanceOf(owner);

      assert.equal(wethBalance.toString(), "0");

      assert.isBelow(parseInt(initialBalance), parseInt(currentBalance));
    });
  });

  // Approve Exchange to move owner's fund
  describe("Approve Exchange To Move Funds", async () => {
    it("can move", async () => {
      await approveToken(owner, exchange, scseToken, "100");
    });
  });

  // Check if exchange is in approved list
  describe("Inside approve list", async () => {
    it("is approved", async () => {
      const result = await scseToken.allowance(owner, exchange.address);
      assert.equal(result.toString(), tokens("100"));
    });
  });

  describe("Insert into Sell Book (limit)", async () => {
    let price = tokens("0.1");
    let amt = tokens("100");

    it("able to insert into sell order book (limit)", async () => {
      let result = await exchange.sellTokenLimit(
        wethToken.address,
        scseToken.address,
        price,
        amt
      );
      result = await exchange.getSellOrders(scseToken.address);
      assert.equal(result[0][0].toString(), price);
      assert.equal(result[1][0].toString(), amt);
    });
  });

  describe("Insert into Buy Book (limit)", async () => {
    let orderPrice = tokens("0.05");
    let orderAmt = tokens("3");
    let totalPrice = (orderAmt * orderPrice) / 1e18;

    it("able to swap to weth (limit)", async () => {
      const result = await exchange.ethToWethSwap(wethToken.address, {
        value: totalPrice,
        from: accounts[1],
      });

      const wethBalance = await wethToken.balanceOf(accounts[1]);
      assert.equal(wethBalance, totalPrice);
    });

    it("approve exchange to move funds", async () => {
      await approveToken(
        accounts[1],
        exchange,
        wethToken,
        totalPrice.toString()
      );
    });

    it("able to insert into buy order book (limit)", async () => {
      await exchange.buyTokenLimit(
        wethToken.address,
        scseToken.address,
        orderPrice,
        orderAmt,
        {
          from: accounts[1],
        }
      );
      result = await exchange.getBuyOrders(scseToken.address);

      assert.equal(result[0][0].toString(), orderPrice);
      assert.equal(result[1][0].toString(), orderAmt);
    });
  });

  describe("Purchase token in sell book (limit)", async () => {
    let orderAmt = tokens("3");
    let orderPrice = tokens("0.1");
    let totalPrice = (orderAmt * orderPrice) / 1e18;
    let beforeWethBalance = 0;
    let beforeTokenBalance = 0;

    it("able to swap to weth (limit)", async () => {
      beforeWethBalance = await wethToken.balanceOf(accounts[1]);
      const result = await exchange.ethToWethSwap(wethToken.address, {
        value: totalPrice,
        from: accounts[1],
      });

      const wethBalance = await wethToken.balanceOf(accounts[1]);
      assert.equal(wethBalance, parseInt(beforeWethBalance) + totalPrice);
      beforeWethBalance = wethBalance;
    });

    it("approve exchange to move funds", async () => {
      await approveToken(
        accounts[1],
        exchange,
        wethToken,
        totalPrice.toString()
      );
    });

    it("able to purchase token in sell book (limit)", async () => {
      beforeTokenBalance = await scseToken.balanceOf(owner);

      await exchange.buyTokenLimit(
        wethToken.address,
        scseToken.address,
        orderPrice,
        orderAmt,
        {
          from: accounts[1],
        }
      );

      //check only have 1 order in buy book
      result = await exchange.getBuyOrders(scseToken.address);
      assert.equal(result[0][0].toString(), tokens("0.05"));
      assert.equal(result[1][0].toString(), tokens("3"));

      assert.equal(result[0].length, 1);
      assert.equal(result[1].length, 1);

      result = await exchange.getSellOrders(scseToken.address);

      assert.equal(result[0][0].toString(), tokens("0.1"));
      assert.equal(result[1][0].toString(), tokens("97"));
    });

    it("weth deducted", async () => {
      const wethBalance = await wethToken.balanceOf(accounts[1]);
      assert.equal(wethBalance, beforeWethBalance - totalPrice);
    });

    it("received weth", async () => {
      const balance = await wethToken.balanceOf(owner);
      assert.equal(balance.toString(), totalPrice.toString());
    });

    it("tokens deducted", async () => {
      const balance = await scseToken.balanceOf(owner);
      assert.equal(balance.toString(), beforeTokenBalance - orderAmt);
    });

    it("received tokens", async () => {
      const balance = await scseToken.balanceOf(accounts[1]);
      assert.equal(balance.toString(), orderAmt.toString());
    });
  });

  describe("Purchase token in sell book (market)", async () => {
    let orderAmt = tokens("1");

    it("able to purchase token in sell book (market)", async () => {
      beforeTokenBalance = await scseToken.balanceOf(owner);
      beforeWethBalance = await wethToken.balanceOf(accounts[1]);

      const result = await exchange.buyTokenMarket(
        wethToken.address,
        scseToken.address,
        orderAmt,
        {
          from: accounts[1],
        }
      );

      afterTokenBalance = await scseToken.balanceOf(owner);
      afterWethBalance = await wethToken.balanceOf(accounts[1]);
      assert.equal(afterTokenBalance, beforeTokenBalance - orderAmt);

      const {logs} = result;
      assert.ok(Array.isArray(logs));
      assert.equal(logs.length, 1);
      const log = logs[0];

      assert.equal(log.event, "BuyMarketResult");
      assert.equal(log.args.fulfilled, true);
      assert.equal(log.args.insufficientEth, false);
      assert.equal(log.args.insufficientOrder, false);
    });
  });

  // async function buyToken(baseToken, token, amt, price, maker) {
  //   await exchange.buyTokenLimit(baseToken.address, token.address, amt, price, {
  //     from: maker,
  //   });
  // }
  // // user depositing more than alloance
  // describe("User depositing more than allowed", async () => {
  //   it("unable to deposit", async () => {
  //     try {
  //       const result = await exchange.depositToken(
  //         scseToken.address,
  //         tokens("10000000")
  //       );
  //     } catch (error) {
  //       assert.notEqual(error, undefined, "Error must be thrown");
  //       assert.isAbove(
  //         error.message.search(
  //           "VM Exception while processing transaction: revert"
  //         ),
  //         -1,
  //         "Error: VM Exception while processing transaction: revert"
  //       );
  //     }
  //   });
  // });

  // // user depositing <= allowance
  // describe("User depositing <= allowed", async () => {
  //   it("able to deposit", async () => {
  //     let result = await exchange.depositToken(
  //       scseToken.address,
  //       tokens("1000000")
  //     );

  //     result = await scseToken.balanceOf(owner);
  //     assert.equal(result.toString(), tokens("0"));

  //     const tokenBalance = await exchange.retrieveTokenBalance([
  //       scseToken.address,
  //     ]);
  //     assert.equal(tokenBalance[0].toString(), tokens("1000000"));
  //   });
  // });

  // // user depositing <= allowance
  // describe("Selling of tokens (limit)", async () => {
  //   it("able to sell (limit)", async () => {
  //     let result = await exchange.sellTokenLimit(
  //       scseToken.address,
  //       tokens("0.1"),
  //       tokens("5")
  //     );

  //     const tokenBalance = await exchange.retrieveTokenBalance([
  //       scseToken.address,
  //     ]);
  //     assert.equal(tokenBalance[0].toString(), tokens("999995"));
  //   });

  //   it("inserted into sell order(limit)", async () => {
  //     const result = await exchange.getSellOrders(scseToken.address);

  //     assert.equal(result[0][0].toString(), tokens("0.1"));
  //     assert.equal(result[1][0].toString(), tokens("5"));
  //   });
  // });
});

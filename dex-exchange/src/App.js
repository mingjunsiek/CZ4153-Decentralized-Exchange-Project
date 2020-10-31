import React, {Component} from "react";
import Web3 from "web3";
import Navbar from "./Navbar";
import Main from "./Main";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

import WETHToken from "./abis/WETH.json";
import EEEToken from "./abis/EEE.json";
import MAEToken from "./abis/MAE.json";
import SCSEToken from "./abis/SCSE.json";
import Exchange from "./abis/exchangev2.json";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      account: "0x0",
      scseTokenW3: {},
      wethTokenW3: {},
      eeeTokenW3: {},
      maeTokenW3: {},
      exchangev2W3: {},
      userWallet: {
        scseTokenBalance: "0",
        maeTokenBalance: "0",
        eeeTokenBalance: "0",
        wethTokenBalance: "0",
        ethTokenBalance: "0",
      },
      loading: true,
    };
  }
  async componentWillMount() {
    await this.loadWeb3();
    await this.loadBlockChainData();
    await this.loadCurrentPage();
  }

  async loadBlockChainData() {
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    this.setState({account: accounts[0]});
    const networkId = await web3.eth.net.getId();
    console.log(networkId);
    const wethTokenData = WETHToken.networks[networkId];
    const scseTokenData = SCSEToken.networks[networkId];
    const maeTokenData = MAEToken.networks[networkId];
    const eeeTokenData = EEEToken.networks[networkId];
    const exchangeData = Exchange.networks[networkId];

    if (wethTokenData) {
      const wethTokenW3 = new web3.eth.Contract(
        WETHToken.abi,
        wethTokenData.address
      );
      this.setState({wethTokenW3});
      let wethTokenBalance = await wethTokenW3.methods
        .balanceOf(this.state.account)
        .call();
      this.setState((prevState) => ({
        userWallet: {
          ...prevState.userWallet,
          wethTokenBalance: wethTokenBalance.toString(),
        },
      }));
    } else {
      window.alert("WETHToken contract not deployed to detected network");
    }

    if (scseTokenData) {
      const scseTokenW3 = new web3.eth.Contract(
        SCSEToken.abi,
        scseTokenData.address
      );
      this.setState({scseTokenW3});
      let scseTokenBalance = await scseTokenW3.methods
        .balanceOf(this.state.account)
        .call();

      this.setState((prevState) => ({
        userWallet: {
          ...prevState.userWallet,
          scseTokenBalance: scseTokenBalance.toString(),
        },
      }));
    } else {
      window.alert("SCSEToken contract not deployed to detected network");
    }

    if (maeTokenData) {
      const maeTokenW3 = new web3.eth.Contract(
        MAEToken.abi,
        maeTokenData.address
      );
      this.setState({maeTokenW3});
      let maeTokenBalance = await maeTokenW3.methods
        .balanceOf(this.state.account)
        .call();

      this.setState((prevState) => ({
        userWallet: {
          ...prevState.userWallet,
          maeTokenBalance: maeTokenBalance.toString(),
        },
      }));
    } else {
      window.alert("MAEToken contract not deployed to detected network");
    }

    if (eeeTokenData) {
      const eeeTokenW3 = new web3.eth.Contract(
        EEEToken.abi,
        eeeTokenData.address
      );
      this.setState({eeeTokenW3});
      let eeeTokenBalance = await eeeTokenW3.methods
        .balanceOf(this.state.account)
        .call();

      this.setState((prevState) => ({
        userWallet: {
          ...prevState.userWallet,
          eeeTokenBalance: eeeTokenBalance.toString(),
        },
      }));
    } else {
      window.alert("SCSEToken contract not deployed to detected network");
    }

    if (exchangeData) {
      const exchangev2W3 = new web3.eth.Contract(
        Exchange.abi,
        exchangeData.address
      );

      this.setState({exchangev2W3});

      let ethTokenBalance = await web3.eth.getBalance(accounts[0]);

      this.setState((prevState) => ({
        userWallet: {
          ...prevState.userWallet,
          ethTokenBalance: ethTokenBalance.toString(),
        },
      }));
    } else {
      window.alert("ExchangeV2 contract not deployed to detected network");
    }

    this.setState({loading: false});
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
      window.ethereum.on("accountsChanged", function () {
        window.web3.eth.getAccounts(function (error, accounts) {
          window.location.reload();
        });
      });
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
  }

  async loadCurrentPage() {
    this.setState({currentTradingPair: "WETH/SCSE"});
  }

  ethToWethSwap = async (amount) => {
    this.setState({loading: true});
    await this.state.exchangev2W3.methods
      .ethToWethSwap(this.state.wethTokenW3._address)
      .send({from: this.state.account, value: amount})
      .on("error", (error) => {
        if (error.message.includes("User denied transaction signature")) {
          this.setState({loading: false});
        }
      })
      .on("transactionHash", (hash) => {});
    window.location.reload();
  };

  wethToEthSwap = async (amount) => {
    this.setState({loading: true});
    await this.state.exchangev2W3.methods
      .wethToEthSwap(this.state.wethTokenW3._address, amount)
      .send({from: this.state.account})
      .on("transactionHash", (hash) => {})
      .on("error", (error) => {
        if (error.message.includes("User denied transaction signature")) {
          this.setState({loading: false});
        }
      });
    window.location.reload();
  };

  sellTokenMarket = async (tokenW3, amount) => {
    this.setState({loading: true});
    let transaction = await this.state.exchangev2W3.methods
      .sellTokenMarket(
        this.state.wethTokenW3._address,
        tokenW3._address,
        amount
      )
      .send({from: this.state.account})
      .on("transactionHash", (hash) => {})
      .on("error", (error) => {
        if (error.message.includes("User denied transaction signature")) {
          this.setState({loading: false});
        }
      });
    this.setState({loading: false});
    let transactionEvent = transaction.events.SellMarketResult.returnValues;
    console.log(transaction);
    let eventMessage = "";
    if (transactionEvent.fulfilled)
      eventMessage += "Market Order fully filled\n";
    if (transactionEvent.insufficientToken)
      eventMessage += "You have insufficient Tokens\n";
    if (transactionEvent.insufficientOrder)
      eventMessage += "There are insufficient orders\n";
    alert(eventMessage);
    window.location.reload();
  };

  buyTokenMarket = async (tokenW3, amount) => {
    this.setState({loading: true});
    // let info = await this.state.exchangev2W3.methods
    //   .retrievePriceInfo(tokenW3._address)
    //   .call({from: this.state.account});
    // console.log(info);
    let transaction = await this.state.exchangev2W3.methods
      .buyTokenMarket(this.state.wethTokenW3._address, tokenW3._address, amount)
      .send({from: this.state.account})
      .on("transactionHash", (hash) => {})
      .on("error", (error) => {
        if (error.message.includes("User denied transaction signature")) {
          this.setState({loading: false});
        }
      });

    this.setState({loading: false});
    let transactionEvent = transaction.events.BuyMarketResult.returnValues;
    let eventMessage = "";
    if (transactionEvent.fulfilled)
      eventMessage += "Market Order fully filled\n";
    if (transactionEvent.insufficientEth)
      eventMessage += "You have insufficient WETH\n";
    if (transactionEvent.insufficientOrder)
      eventMessage += "There are insufficient orders\n";
    alert(eventMessage);
    window.location.reload();
  };

  sellTokenLimit = async (tokenW3, price, amount) => {
    this.setState({loading: true});
    let approveTx = await tokenW3.methods
      .approve(this.state.account, this.state.exchangev2W3._address, amount)
      .send({from: this.state.account})
      .on("transactionHash", (hash) => {})
      .on("error", (error) => {
        if (error.message.includes("User denied transaction signature")) {
          this.setState({loading: false});
        }
      });
    let transactionEvent = approveTx.events.Approval.returnValues;
    console.log(transactionEvent);
    await this.state.exchangev2W3.methods
      .sellTokenLimit(
        this.state.wethTokenW3._address,
        tokenW3._address,
        price,
        amount
      )
      .send({from: this.state.account})
      .on("transactionHash", (hash) => {})
      .on("error", (error) => {
        if (error.message.includes("User denied transaction signature")) {
          this.setState({loading: false});
        }
      });
    window.location.reload();
  };

  buyTokenLimit = async (tokenW3, price, amount) => {
    this.setState({loading: true});
    await this.state.wethTokenW3.methods
      .approve(this.state.account, this.state.exchangev2W3._address, amount)
      .send({from: this.state.account})
      .on("transactionHash", async (hash) => {})
      .on("error", (error) => {
        if (error.message.includes("User denied transaction signature")) {
          this.setState({loading: false});
        }
      });
    await this.state.exchangev2W3.methods
      .buyTokenLimit(
        this.state.wethTokenW3._address,
        tokenW3._address,
        price,
        amount
      )
      .send({from: this.state.account})
      .on("transactionHash", (hash) => {})
      .on("error", (error) => {
        if (error.message.includes("User denied transaction signature")) {
          this.setState({loading: false});
        }
      });
    window.location.reload();
  };

  removeOrder = async (tokenW3, isSellOrder, price) => {
    this.setState({loading: true});
    await this.state.exchangev2W3.methods
      .removeOrder(
        this.state.wethTokenW3._address,
        tokenW3._address,
        isSellOrder,
        price
      )
      .send({from: this.state.account})
      .on("transactionHash", (hash) => {})
      .on("error", (error) => {
        if (error.message.includes("User denied transaction signature")) {
          this.setState({loading: false});
        }
      });

    this.setState({loading: false});
  };

  render() {
    let content;
    if (this.state.loading) {
      content = (
        <p id="loader" className="text-center">
          Loading...
        </p>
      );
    } else {
      content = (
        <Main
          appState={this.state}
          sellTokenLimit={this.sellTokenLimit}
          buyTokenLimit={this.buyTokenLimit}
          ethToWethSwap={this.ethToWethSwap}
          wethToEthSwap={this.wethToEthSwap}
          removeOrder={this.removeOrder}
          buyTokenMarket={this.buyTokenMarket}
          sellTokenMarket={this.sellTokenMarket}
        />
      );
    }
    return (
      <div>
        <Navbar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 ml-auto mr-auto">
              <div className="content mr-auto ml-auto">{content}</div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;

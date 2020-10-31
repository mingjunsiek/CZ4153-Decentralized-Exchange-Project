import React, {Component} from "react";
import OrderBook from "./OrderBook";
import UserOrders from "./UserOrders";
import TransactionOrders from "./TransactionOrders";
import Balances from "./Balances";
import {Col} from "react-bootstrap";
import {Row} from "react-bootstrap";
import Button from "react-bootstrap/Button";

class Main extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentTradingPair: "WETH/SCSE",
      currentTokenSymbol: "SCSE",
      baseToken: this.props.appState.wethTokenW3,
      token: this.props.appState.scseTokenW3,
      baseTokenBalance: this.props.appState.userWallet.wethTokenBalance,
      tokenBalance: this.props.appState.userWallet.scseTokenBalance,
      transactionType: "Market",
      userWallet: this.props.appState.userWallet,
    };
    this.buyOrderBookElement = React.createRef();
    this.sellOrderBookElement = React.createRef();
    this.buyTradingPairElement = React.createRef();
    this.sellTradingPairElement = React.createRef();
    this.buyUserOrderElement = React.createRef();
    this.sellUserOrderElement = React.createRef();
  }

  changeTradingPair(tradingPair) {
    let newTradingPair = "";
    let newTokenSymbol = "";
    let newToken;
    let newTokenBalance;

    switch (tradingPair) {
      case "SCSE":
        newTradingPair = "WETH/SCSE";
        newTokenSymbol = "SCSE";
        newToken = this.props.appState.scseTokenW3;
        newTokenBalance = this.state.userWallet.scseTokenBalance;
        break;
      case "MAE":
        newTradingPair = "WETH/MAE";
        newTokenSymbol = "MAE";
        newToken = this.props.appState.maeTokenW3;
        newTokenBalance = this.state.userWallet.maeTokenBalance;
        break;
      case "EEE":
        newTradingPair = "WETH/EEE";
        newTokenSymbol = "EEE";
        newToken = this.props.appState.eeeTokenW3;
        newTokenBalance = this.state.userWallet.eeeTokenBalance;
        break;
      default:
        console.log("Changing Trading Pair Error");
    }

    this.setState({
      currentTradingPair: newTradingPair,
      currentTokenSymbol: newTokenSymbol,
      token: newToken,
      tokenBalance: newTokenBalance,
    });

    this.buyOrderBookElement.current.updateOrderBook(newToken);
    this.sellOrderBookElement.current.updateOrderBook(newToken);
    this.buyTradingPairElement.current.updateTradingPair(
      newToken,
      newTokenBalance
    );
    this.sellTradingPairElement.current.updateTradingPair(
      newToken,
      newTokenBalance
    );
    this.buyUserOrderElement.current.updateUserOrders(newToken);
    this.sellUserOrderElement.current.updateUserOrders(newToken);
  }

  changeTransactionType() {
    let newTransactionType = "";
    const oldTransactionType = this.state.transactionType;
    if (this.state.transactionType === "Market") newTransactionType = "Limit";
    else if (this.state.transactionType === "Limit")
      newTransactionType = "Market";

    this.setState({
      transactionType: newTransactionType,
    });
    this.buyTradingPairElement.current.updateTransactionType(
      oldTransactionType
    );
    this.sellTradingPairElement.current.updateTransactionType(
      oldTransactionType
    );
  }

  render() {
    return (
      <div id="content" className="mt-3 w-75 p-3 ml-auto mr-auto">
        <div className="card mb-4">
          <div className="card-body ">
            <Row>
              <Col>
                <Button
                  variant="light"
                  onClick={() => {
                    this.changeTradingPair("SCSE");
                  }}
                >
                  WETH/SCSE
                </Button>
              </Col>
              <Col>
                <Button
                  variant="light"
                  onClick={() => {
                    this.changeTradingPair("MAE");
                  }}
                >
                  WETH/MAE
                </Button>
              </Col>
              <Col>
                <Button
                  variant="light"
                  onClick={() => {
                    this.changeTradingPair("EEE");
                  }}
                >
                  WETH/EEE
                </Button>
              </Col>
            </Row>
          </div>
        </div>
        <Balances
          userWallet={this.state.userWallet}
          ethToWethSwap={this.props.ethToWethSwap}
          wethToEthSwap={this.props.wethToEthSwap}
          userApproval={this.props.appState.userApproval}
        />
        <div className="card mb-4">
          <div className="card-body">
            <Row className="px-4 mb-2">
              <Col>
                <label>
                  <b>{this.state.currentTradingPair} Trading Pair</b>
                </label>
              </Col>
              <Col>
                <Button
                  variant="primary"
                  onClick={() => {
                    this.changeTransactionType();
                  }}
                >
                  {this.state.transactionType}
                </Button>
              </Col>
            </Row>
            <Row>
              <Col>
                <div className="card mb-4">
                  <div className="card-body">
                    <TransactionOrders
                      ref={this.buyTradingPairElement}
                      orderType={"Buy"}
                      baseTokenW3={this.state.baseToken}
                      tokenW3={this.state.token}
                      baseTokenBalance={this.state.baseTokenBalance}
                      tokenBalance={this.state.tokenBalance}
                      currentTokenSymbol={"WETH"}
                      limitOrder={this.props.buyTokenLimit}
                      marketOrder={this.props.buyTokenMarket}
                    />
                  </div>
                </div>
              </Col>
              <Col>
                <div className="card mb-4">
                  <div className="card-body">
                    <TransactionOrders
                      ref={this.sellTradingPairElement}
                      orderType={"Sell"}
                      baseTokenW3={this.state.baseToken}
                      tokenW3={this.state.token}
                      baseTokenBalance={this.state.baseTokenBalance}
                      tokenBalance={this.state.tokenBalance}
                      currentTokenSymbol={this.state.currentTokenSymbol}
                      limitOrder={this.props.sellTokenLimit}
                      marketOrder={this.props.sellTokenMarket}
                    />
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-body">
            <Row className="mb-4">
              <Col>
                <b>Buy Book</b>
              </Col>
              <Col>
                <b>Sell Book</b>
              </Col>
            </Row>
            <Row>
              <Col>
                <div className="card mb-4">
                  <div className="card-body">
                    <OrderBook
                      ref={this.buyOrderBookElement}
                      exchangeW3={this.props.appState.exchangev2W3}
                      token={this.state.token}
                      orderType={"Buy"}
                    />
                  </div>
                </div>
              </Col>
              <Col>
                <div className="card mb-4">
                  <div className="card-body">
                    <OrderBook
                      ref={this.sellOrderBookElement}
                      exchangeW3={this.props.appState.exchangev2W3}
                      token={this.state.token}
                      orderType={"Sell"}
                    />
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-body">
            <Row className="mb-4">
              <Col>
                <b>Your Buy Orders</b>
              </Col>
              <Col>
                <b>Your Sell Orders</b>
              </Col>
            </Row>
            <Row>
              <Col>
                <div className="card mb-4">
                  <div className="card-body">
                    <UserOrders
                      ref={this.buyUserOrderElement}
                      exchangeW3={this.props.appState.exchangev2W3}
                      token={this.state.token}
                      orderType={"Buy"}
                      currentAccount={this.props.appState.account}
                      removeOrder={this.props.removeOrder}
                    />
                  </div>
                </div>
              </Col>
              <Col>
                <div className="card mb-4">
                  <div className="card-body">
                    <UserOrders
                      ref={this.sellUserOrderElement}
                      exchangeW3={this.props.appState.exchangev2W3}
                      token={this.state.token}
                      orderType={"Sell"}
                      currentAccount={this.props.appState.account}
                      removeOrder={this.props.removeOrder}
                    />
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </div>
    );
  }
}

export default Main;

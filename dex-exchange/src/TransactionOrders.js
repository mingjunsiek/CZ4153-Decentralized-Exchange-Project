import React, {Component} from "react";

class TransactionOrders extends Component {
  constructor(props) {
    super(props);
    this.state = {
      orderType: this.props.orderType,
      baseTokenW3: this.props.baseTokenW3,
      tokenW3: this.props.tokenW3,
      amount: "",
      price: "",
      baseTokenBalance: this.props.baseTokenBalance,
      tokenBalance: this.props.tokenBalance,
      transactionType: "Limit",
      loading: false,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  updateTradingPair(newToken, newTokenBalance) {
    this.setState({
      tokenW3: newToken,
      tokenBalance: newTokenBalance,
    });
  }

  updateTransactionType(newTransactionType) {
    this.setState({
      transactionType: newTransactionType,
    });
  }

  handleChange(event) {
    this.setState({
      [event.target.name]: event.target.value,
    });
  }

  handleSubmit(event) {
    event.preventDefault();

    if (this.state.transactionType === "Limit") {
      if (
        parseFloat(this.state.amount) <= 0 ||
        parseFloat(this.state.price) <= 0
      ) {
        alert("Please input valid values");
      } else {
        const amtInWei = window.web3.utils.toWei(this.state.amount, "Ether");
        const priceInWei = window.web3.utils.toWei(this.state.price, "Ether");

        if (this.props.orderType === "Buy") {
          const totalEth = (parseInt(amtInWei) * parseInt(priceInWei)) / 1e18;
          if (parseInt(totalEth) > parseInt(this.state.baseTokenBalance)) {
            alert("Total Cost exceed WETH balance");
          } else {
            this.props.limitOrder(this.state.tokenW3, priceInWei, amtInWei);
          }
        } else if (this.props.orderType === "Sell") {
          if (parseInt(amtInWei) > parseInt(this.state.tokenBalance)) {
            alert("Token Amount exceed Token Balance");
          } else {
            this.props.limitOrder(this.state.tokenW3, priceInWei, amtInWei);
          }
        }
      }
    } else if (this.state.transactionType === "Market") {
      if (parseFloat(this.state.amount) <= 0) {
        alert("Please input valid values");
      } else {
        const amtInWei = window.web3.utils.toWei(this.state.amount, "Ether");

        if (this.props.orderType === "Buy") {
          if (parseInt(this.state.baseTokenBalance) <= 0) {
            alert("Insufficient WETH Balance");
          } else {
            this.props.marketOrder(this.state.tokenW3, amtInWei);
          }
        } else if (this.props.orderType === "Sell") {
          if (parseInt(amtInWei) > parseInt(this.state.tokenBalance)) {
            alert("Token Amount exceed Token Balance");
          } else {
            this.props.marketOrder(this.state.tokenW3, amtInWei);
          }
        }
      }
    }
  }

  render() {
    let title, balance, limitButton, transactionForm;
    if (this.state.orderType === "Sell") {
      title = "Sell " + this.state.transactionType + " Order";
      balance = window.web3.utils.fromWei(this.state.tokenBalance, "Ether");
      limitButton = (
        <button type="submit" className="btn btn-dark btn-block btn-lg">
          Sell
        </button>
      );
    } else if (this.state.orderType === "Buy") {
      title = "Buy " + this.state.transactionType + " Order";
      balance = window.web3.utils.fromWei(this.state.baseTokenBalance, "Ether");
      limitButton = (
        <button type="submit" className="btn btn-outline-secondary btn-block btn-lg">
          Buy
        </button>
      );
    }

    if (this.state.transactionType === "Limit") {
      transactionForm = (
        <form className="mb-3" onSubmit={this.handleSubmit}>
          <div>
            <label className="float-left">
              <b>{title}</b>
            </label>
            <span className="float-right text-muted">
              Balance: {balance} {this.props.currentTokenSymbol}
            </span>
          </div>
          <div className="input-group mb-4">
            <input
              name="amount"
              type="number"
              step="0.000001"
              onChange={this.handleChange}
              className="form-control form-control-lg"
              placeholder="Amount"
              required
            />
          </div>
          <div className="input-group mb-4">
            <input
              name="price"
              type="number"
              step="0.000001"
              onChange={this.handleChange}
              className="form-control form-control-lg"
              placeholder="Price"
              required
            />
          </div>
          {limitButton}
        </form>
      );
    } else if (this.state.transactionType === "Market") {
      transactionForm = (
        <form className="mb-3" onSubmit={this.handleSubmit}>
          <div>
            <label className="float-left">
              <b>{title}</b>
            </label>
            <span className="float-right text-muted">
              Balance: {balance} {this.props.currentTokenSymbol}
            </span>
          </div>
          <div className="input-group mb-4">
            <input
              name="amount"
              type="number"
              step="0.000001"
              onChange={this.handleChange}
              className="form-control form-control-lg"
              placeholder="Amount"
              required
            />
          </div>
          {limitButton}
        </form>
      );
    }
    let content;
    if (this.state.loading) {
      content = (
        <p id="loader" className="text-center">
          Loading...
        </p>
      );
    } else {
      content = transactionForm;
    }
    return <>{content}</>;
  }
}
export default TransactionOrders;

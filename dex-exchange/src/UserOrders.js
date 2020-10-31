import React, {Component} from "react";
import Button from "react-bootstrap/Button";
import {Col} from "react-bootstrap";
import {Row} from "react-bootstrap";
import Table from "react-bootstrap/Table";

class UserOrders extends Component {
  constructor(props) {
    super(props);
    this.state = {
      order: [],
      loading: true,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.cancelOrder = this.cancelOrder.bind(this);
  }

  handleChange(event) {
    this.setState({
      [event.target.name]: event.target.value,
    });
  }

  handleSubmit(event) {
    event.preventDefault();
  }

  async componentDidMount() {
    await this.loadMain();
  }
  cancelOrder(price) {
    let isSellOrder = false;

    if (this.props.orderType === "Sell") {
      isSellOrder = true;
    }
    let priceInWei = window.web3.utils.toWei(price.toString(), "Ether");
    this.props.removeOrder(this.props.token, isSellOrder, priceInWei);
  }

  async updateUserOrders(newToken) {
    this.setState(
      {
        loading: true,
        token: newToken,
      },
      async () => {
        let exchangeW3 = this.props.exchangeW3;
        let orders;
        if (this.props.orderType === "Buy") {
          orders = await exchangeW3.methods
            .getUserBuyOrders(newToken._address)
            .call({from: this.props.currentAccount});
        } else if (this.props.orderType === "Sell") {
          orders = await exchangeW3.methods
            .getUserSellOrders(newToken._address)
            .call({from: this.props.currentAccount});
        }
        let orderBookPrices = orders[0];
        let orderBookAmount = orders[1];

        let userOrderPrices = orderBookPrices.filter((item) => {
          return parseInt(item) !== 0;
        });

        let userOrderAmount = orderBookAmount.filter((item) => {
          return parseInt(item) !== 0;
        });

        orders[0] = userOrderPrices;
        orders[1] = userOrderAmount;

        this.setState({
          order: orders,
          loading: false,
        });
      }
    );
  }

  async loadMain() {
    this.setState({loading: true});
    let exchangeW3 = this.props.exchangeW3;
    let orders;
    if (this.props.orderType === "Buy") {
      orders = await exchangeW3.methods
        .getUserBuyOrders(this.props.token._address)
        .call({from: this.props.currentAccount});
    } else if (this.props.orderType === "Sell") {
      orders = await exchangeW3.methods
        .getUserSellOrders(this.props.token._address)
        .call({from: this.props.currentAccount});
    }
    let orderBookPrices = orders[0];
    let orderBookAmount = orders[1];

    let userOrderPrices = orderBookPrices.filter((item) => {
      return parseInt(item) !== 0;
    });

    let userOrderAmount = orderBookAmount.filter((item) => {
      return parseInt(item) !== 0;
    });

    orders[0] = userOrderPrices;
    orders[1] = userOrderAmount;

    this.setState({
      order: orders,
      loading: false,
    });
  }

  renderOrderData() {
    const web3 = window.web3;
    let orderBookPrices = this.state.order[0];
    let orderBookAmount = this.state.order[1];
    if (orderBookPrices.length === 0) {
      return <p>{this.props.orderType} Book is Empty</p>;
    } else {
      return orderBookPrices.map((s, index) => {
        const price = web3.utils.fromWei(s, "Ether");
        const amount = web3.utils.fromWei(orderBookAmount[index], "Ether");
        return (
          <>
            <tr>
              <td>{amount}</td>
              <td>{price}</td>
              <td>
                <Button
                  size="sm"
                  onClick={() => {
                    this.cancelOrder(price);
                  }}
                >
                  Cancel
                </Button>
              </td>
            </tr>
          </>
        );
      });
    }
  }

  render() {
    let content;
    if (this.state.loading) {
      content = (
        <div id="loader" className="text-center">
          Loading...
        </div>
      );
    } else if (this.state.order[0].length === 0) {
      content = <p>{this.props.orderType} Orders is Empty</p>;
    } else {
      content = (
        <>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Amount</th>
                <th>Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>{this.renderOrderData()}</tbody>
          </Table>
        </>
      );
    }
    return content;
  }
}
export default UserOrders;

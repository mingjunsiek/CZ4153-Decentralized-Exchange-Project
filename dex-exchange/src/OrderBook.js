import React, {Component} from "react";
import Button from "react-bootstrap/Button";
import {Col} from "react-bootstrap";
import {Row} from "react-bootstrap";
import Table from "react-bootstrap/Table";

class OrderBook extends Component {
  constructor(props) {
    super(props);
    this.state = {
      token: this.props.token,
      exchangeW3: this.props.exchangeW3,
      orderType: this.props.orderType,
      order: [],
      loading: true,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
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

  async updateOrderBook(newToken) {
    this.setState(
      {
        loading: true,
        token: newToken,
      },
      async () => {
        let exchangeW3 = this.state.exchangeW3;
        let orders;
        if (this.state.orderType === "Buy") {
          orders = await exchangeW3.methods
            .getBuyOrders(this.state.token._address)
            .call();
        } else if (this.state.orderType === "Sell") {
          orders = await exchangeW3.methods
            .getSellOrders(this.state.token._address)
            .call();
        }
        this.setState({
          order: orders,
          loading: false,
        });
      }
    );
  }

  async loadMain() {
    this.setState({loading: true});
    let exchangeW3 = this.state.exchangeW3;
    let orders;
    if (this.state.orderType === "Buy") {
      orders = await exchangeW3.methods
        .getBuyOrders(this.state.token._address)
        .call();
    } else if (this.state.orderType === "Sell") {
      orders = await exchangeW3.methods
        .getSellOrders(this.state.token._address)
        .call();
    }
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
      return <p>{this.state.orderType} Book is Empty</p>;
    } else {
      return orderBookPrices.map((s, index) => {
        const price = web3.utils.fromWei(s, "Ether");
        const amount = web3.utils.fromWei(orderBookAmount[index], "Ether");
        return (
          <>
            <tr>
              <td>{amount}</td>
              <td>{price}</td>
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
      content = <p>{this.state.orderType} Book is Empty</p>;
    } else {
      content = (
        <>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Amount</th>
                <th>Price</th>
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
export default OrderBook;

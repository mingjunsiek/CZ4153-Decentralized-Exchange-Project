import React, {Component} from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";

class ExchangeWallet extends Component {
  render() {
    return (
      <Card>
        <Card.Body>
          <Card.Title>Exchange Wallet</Card.Title>
          <Card.Subtitle className="mb-2 text-muted">
            Ethereum Coin Names:
            {this.props.scseWalletBalance}
          </Card.Subtitle>
        </Card.Body>
      </Card>
    );
  }
}

export default ExchangeWallet;

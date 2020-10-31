import React, {Component} from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";

class SellOrderComponent extends Component {
  render() {
    return (
      <Card>
        <Card.Body>
          <Card.Title>Buy Order</Card.Title>
          <Card.Subtitle className="mb-2 text-muted">Coin Name</Card.Subtitle>
          <Button variant="primary">Buy</Button>{" "}
        </Card.Body>
      </Card>
    );
  }
}

export default SellOrderComponent;

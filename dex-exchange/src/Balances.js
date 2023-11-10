import React, {Component} from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";

import App from "./linechart";


class Balances extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalSwapShow: false,
      modalWithdrawShow: false,
    };
    this.handleSwapShow = this.handleSwapShow.bind(this);
    this.handleSwapClose = this.handleSwapClose.bind(this);
    this.handleWithdrawShow = this.handleWithdrawShow.bind(this);
    this.handleWithdrawClose = this.handleWithdrawClose.bind(this);
  }

  handleChange(event) {
    this.setState({
      [event.target.name]: event.target.value,
    });
  }

  handleSubmit(event) {
    console.log(this.props);
    event.preventDefault();
  }

  handleSwapShow(event) {
    console.log("IN");
    this.setState({
      modalSwapShow: true,
    });
  }

  handleSwapClose(event) {
    this.setState({
      modalSwapShow: false,
    });
  }

  handleWithdrawShow(event) {
    console.log("IN");
    this.setState({
      modalWithdrawShow: true,
    });
  }

  handleWithdrawClose(event) {
    this.setState({
      modalWithdrawShow: false,
    });
  }

  swapModal() {
    return (
      <>
        <Modal
          show={this.state.modalSwapShow}
          onHide={this.handleClose}
          backdrop="static"
          keyboard={false}
          {...this.props}
          size="lg"
          aria-labelledby="contained-modal-title-vcenter"
          centered
        >
          <form
            className="mb-3"
            onSubmit={(event) => {
              event.preventDefault();
              let amount;
              amount = this.input.value.toString();
              amount = window.web3.utils.toWei(amount, "Ether");
              if (
                parseInt(amount) >
                parseInt(this.props.userWallet.ethTokenBalance)
              ) {
                alert("Insufficient ETH to swap");
              } else {
                this.props.ethToWethSwap(amount);
              }
            }}
          >
            <Modal.Header closeButton>
              <Modal.Title>ETH to WETH Swap</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div>
                <label className="float-left"></label>
                <span className="float-right text-muted">
                  Balance:{" "}
                  {window.web3.utils.fromWei(
                    this.props.userWallet.ethTokenBalance,
                    "Ether"
                  )}
                </span>
              </div>
              <div className="input-group mb-4">
                <input
                  type="text"
                  step="0.000001"
                  ref={(input) => {
                    this.input = input;
                  }}
                  className="form-control form-control-lg"
                  placeholder="0"
                  required
                />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={this.handleSwapClose}>
                Close
              </Button>
              <button type="submit" className="btn btn-success">
                Swap!
              </button>
            </Modal.Footer>
          </form>
        </Modal>
      </>
    );
  }

  withdrawModal() {
    return (
      <>
        <Modal
          show={this.state.modalWithdrawShow}
          onHide={this.handleWithdrawClose}
          backdrop="static"
          keyboard={false}
          {...this.props}
          size="lg"
          aria-labelledby="contained-modal-title-vcenter"
          centered
        >
          <form
            className="mb-3"
            onSubmit={(event) => {
              event.preventDefault();
              let amount;
              amount = this.input.value.toString();
              amount = window.web3.utils.toWei(amount, "Ether");
              if (
                parseInt(amount) >
                parseInt(this.props.userWallet.wethTokenBalance)
              ) {
                alert("Insufficient WETH to swap");
              } else {
                this.props.wethToEthSwap(amount);
              }
            }}
          >
            <Modal.Header closeButton>
              <Modal.Title>WETH to ETH Withdraw</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div>
                <label className="float-left"></label>
                <span className="float-right text-muted">
                  Balance:{" "}
                  {window.web3.utils.fromWei(
                    this.props.userWallet.wethTokenBalance,
                    "Ether"
                  )}
                </span>
              </div>
              <div className="input-group mb-4">
                <input
                  type="text"
                  step="0.000001"
                  ref={(input) => {
                    this.input = input;
                  }}
                  className="form-control form-control-lg"
                  placeholder="0"
                  required
                />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={this.handleWithdrawClose}>
                Close
              </Button>
              <button type="submit" className="btn btn-success">
                Swap!
              </button>
            </Modal.Footer>
          </form>
        </Modal>
      </>
    );
  }

  render() {
    return (
      <>
        
        {this.swapModal()}
        {this.withdrawModal()}
        <div className="card mb-4 ">
          <div className="card-body">
            <table className="table table-borderless text-muted ">
              <thead>
                <tr>
                  <th scope="col"></th>
                  <th scope="col">#</th>
                  <th scope="col">Tokens</th>
                  <th scope="col">Current Balance</th>
                  <th scope="col">24hr%</th>
                  <th scope="col">Last 7 Days</th>
                  <th className="text-center" scope="col">
                    Swap/Deposit
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <button class="btn"><i class="far fa-star"></i></button>
                  </td>
                  <td>
                    0
                  </td>
                  <td>
                    <span>Wrapped Ethereum  </span>
                    <span class="currency">WETH</span>
                  </td>
                  <td>
                    {window.web3.utils.fromWei(
                      this.props.userWallet.wethTokenBalance,
                      "Ether"
                    )}
                  </td>
                  <td class="green">
                    0.0
                  </td>
                  <td></td>
                  <td className="text-center">
                    <Button
                      variant="outline-dark"
                      onClick={this.handleSwapShow}
                    >
                      Swap
                    </Button>{" "}
                    <Button
                      variant="dark"
                      onClick={this.handleWithdrawShow}
                    >
                      Withdraw
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td >
                    <button class="btn"><i class="far fa-star"></i></button>
                  </td>
                  <td>
                    1
                  </td>
                  <td>
                    <span>Ethereum </span>
                    <span class="currency">ETH</span>
                  </td>
                  <td>
                    {window.web3.utils.fromWei(
                      this.props.userWallet.ethTokenBalance,
                      "Ether"
                    )}
                  </td>
                  <td class="green">
                    +1.45%
                  </td>
                  <td>
                    <App/>
                  </td>
                </tr>
                <tr>
                  <td>
                    <button class="btn"><i class="far fa-star"></i></button>
                  </td>
                  <td>2</td>
                  <td>
                    <span>Pancake  </span>
                    <span class="currency">PKE</span>
                  </td>
                  <td>
                    {window.web3.utils.fromWei(
                      this.props.userWallet.scseTokenBalance,
                      "Ether"
                    )}
                  </td>
                  <td class="red">
                    -5.12%
                  </td>
                  <td><App/></td>
                  <td></td>
                </tr>
                <tr>
                  <td>
                    <button class="btn"><i class="far fa-star"></i></button>
                  </td>
                  <td>3</td>
                  <td>
                    <span>Cookie  </span>
                    <span class="currency">CKI</span>
                  </td>
                  <td>
                    {window.web3.utils.fromWei(
                      this.props.userWallet.eeeTokenBalance,
                      "Ether"
                    )}
                  </td>
                  <td class="red">
                    -3.75%
                  </td>
                  <td><App/></td>
                  <td></td>
                </tr>
                <tr>
                  <td>
                    <button class="btn"><i class="far fa-star"></i></button>
                  </td>
                  <td>4</td>
                  <td>
                    <span>Donut  </span>
                    <span class="currency">DNT</span>
                  </td>
                  <td>
                    {window.web3.utils.fromWei(
                      this.props.userWallet.maeTokenBalance,
                      "Ether"
                    )}
                  </td>
                  <td class="green"> 
                    +0.8%
                  </td>
                  <td><App/></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }
}
export default Balances;

import React, { Component } from "react";
import SimpleStorageContract from "./contracts/SimpleStorage.json";
import getWeb3 from "./getWeb3";
import ipfs from "./ipfs";

import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ipfsHash: "",
      web3: null,
      account: null,
      accounts: null,
      contract: null,
      buffer: null,
    };
    this.captureFile = this.captureFile.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = SimpleStorageContract.networks[networkId];
      const simpleStorageContract = new web3.eth.Contract(
        SimpleStorageContract.abi,
        deployedNetwork && deployedNetwork.address
      );

      const ipfsHash = await simpleStorageContract.methods.get().call();

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({
        web3,
        ipfsHash,
        account: accounts[0],
        accounts: accounts,
        contract: simpleStorageContract,
      });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }
  };

  captureFile(event) {
    event.preventDefault();
    const file = event.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
      // convert the uploaded file to a format that IPFS understands
      // and set it to the state
      this.setState({ buffer: Buffer(reader.result) });
      console.log("buffer", this.state.buffer);
    };
  }

  onSubmit(event) {
    event.preventDefault();
    ipfs.files.add(this.state.buffer, async (err, result) => {
      if (err) {
        console.log(err);
        return;
      }

      try {
        await this.state.contract.methods
          .set(result[0].hash)
          .send({ from: this.state.account });
      } catch (err) {
        console.log(err);
        return;
      }

      const ipfsHash = await this.state.contract.methods.get().call();
      this.setState({ ipfsHash: ipfsHash });
      console.log(ipfsHash);
    });
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <h1>IPFS File Upload Dapp</h1>
        <p>This image will be stored on IPFS & the Ethereum blockchain.</p>
        <img src={`https://ipfs.io/ipfs/${this.state.ipfsHash}`} alt="" />
        <h2>Upload Image</h2>
        <form onSubmit={this.onSubmit}>
          <input type="file" onChange={this.captureFile} />
          <input type="submit" />
        </form>
      </div>
    );
  }
}

export default App;

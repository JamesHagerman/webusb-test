import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {

  constructor(props) {
    super(props)

    this.connectToUSB = this.connectToUSB.bind(this)
    this.connectToHID = this.connectToHID.bind(this)
  }

  connectToUSB() {
    navigator.usb.requestDevice({ filters: [{ vendorId: 0xfeed }] })
      .then(device => {
        console.log(device.productName);      // "Arduino Micro"
        console.log(device.manufacturerName); // "Arduino LLC"
      })
      .catch(error => { console.log(error); });


    navigator.usb.getDevices()
      .then(devices => {
        console.log('devices', devices)
      })
  }

  connectToHID() {
    chrome.hid.getDevices({}, () => {

    })
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
        <button onClick={this.connectToUSB}>Connect To USB</button>
        <button onClick={this.connectToHID}>Connect To HID</button>
      </div>
    );
  }
}

export default App;

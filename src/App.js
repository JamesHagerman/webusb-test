import React, { Component } from 'react';
//import logo from './logo.svg';
//import './App.css';

class App extends Component {
  constructor(props) {
    super(props)

    this.connectToUSB = this.connectToUSB.bind(this)
    this.connectToHID = this.connectToHID.bind(this)
  }

  connectToUSB() {
   // navigator.usb.requestDevice({ filters: [{ vendorId: 0xfeed }] })
   //   .then(device => {
   //     console.log(device.productName)
   //     console.log(device.manufacturerName)
   //   })
   //   .catch(error => {
   //     console.log(error)
   //   })

    //navigator.usb.requestDevice({ filters: [] })
    //  .then(device => {
    //    console.log(device)
    //  })
    navigator.usb.getDevices()
      .then(devices => {
        console.log('devices', devices)
      })
  }

  connectToHID() {
    //chrome.hid.getDevices({}, () => {

    //})
  }

  render() {
    return (
      <div className="App">
        <button onClick={this.connectToUSB}>Connect To USB</button>
        <button onClick={this.connectToHID}>Connect To HID</button>

        <div>
          List of devices:
          
        </div>
      </div>
    );
  }
}

export default App;

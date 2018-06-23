import React, { Component } from 'react'
import DeviceList from './components/DeviceList/'
//import logo from './logo.svg';
//import './App.css';

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      allowedDevices: []
    }

    this.connectToUSB = this.connectToUSB.bind(this)
  }

  componentWillMount() {
    navigator.usb.getDevices()
      .then(devices => {
        if (devices.length > 0) {
          this.setState({ allowedDevices: devices })
        } else {
          console.log('No currently allowed USB devices...')
        }
      })
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


    // Known vendor IDs for Particle devices:
    // 1d50
    // 2b04

    navigator.usb.requestDevice({ filters: [{ vendorId: 0x1d50 }, { vendorId: 0x2b04 }] })
      .then(device => {
        // Note: Device Objects returned from the WebUSB APIs do not play nice with JSON.stringify()
        console.log(`Newly allowed USB device:`, device)
      })
      .then(() => {
        // getDevices() only returns the devices we've requested, and that the user has allowed
        return navigator.usb.getDevices()
      })
      .then(devices => {
        console.log(`${devices.length} currently allowed USB devices:`)
        devices.forEach((device, i) => {
          console.log(`Allowed USB device ${i}:`, device)
        })
        this.setState({
          allowedDevices: devices
        })
      })

  }

  render() {
    return (
      <div className="App">
        <button onClick={this.connectToUSB}>Allow USB Device...</button>
        <DeviceList devices={this.state.allowedDevices} />
      </div>
    );
  }
}

export default App;


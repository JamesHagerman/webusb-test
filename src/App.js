import React, { Component } from 'react'
import DeviceList from './components/DeviceList/'
//import logo from './logo.svg';
//import './App.css';

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      allowedDevices: [],
      polling: false // TODO: Should this state combine "polling" and "this is the device we are polling"?
    }

    this.connectToUSB = this.connectToUSB.bind(this)
    this.openDevice = this.openDevice.bind(this)
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

  async openDevice(device) {
    console.log(`Trying to open ${device.manufacturerName.trim()} - ${device.productName.trim()}...`, device)
  
    let particleUARTInterface = 1
    let particleUARTEndpoint = 1

    try {
      // To get data, first we have to tell the OS to open the device. This requires that the OS is not already USING
      // this device.
      //
      // Note: This means manually unbinding the device from the OS driver. See the README.md for more info...
      await device.open()
      if (device.configuration === null) {
        // In theory, a USB device can have multiple configurations. It should have been correctly selected on device
        // enumeration but we make sure it's selected in case the OS didn't do so yet:
        await device.selectConfiguration(1) // TODO: Do any devices from Particle have more than one configuration?
      }
      // Now that we've opened the device and selected a configuration, we need to claim one of the devices interfaces.
      await device.claimInterface(particleUARTInterface);
      console.log('Interface claimed!')

      // Since I do not know anything about the existing USB interfaces on the Particle, I'm just gonna ham this next
      // part until I find an endpoint that's spitting out something like serial data! If not, I'll have to dig through
      // the Particle firmware a bit...
      await device.controlTransferOut({
        requestType: 'class',
        recipient: 'interface',
        request: 0x22,
        value: 0x01,
        index: particleUARTInterface //0x01 // Interface
      })

      // At this point, we should be ready to poll for data! We'll just grab data here for now so we can show that it
      // works by hammering the "Tail Serial Log..." button...
      let result = await device.transferIn(particleUARTEndpoint, 64)

      // The transferIn API returns a DataView (a low level interface fro reading raw data from an ArrayBuffer). This
      // means it's easier to use a decoder to get the data:
      let decoder = new TextDecoder();
      console.log('Received: ' + decoder.decode(result.data));

      // Really, we should transition to a "Polling" state somehow so we can better control when and how we will
      // actually continue watching data over time...
      this.setState({

      })

    } catch(err) {
      console.error('oh man...', err)
    }
  }

  render() {
    return (
      <div className="App">
        <button onClick={this.connectToUSB}>Allow USB Device...</button>
        <DeviceList devices={this.state.allowedDevices} openCallback={this.openDevice} />
      </div>
    );
  }
}

export default App;


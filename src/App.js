import React, { Component } from 'react'
import DeviceList from './components/DeviceList/'
//import logo from './logo.svg';
import './App.css';

// Known vendor IDs for Particle devices:
// 1d50
// 2b04
const knownDevices = [0x1d50, 0x2b04]
let particleUARTInterface = 1
let particleUARTEndpoint = 1

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      allowedDevices: [], // Keeps track of all currently opened, raw USB devices
      pollingDevices: [], // Keeps track of which devices (by index) are currently polling
      deviceData: [] // Keeps track of all data returned by each device
    }

    this.allowUSBDevice = this.allowUSBDevice.bind(this)
    this.updateDeviceList = this.updateDeviceList.bind(this)
    this.openDevice = this.openDevice.bind(this)
    this.startPolling = this.startPolling.bind(this)
    this.stopPolling = this.stopPolling.bind(this)

    this.pollDevices = this.pollDevices.bind(this)
  }

  componentWillMount() {
    this.updateDeviceList()

    window.requestAnimationFrame(this.pollDevices)
  }

  updateDeviceList() {
    // getDevices() only returns the devices we've requested, and that the user has allowed
    navigator.usb.getDevices()
      .then(devices => {
        if (devices.length > 0) {
          let currentPollingDevices = this.state.pollingDevices.splice(0)

          let pollingDevices = devices.map((device, i) => {
            if (currentPollingDevices[i]) {
              return currentPollingDevices[i]
            }
            return false
          })

          let deviceData = devices.map(() => '')

          this.setState({ allowedDevices: devices, pollingDevices, deviceData })
        } else {
          console.log('No currently allowed USB devices...')
        }
      })
  }

  allowUSBDevice() {
    // Build a filter to only select some of the currently connected USB devices:
    const filters = knownDevices.map(vendorId => ({ vendorId }))

    // Tell the browser to ask the User for access to the available devices:
    navigator.usb.requestDevice({ filters })
      .then(device => {
        // Note: Device Objects returned from the WebUSB APIs do not play nice with JSON.stringify()
        console.log(`Newly allowed USB device:`, device)
        this.updateDeviceList()
      })
      .catch(err => {
        console.log(err)
      })
  }

  async updateDeviceData(device) {
    let result = await device.transferIn(particleUARTEndpoint, 64)
    let decodedData = ''

    //console.log(`Received ${result.data.byteLength} bytes of data:`)

    // The transferIn API returns a DataView (a low level interface fro reading raw data from an ArrayBuffer). This
    // means it's easier to use a decoder to get the data:
    let decoder = new TextDecoder();
    decodedData = decoder.decode(result.data)
    //console.log(`Received data:`, decodedData);

    if (result.status === 'stall') {
      console.warn('Endpoint stalled. Clearing...')
      await device.clearHalt(particleUARTEndpoint)
    }

    return decodedData
  }

  startPolling(device, index) {
    if (device.opened) {
      let pollingDevices = this.state.pollingDevices.slice(0)
      pollingDevices[index] = true
      this.setState({ pollingDevices })
    }
  }

  stopPolling(device, index) {
    let pollingDevices = this.state.pollingDevices.slice(0)
    pollingDevices[index] = false
    this.setState({ pollingDevices })
  }

  pollDevices() {
    // This is basically the main polling loop. Here, we're calling it using requestAnimationFrame() but it should
    // probably be done using something else...
    
    let allPollPromises = this.state.allowedDevices.map(async (device, index) => {
      let decodedData = ''
      if (this.state.pollingDevices[index]) {
        decodedData = await this.updateDeviceData(device)
      }
      return decodedData
    })

    Promise.all(allPollPromises)
      .then(deviceData => {
        //console.log('Devices returned this data:', deviceData)
        this.setState({ deviceData })
        
        // Comment this out to poll a single time.
        //window.requestAnimationFrame(this.pollDevices)
      })

  }

  async openDevice(device) {
    console.log(`Trying to open ${device.manufacturerName.trim()} - ${device.productName.trim()}...`)
    //console.log('raw device:', device)
  
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
      //console.log('Interface claimed!')

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

      // At this point, we should be ready to poll for data!
      //
      // Really, we should transition to a "Polling" state somehow so we can better control when and how we will
      // actually continue fetching data over time...
      this.setState(this.state)
    } catch(err) {
      console.error('oh man...', err)
    }
  }

  render() {
    return (
      <div className="App">
        <h4>Particle USB Serial Port Logging via WebUSB</h4>
        <p>
          The purpose of this page is to provide access to data being printed on the Serial Port of Particle devices
        </p>
        <p>
          First, plug in your Particle board via USB. Then, make sure that a driver on your computer's OS isn't claiming
          that USB device (follow README.md for more info). Click the "Allow USB Device..." button, and select one of 
          your Particle devices.
        </p>
        <p>Finally, click the "Open Device" button next to the device you want to watch.</p>
        <p>To disallow a device in Chrome, click the lock icon in the address/search box and "x" next to the device</p>
        
        <button onClick={this.allowUSBDevice}>Allow USB Device...</button>
        <button onClick={this.pollDevices}>Poll All Devices Once</button>

        <DeviceList
          devices={this.state.allowedDevices}
          pollingDevices={this.state.pollingDevices}
          deviceData={this.state.deviceData}

          openCallback={this.openDevice}
          pollDevice={this.updateDeviceData}
          startPolling={this.startPolling}
          stopPolling={this.stopPolling}
        />
      </div>
    );
  }
}

export default App;


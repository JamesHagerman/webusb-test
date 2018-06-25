import React, { Component } from 'react'

import './deviceList.css'

class DeviceList extends Component {
  constructor(props) {
    super(props)
    this.renderOpenState = this.renderOpenState.bind(this)
    this.renderPollingState = this.renderPollingState.bind(this)
    this.renderTerminalData = this.renderTerminalData.bind(this)
  }

  renderOpenState(device) {
    if (device.opened) {
      return <span className="enabled">open </span>
    }
    return <span>closed </span>
  }

  renderPollingState(pollingDevices, index) {
    if (pollingDevices[index]) {
      return <span className="enabled">polling!</span>
    }
    return <span>not polling...</span>
  }

  renderTerminalData(index, deviceData) {
    let data = deviceData[index]
    //console.log(`Terminal ${index} data:`, data)
    return data
  }

  render() {
    const {
      // State/Data:
      devices,
      pollingDevices,
      deviceData,

      // Callbacks:
      openCallback,
      pollDevice,
      startPolling,
      stopPolling,
    } = this.props

    let deviceList = []

    if (devices.length > 0) {
      deviceList = devices.map((device, index) => {
        return (
          <div key={index}>
            {device.manufacturerName} - {device.productName} 
            Device {this.renderOpenState(device)}
            and {this.renderPollingState(pollingDevices, index)}
            <div>
              <button onClick={() => {
                openCallback(device)
              }}>Open Device</button>
              <button onClick={() => {
                startPolling(device, index)
              }}>Start Polling</button>
              <button onClick={() => {
                stopPolling(device, index)
              }}>StopPolling</button>
              <button onClick={() => {
                pollDevice(device)
              }}>Poll Once</button>
            </div>
            <pre className="terminal">
              {this.renderTerminalData(index, deviceData)}
            </pre>
          </div>
        )
      })
    } else {
      deviceList = (
        <div>No allowed USB devices found. Please click "Allow USB device..."</div>
      )
    }
    
    return (
      <div>
        {deviceList}
      </div>
    )
  }
}

export default DeviceList


import React, { Component } from 'react'

import './deviceList.css'

class DeviceList extends Component {
  constructor(props) {
    super(props)

    this.terminalEls = []
    this.state = {
      followingTerminals: [] // Keep track of which logs are being followed
    }

    this.renderOpenState = this.renderOpenState.bind(this)
    this.renderPollingState = this.renderPollingState.bind(this)
    this.renderTerminalData = this.renderTerminalData.bind(this)
  }

  componentDidUpdate() {
    this.terminalEls.forEach((el, index) => {
      if (el && this.state.followingTerminals[index]) {
        el.scrollTop = 100000
      }
    })
  }

  renderOpenState(device) {
    if (device.opened) {
      return <span className="enabled">open </span>
    }
    return <span>closed </span>
  }

  renderPollingState(pollingDevices, index) {
    if (pollingDevices[index]) {
      return <span className="enabled">polling </span>
    }
    return <span>not polling </span>
  }

  renderFollowingState(index) {
    if (this.state.followingTerminals[index]) {
      return <span className="enabled">following!</span>
    }
    return <span>not following...</span>
  }

  renderTerminalData(index, deviceData) {
    let data = deviceData[index]
    //console.log(`Terminal ${index} data:`, data)
    return data
  }

  toggleFollow(index) {
    let followingTerminals = this.state.followingTerminals.slice(0)
    followingTerminals[index] = !followingTerminals[index]
    this.setState({ followingTerminals })
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
            and {this.renderFollowingState(index)}
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
                this.toggleFollow(index)
              }}>Toggle Follow</button>
            </div>
            <pre className="terminal" ref={el => { this.terminalEls[index] = el }}>
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


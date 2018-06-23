import React, { Component } from 'react'

class DeviceList extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    const {
      devices,
      openCallback
    } = this.props

    let deviceList = []
    
    if (devices.length > 0) {
      deviceList = devices.map((device, i) => {
        return (
          <div key={i}>
            {device.manufacturerName} - {device.productName}
            <button onClick={() => {
              openCallback(device)
            }}>Tail Serial Log...</button>
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
        Allowed Devices:
        {deviceList}
      </div>
    )
  }
}

export default DeviceList


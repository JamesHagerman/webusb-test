# WebUSB tests

My goal with this project is to connect to embedded systems via the WebUSB protocol. I started work on this a
while back but decided to move over to using Electron for my last USB project for various reasons.

Now it's time for me to dig back into this and get it working correctly!

## The End Product

You can find a working demo of this on my GitHub Pages here:
[https://jameshagerman.github.io/webusb-test/](https://jameshagerman.github.io/webusb-test/)

*Note: This has only been tested on Linux using Google Chrome AFTER performing the `cdc_acm` unbind process documented
at the bottom of this readme. In short, that process is as follows:*

```
# Get the correct driver setting strings for use with the unbind command (It should look like: 2-1.1:1.0) 
tree /sys/bus/usb/drivers/cdc_acm/
OR
dmesg | grep cdc | tail -n 2
OR
ls /sys/bus/usb/drivers/cdc_acm/ 

# Unbind any of the devices you want to connect to via WebUSB
echo -n "1-1.1:1.0" > /sys/bus/usb/drivers/cdc_acm/unbind # Unbind the first connected cdc_acm device
echo -n "2-1.1:1.0" > /sys/bus/usb/drivers/cdc_acm/unbind # And unbind the second (if one was connected)
```

## Starting the dev server

This project was created with create-react-app. That means node.js, React, and yarn:

```
yarn install
yarn start
```

Once you've done that, you should be able to access this app locally at: [http://localhost:3000](http://localhost:3000)

*Note: If you're planning on hosting this somewhere (`yarn build`), remember that you'll need to implement TLS to get 
the WebUSB API working! This stuff only works on secure origins... And localhost is a secure origin!*

## Particle Photon stuff - Serial output over USB

WebUSB demos are often about Arduinos. But it's 2018 and we need up our game a bit!

I dragged out my box of Delicious Dev Boards and pulled out my Particle Photon (and Particle/Spark Core too!).

After updating my Photon to the latest firmware, I tossed the following code into the Web-based Particle IDE and
flashed it to the board. 

```
int knobIn = A0;
int knobValue = 0;
void setup() {
    pinMode(knobIn, INPUT);
    Serial.begin(9600);
}

void loop() {
    knobValue = analogRead(knobIn);
    delay(100);
    Serial.printlnf("Knob value: %d", knobValue);
}
```

After wiring up a spare potentiometer between 3.3v, Gnd, and the A0 analog pin, I was able to do a quick smoke test
using screen (of course, you'll have to use something like `dmesg` to find the correct serial port for your Particle
board):

```
screen /dev/ttyACM0 9600
```

*Note: Under Linux, you will need to make sure you have Udev rules correctly in place in order to access USB devices!
For Particle devices, instructions for this can be found here:
[https://gist.github.com/monkbroc/b283bb4da8c10228a61e](https://gist.github.com/monkbroc/b283bb4da8c10228a61e)*

This spit out some friendly values and we're ready to move on to trying to get the WebUSB part working:


```
[...]
Knob value: 3323
Knob value: 3325
Knob value: 3323
Knob value: 3323
Knob value: 3324
[...]
```

## WebUSB stuff

There are two parts to this:

1. Just hack through and get the raw serial data
2. Build a more robust set of tools to list out any connected USB devices and allow interaction with each device

We'll step through both of these, make some React components along the way, and make some notes on how it goes!


### OS Drivers get in the way...

The largest hangup with WebUSB is that it really doesn't work well when the OS drivers claim the USB interfaces before
we get the chance to do so from our javascript code in the browser.

*Updated: 2018-07-04* This behavior matches the intended purpose of WebUSB: To let the Operating System handle what it 
can when it comes to most USB devices. HID devices, thumb drives, and a number ofother devices have better high level 
libraries to handle interfacing most of the time.  WebUSB is about "new" devices!

So, the correct way to handle this is for the USB device descriptors to be correctly defined for WebUSB access as 
described here:
[https://wicg.github.io/webusb/#webusb-platform-capability-descriptor](https://wicg.github.io/webusb/#webusb-platform-capability-descriptor)

#### Manual unbind process to use until the Particle Device Descriptors are updated

This requires us to manually `unbind` the USB device from the OS's driver. I can't find a way to do this using only Web
technologies and that's obviously a drag.

But, on Linux, we can do so manually, or (in theory) use Udev rules to disable a device against a specific driver.

In this case, because the Particle devices are bound to the `cdc_acm` Serial device driver, we could, in theory, patch
the existing Linux kernel driver to allow us some level of "per-device" black listing functionality (it's been asked for
for by the community for a while now...) but that option is not currently available to us. (patches are probably
accepted though!)

In the meantime, we will need to perform step manually.

On Linux, the `/sys/bus/usb/drivers/` directory allows a user to control the USB kernel drivers for each USB device
connected to the system. Specifically, you are able to bind and unbind devices from their respective drivers.

For example, to unbind the Particle Photon from the `cdc_acm` driver in the Linux kernel, we can do the following 
*Note, I had to be at a root prompt to get this to work.*

```
sudo su
dmesg | grep cdc | tail -n 1 # This will spit out the information we need about the last connected cdc_acm device
echo -n "1-1.1:1.0" > /sys/bus/usb/drivers/cdc_acm/unbind # Use the correct value here or bad things can happen!
```

This will unbind the device on bus 1, port 1, using configuration 1, and interface 1.

You can use the `tree` command to inspect all of the currently connected cdc usb devices. Note that `tree` often is not 
installed on Linux distributions by default, but it is very helpful:

```
# tree /sys/bus/usb/drivers/cdc_acm/
/sys/bus/usb/drivers/cdc_acm/
├── 1-1.1:1.0 -> ../../../../devices/pci0000:00/0000:00:1a.0/usb1/1-1/1-1.1/1-1.1:1.0
├── 1-1.1:1.1 -> ../../../../devices/pci0000:00/0000:00:1a.0/usb1/1-1/1-1.1/1-1.1:1.1
├── bind
├── module -> ../../../../module/cdc_acm
├── new_id
├── remove_id
├── uevent
└── unbind

3 directories, 5 files
```

After sending the device to the unbind node, the OS driver should no longer be in control of the interface, and your
WebUSB code should work as expected!




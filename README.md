# WebUSB tests

My goal with this project is to connect to embedded systems via the WebUSB protocol. I started work on this a
while back but decided to move over to using Electron for my last USB project for various reasons.

Now it's time for me to dig back into this and get it working correctly!

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
we get the chance to via the browser.

This requires us to manually `unbind` the USB device from the OS's driver. I can't find a way to do this using only Web
technologies and that's obviously a drag.

On Linux, the `/sys/bus/usb/drivers/usb/` directory has a node named `unbind` that can be used to unbind a USB device. 
In this case, to unbind the Particle Photon described in that `dmesg` output, we can do the following (*Note, I havd
to be at a root prompt to get this to work!*):

```
sudo su
echo -n "1-1.1" > /sys/bus/usb/drivers/usb/unbind
```

This will unbind the device on bus 1, port 1, using configuration 1. I found using a combination of `dmesg` and `tree`
to help figure out what device was what. 

Under Linux, when the device is plugged in, `dmesg` will spit out something like this:

```
% dmesg -Hw
[  +3.556778] usb 1-1.1: new full-speed USB device number 28 using ehci-pci
[  +0.094945] usb 1-1.1: New USB device found, idVendor=2b04, idProduct=c006
[  +0.000011] usb 1-1.1: New USB device strings: Mfr=1, Product=2, SerialNumber=3
[  +0.000007] usb 1-1.1: Product: Photon
[  +0.000005] usb 1-1.1: Manufacturer: Particle
[  +0.000005] usb 1-1.1: SerialNumber: 123123123123123123
[  +0.002839] cdc_acm 1-1.1:1.0: ttyACM0: USB ACM device
```

`tree` isn't often installed, but it's helpful here:

```
% tree /sys/bus/usb/drivers/usb/
/sys/bus/usb/drivers/usb/
├── 1-1 -> ../../../../devices/pci0000:00/0000:00:1a.0/usb1/1-1
├── 1-1.1 -> ../../../../devices/pci0000:00/0000:00:1a.0/usb1/1-1/1-1.1
├── 1-1.2 -> ../../../../devices/pci0000:00/0000:00:1a.0/usb1/1-1/1-1.2
├── 1-1.3 -> ../../../../devices/pci0000:00/0000:00:1a.0/usb1/1-1/1-1.3
├── 1-1.4 -> ../../../../devices/pci0000:00/0000:00:1a.0/usb1/1-1/1-1.4
├── 1-1.6 -> ../../../../devices/pci0000:00/0000:00:1a.0/usb1/1-1/1-1.6
├── 2-1 -> ../../../../devices/pci0000:00/0000:00:1d.0/usb2/2-1
├── 2-1.1 -> ../../../../devices/pci0000:00/0000:00:1d.0/usb2/2-1/2-1.1
├── bind
├── uevent
├── unbind
├── usb1 -> ../../../../devices/pci0000:00/0000:00:1a.0/usb1
└── usb2 -> ../../../../devices/pci0000:00/0000:00:1d.0/usb2

10 directories, 3 files
```

After sending the device to the unbind node, the OS driver should no longer be in control of the interface, and your
WebUSB code *should* work better...




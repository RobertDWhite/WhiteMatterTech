---
title: "Arduino MQ-3B Ethanol Sensor: Behavioral Neuroscience Research"
date: "2021-12-11"
categories:
  - "arduino"
  - "research"
  - "science"
  - "tutorials"
tags:
  - "arduino"
  - "research"
  - "science"
  - "tutorials"
cover:
    image: "/posts/arduino-mq-3b-ethanol-sensor-behavioral-neuroscience-research/images/IMG_0825-min-768x1024.jpeg"
    alt: "Image of Completed Sensor"
#   caption: "Completed Sensor with Readout: Volts = 4.91"
    relative: true
aliases:
    - /posts/arduino-mq-3b-ethanol-sensor-behavioral-neuroscience-research/
    - /2021/arduino-mq-3b-ethanol-sensor-behavioral-neuroscience-research/
---

# Introduction

Recently, I had the opportunity to collaborate with a university research lab to build some vapor sensors to roughly measure ethanol (EtOH) vapor within an operant chamber. This project was a lot of fun.

With extremely limited circuit documentation on the web and never having personally used Arduino before, there were a lot of interesting hiccups I ran into. Overall, this project was a bit out of my wheelhouse, but with much determination, the finished product turned out rather nicely.

This project was made possible and open-source by the work of [Dr. Brian McCool](https://school.wakehealth.edu/Faculty/M/Brian-A-McCool). The Arduino code hosted on [GitHub](https://github.com/RobertDWhite/arduino_mq-3b), the general project design (along with most of the corresponding recommended parts list), and the conceptual use of the project for alcohol research are his work.

# The Lab

This project was completed for the [Reward and Addictive Disorders (RAD)](https://www.aradlab.com/) Lab at Miami University by Dr. Anna Radke.

The sensors will be used in a current experiment utilizing mouse operant chambers for a visual representation of the EtOH vapor pressure in the chambers. The support of this experiment utilizing these modules is under the direction of Elizabeth Sneddon _(PhD candidate at the time of this writing; recipient of the prestigious DSPAN F99/K00 from NINDS -- read more from the [Lab News here](https://www.aradlab.com/news))_.

I highly recommend checking out [the RAD Lab's website](https://www.aradlab.com/) for more information on Dr. Radke and both her incredibly talented graduate students and undergraduate students. You can find information about many of their current projects.

**_Shameless plug:_** You can also check out a paper from the RAD Lab of which I am an author: [https://pubmed.ncbi.nlm.nih.gov/30431655/](https://pubmed.ncbi.nlm.nih.gov/30431655/)

![](/posts/arduino-mq-3b-ethanol-sensor-behavioral-neuroscience-research/images/IMG_0825-min-768x1024.jpeg)

First Successful Unit

# The Parts

#### **Per Module Quick List**:

- [Arduino Uno R3](https://amzn.to/3cVsZRE)
- [Arduino Proto Shield for Arduino Kit (Stackable)](https://amzn.to/3p3AT0S "https://amzn.to/3p3AT0S")
- [Clear Enclosure for Arduino (adafruit.com)](https://www.adafruit.com/product/337 "https://www.adafruit.com/product/337")
- Standard LCD 16x2 screen _**([adafruit.com version](https://www.adafruit.com/product/181)) ([amazon.com pre-soldered jumpers](https://www.amazon.com/Adafruit-Assembled-Standard-16x2-extras/dp/B01GQFVRCM/ref=sr_1_2?keywords=Standard+LCD+16x2+%2B+extras+-+white+on+blue&qid=1637993936&s=electronics&sr=1-2))**_
- [i2c/SPI character LCD backpack](https://www.amazon.com/Adafruit-i2c-Character-Backpack-ADA292/dp/B00OKCON84/ref=sr_1_2?keywords=i2c%2FSPI+character+LCD+backpack%2C&qid=1637994049&s=electronics&sr=1-2 "https://www.amazon.com/Adafruit-i2c-Character-Backpack-ADA292/dp/B00OKCON84/ref=sr_1_2?keywords=i2c%2FSPI+character+LCD+backpack%2C&qid=1637994049&s=electronics&sr=1-2")
- [MQ-3 alcohol gas sensor (sparkfun.com)](https://www.sparkfun.com/products/8880)
- Power supply (see comments below)
- [Standard USB printer cable](https://amzn.to/3FVAVif)
- 500Ohm Trim Potentiometer (for rat operant boxes); 1k-2kOhm Trim Potentiometer (for mouse operant boxes) -- [this kit contains 4 of each along with other (unnecessary for this project) resistance values](https://amzn.to/318VPLq)
- Wiring: while there are many options for wires, [this kit](https://www.amazon.com/Elegoo-EL-CP-004-Multicolored-Breadboard-arduino/dp/B01EV70C78/ref=pd_bxgy_img_2/132-1315716-1567653?pd_rd_w=cSDZ2&pf_rd_p=c64372fa-c41c-422e-990d-9e034f73989b&pf_rd_r=CH2KN5DS1W5BYMAQP5BN&pd_rd_r=4b0add23-3cdd-4e21-b3e6-f153ec79ec22&pd_rd_wg=HVNXr&pd_rd_i=B01EV70C78&th=1) has an assortment of Male-Female, Male-Male, and Female-Female wires that will be helpful in learning/testing the circuit later
- _**Optional:**_ [Breadboard](https://www.amazon.com/Breadboard-Solderless-Prototype-Universal-Raspberry/dp/B07LF84HWK/ref=sr_1_2_sspa?keywords=arduino+breadboard&qid=1638163676&sr=8-2-spons&psc=1&smid=A14FP9XIRL6C1F&spLa=ZW5jcnlwdGVkUXVhbGlmaWVyPUExRURBV1paQTZUMEpFJmVuY3J5cHRlZElkPUEwNDY4MDQ3M0YwQUFTUkVaSjZUOCZlbmNyeXB0ZWRBZElkPUEwOTA4NzE2MlBGODVVMUtHTlIwRyZ3aWRnZXROYW1lPXNwX2F0ZiZhY3Rpb249Y2xpY2tSZWRpcmVjdCZkb05vdExvZ0NsaWNrPXRydWU= "https://www.amazon.com/Breadboard-Solderless-Prototype-Universal-Raspberry/dp/B07LF84HWK/ref=sr_1_2_sspa?keywords=arduino+breadboard&qid=1638163676&sr=8-2-spons&psc=1&smid=A14FP9XIRL6C1F&spLa=ZW5jcnlwdGVkUXVhbGlmaWVyPUExRURBV1paQTZUMEpFJmVuY3J5cHRlZElkPUEwNDY4MDQ3M0YwQUFTUkVaSjZUOCZlbmNyeXB0ZWRBZElkPUEwOTA4NzE2MlBGODVVMUtHTlIwRyZ3aWRnZXROYW1lPXNwX2F0ZiZhY3Rpb249Y2xpY2tSZWRpcmVjdCZkb05vdExvZ0NsaWNrPXRydWU=") (this is super helpful to learn/test the circuit before you commit to soldering, but it is definitely not a requirement)
- **_Optional:_** This project REQUIRES soldering. I used [this soldering iron kit here](https://amzn.to/31BtYEb). In addition to this soldering iron, a [solder sucker kit](https://amzn.to/3pAkNMm) is highly recommended when you make a mistake.

_**Power supply notes:**_ For the power supply, you can theoretically use a _[5V 2A power supply](https://amzn.to/3ldMdpT "https://amzn.to/3ldMdpT")_, but I did not have luck with this option. For some reason, the voltage would drop to 3V on the Arduino unit when powered via this method. 3V is insufficient to run the readout on the screen, and I did not end up using this method for the finished product. If you want to test for yourself or know of some way to make this work, you could consider this [5V 2A switching power supply](https://amzn.to/3ldMdpT).

Otherwise, I highly recommend powering your Arduino unit with [a standard USB printer cable](https://amzn.to/3FVAVif) and a [USB power block](https://www.amazon.com/Charger-LUOATIP-Adapter-Charging-Replacement/dp/B07TK6MPNB/ref=sr_1_5?keywords=5v+2a+power+block+usb&qid=1637993414&s=electronics&sr=1-5). Your mileage with that particular power block may vary, as it is specifically 5V and 2.1A. I did not use this particular power block but instead used an Apple power block for an iPhone. Any block that supplies at minimum 5V and 2A should be sufficient.

Nonetheless, you will need at least one [standard USB printer cable](https://amzn.to/3FVAVif) in order to transfer the program to the Arduino device for the readout. This is covered in the Programming section.

This list is adapted from a list shared by [Dr. Brian McCool](https://school.wakehealth.edu/Faculty/M/Brian-A-McCool).

_As an Amazon Associate, I earn from qualifying purchases. **Thank you** for supporting the maintenance of this blog. The pricing will be the same for you regardless if you use my links or not! Thanks for your support!_

# The Circuit

This circuit diagram was drawn by my father, a radio and broadcast engineer, and I am very appreciative of his work and direction with this particular project. Hopefully this drawing can be useful to you or a technically-inclined student in your lab. **_Drawn by RW 09/04/2021_**

![](/posts/arduino-mq-3b-ethanol-sensor-behavioral-neuroscience-research/images/Screenshot-2021-11-25-012016-1024x784.png)

[Arduino with MQ-3B Sensor Module Wiring Diagram](https://drive.google.com/file/d/1gVgyCg9lm8LaurHVQtRFqXGifgDlCiEb/view?usp=sharing)

**See or download the diagram here** [https://drive.google.com/file/d/1gVgyCg9lm8LaurHVQtRFqXGifgDlCiEb/view?usp=sharing](https://drive.google.com/file/d/1gVgyCg9lm8LaurHVQtRFqXGifgDlCiEb/view?usp=sharing) **OR here** [https://github.com/RobertDWhite/arduino\_mq-3b](https://github.com/RobertDWhite/arduino_mq-3b)

# Assembling the Arduino

The order of completing these steps does not necessarily matter, but this is the order I completed them.

I am certainly no Arduino expert. In fact, this project was my first experience with Arduino. I definitely had a fun (sometimes irritating) time building the modules. Unfortunately, I did not take as many pictures as I should have of the process or the built circuit (mostly because I did not intend to write this up). If I have an opportunity to build more in the future, I will update this post with more / better pictures.

### Preparing the Protoshield and Connecting to the Mainboard

Assembling the Protoshield will require some soldering. You will see the many components included with the Protoshield nearly immediately. These components should be assembled to look like the image below. Specifically not the location of the capacitors, resistors, switches/buttons, and LEDs. The components can be soldered from the bottom of the board.

![](/posts/arduino-mq-3b-ethanol-sensor-behavioral-neuroscience-research/images/external-content.duckduckgo-2.jpg)

The black pinouts should be matched and aligned as shown in the picture above as well. Those should also be soldered from the bottom (see picture below for clarity), and they will be used to align the Protoshield to the Mainboard. The pins soldered to the Protoshield will insert into the pinouts on the Mainboard.

![](/posts/arduino-mq-3b-ethanol-sensor-behavioral-neuroscience-research/images/arduino-mq-3b-ethanol-sensor-behavioral-neuroscience-research-5.jpg)

Once complete, your Protoshield and Mainboard should look like the first image above.

### Connect the LCD Backpack to the LCD Screen

The 16-pin connector will be used to connect the backpack to the screen. The front of the screen should be soldered using the short ends of the connectors (see image below). Solder all 16-pins.

![](/posts/arduino-mq-3b-ethanol-sensor-behavioral-neuroscience-research/images/external-content.duckduckgo.jpg)

**_Protip_**: Attach the 5-screw pins to the backpack before continuing. Once the backpack is attached to the screen, adding the screw pins is _very very_ difficult.

From the other side, attach the backpack and solder all 16-pins as shown in the image below.

![](/posts/arduino-mq-3b-ethanol-sensor-behavioral-neuroscience-research/images/arduino-mq-3b-ethanol-sensor-behavioral-neuroscience-research-7.jpg)

The GND, 5V, CLK, and DAT ports are shown on the Diagram as the _READ-OUT BOARD_.

## Wire the Protoshield

Unfortunately, I do not have too many detailed images of the Protoshield with the wires attached. In the image below, you can see how I wired the 5V and the Ground from the Mainboard to the central 5V and GND. From there, all the required 5V and Ground wires can be soldered to the center for easy access.

When wiring, I recommend using one of the [breadboards](https://www.amazon.com/Breadboard-Solderless-Prototype-Universal-Raspberry/dp/B07LF84HWK/ref=sr_1_2_sspa?keywords=arduino+breadboard&qid=1638163676&sr=8-2-spons&psc=1&smid=A14FP9XIRL6C1F&spLa=ZW5jcnlwdGVkUXVhbGlmaWVyPUExRURBV1paQTZUMEpFJmVuY3J5cHRlZElkPUEwNDY4MDQ3M0YwQUFTUkVaSjZUOCZlbmNyeXB0ZWRBZElkPUEwOTA4NzE2MlBGODVVMUtHTlIwRyZ3aWRnZXROYW1lPXNwX2F0ZiZhY3Rpb249Y2xpY2tSZWRpcmVjdCZkb05vdExvZ0NsaWNrPXRydWU= "https://www.amazon.com/Breadboard-Solderless-Prototype-Universal-Raspberry/dp/B07LF84HWK/ref=sr_1_2_sspa?keywords=arduino+breadboard&qid=1638163676&sr=8-2-spons&psc=1&smid=A14FP9XIRL6C1F&spLa=ZW5jcnlwdGVkUXVhbGlmaWVyPUExRURBV1paQTZUMEpFJmVuY3J5cHRlZElkPUEwNDY4MDQ3M0YwQUFTUkVaSjZUOCZlbmNyeXB0ZWRBZElkPUEwOTA4NzE2MlBGODVVMUtHTlIwRyZ3aWRnZXROYW1lPXNwX2F0ZiZhY3Rpb249Y2xpY2tSZWRpcmVjdCZkb05vdExvZ0NsaWNrPXRydWU=") listed as optional in the parts list. As you can see in the image below, you can test your wiring before making it more permanent with solder. Some parts can and should still be soldered (e.g., the screen and the backpack), but you will not regret testing the wiring before committing to solder.

![](/posts/arduino-mq-3b-ethanol-sensor-behavioral-neuroscience-research/images/IMG_0800-min-768x1024.jpeg)

Successful Test Readout with Breadboard

![](/posts/arduino-mq-3b-ethanol-sensor-behavioral-neuroscience-research/images/65258649731__9EA374D0-5031-4C30-8B7E-748355CE1A17-1-min-768x1024.jpeg)

Cleaned Up Wiring

# Programming

The code provided at [GitHub](https://github.com/RobertDWhite/arduino_mq-3b/blob/main/MQ3_LCDi2C%5B454%5D.ino) was provided by [Dr. McCool](https://school.wakehealth.edu/Faculty/M/Brian-A-McCool). Download the code to your computer. I highly recommend [this post](https://chipwired.com/uploading-code-arduino/) on how to upload the code to your Arduino. Once you have the connections as described above with your uploaded program to the Arduino, your screen should read-out the voltage.

## Fine-Tuning the Read-Out

The backpack has a small circular potentiometer built onto it near the top-right corner. The potentiometer is labeled "Contrast." If your screen lights up but you do not see a read-out, you may need to turn the potentiometer to adjust the contrast on the screen. I had to adjust the contrast on each one of the modules I assembled.

**Caution:** As shown in the image below, the potentiometer was _**easily**_ displaced and broken. Be very careful when turning the potentiometer so you do not experience the same dilemma I did. This required a complete rewire for this particular module with a new external potentiometer to adjust contrast. I do not have a wiring schematic to share for this at this time, and if you happen to break the potentiometer, I recommend just getting a new backpack.

![](/posts/arduino-mq-3b-ethanol-sensor-behavioral-neuroscience-research/images/IMG_0798-min-768x1024.jpeg)

Broken Backpack Potentiometer

# Wrapping Up

**Congratulations** if you made it this far and everything is working! I hope this tutorial aids you in your endeavors and can be a positive contribution to your research or personal projects. If you have any questions or need assistance, please let me know in the comments or email me at [robert@whitematter.tech](mailto:robert@whitematter.tech) !

![](/posts/arduino-mq-3b-ethanol-sensor-behavioral-neuroscience-research/images/IMG_0825-min-768x1024.jpeg)

First Successful Unit

![](/posts/arduino-mq-3b-ethanol-sensor-behavioral-neuroscience-research/images/IMG_1882-min-768x1024.jpeg)

First Completed Unit

![](/posts/arduino-mq-3b-ethanol-sensor-behavioral-neuroscience-research/images/IMG_1883-min-1024x768.jpeg)

Undershot of a Successful Build

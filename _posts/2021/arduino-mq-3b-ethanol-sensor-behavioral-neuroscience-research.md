---
ID: 303
post_title: 'Arduino MQ-3B Ethanol Sensor: Behavioral Neuroscience Research'
post_name: >
  arduino-mq-3b-ethanol-sensor-behavioral-neuroscience-research
author: Robert White
post_date: 2021-12-11 18:28:56
layout: post
link: >
  https://whitematter.tech/2021/arduino-mq-3b-ethanol-sensor-behavioral-neuroscience-research/
published: true
tags:
  - arduino
  - Research
  - science
  - tutorials
categories:
  - Arduino
  - Research
  - Science
  - Tutorials
---
<!-- wp:heading {"level":1} -->

# Introduction

<!-- /wp:heading -->

<!-- wp:paragraph {"dropCap":true} -->

<p class="has-drop-cap">
  Recently, I had the opportunity to collaborate with a university research lab to build some vapor sensors to roughly measure ethanol (EtOH) vapor within an operant chamber. This project was a lot of fun.
</p>

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

With extremely limited circuit documentation on the web and never having personally used Arduino before, there were a lot of interesting hiccups I ran into. Overall, this project was a bit out of my wheelhouse, but with much determination, the finished product turned out rather nicely.

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

This project was made possible and open-source by the work of <a href="https://school.wakehealth.edu/Faculty/M/Brian-A-McCool" target="_blank" rel="noreferrer noopener">Dr. Brian McCool</a>. The Arduino code hosted on <a href="https://github.com/RobertDWhite/arduino_mq-3b" target="_blank" rel="noreferrer noopener">GitHub</a>, the general project design (along with most of the corresponding recommended parts list), and the conceptual use of the project for alcohol research are his work.

<!-- /wp:paragraph -->

<!-- wp:heading {"level":1} -->

# The Lab

<!-- /wp:heading -->

<!-- wp:paragraph -->

This project was completed for the <a href="https://www.aradlab.com/" target="_blank" rel="noreferrer noopener">Reward and Addictive Disorders (RAD)</a> Lab at Miami University by Dr. Anna Radke.

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

The sensors will be used in a current experiment utilizing mouse operant chambers for a visual representation of the EtOH vapor pressure in the chambers. The support of this experiment utilizing these modules is under the direction of Elizabeth Sneddon *(PhD candidate at the time of this writing; recipient of the prestigious DSPAN F99/K00 from NINDS -- read more from the <a href="https://www.aradlab.com/news" target="_blank" rel="noreferrer noopener">Lab News here</a>)*.

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

I highly recommend checking out <a href="https://www.aradlab.com/" target="_blank" rel="noreferrer noopener">the RAD Lab's website</a> for more information on Dr. Radke and both her incredibly talented graduate students and undergraduate students. You can find information about many of their current projects.

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

***Shameless plug:*** You can also check out a paper from the RAD Lab of which I am an author: <a href="https://pubmed.ncbi.nlm.nih.gov/30431655/" target="_blank" rel="noreferrer noopener">https://pubmed.ncbi.nlm.nih.gov/30431655/</a>

<!-- /wp:paragraph -->

<!-- wp:image {"id":379,"sizeSlug":"large","linkDestination":"none"} --><figure class="wp-block-image size-large">

<img src="https://whitematter.tech/wp-content/uploads/2021/12/IMG_0825-min-768x1024.jpeg" alt="" class="wp-image-379" /><figcaption>First Successful Unit</figcaption></figure> <!-- /wp:image -->

<!-- wp:heading {"level":1} -->

# The Parts

<!-- /wp:heading -->

<!-- wp:heading {"level":4} -->

#### <strong style="color: revert; font-size: revert; font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Oxygen-Sans, Ubuntu, Cantarell, &quot;Helvetica Neue&quot;, sans-serif;">Per Module Quick List</strong><span style="color: revert; font-size: revert; font-weight: revert; font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Oxygen-Sans, Ubuntu, Cantarell, &quot;Helvetica Neue&quot;, sans-serif;">: </span>

<!-- /wp:heading -->

<!-- wp:list -->

*   <span style="color: initial; font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Oxygen-Sans, Ubuntu, Cantarell, &quot;Helvetica Neue&quot;, sans-serif;"></span><a href="https://amzn.to/3cVsZRE" target="_blank" rel="noreferrer noopener">Arduino Uno R3</a>
*   [Arduino Proto Shield for Arduino Kit (Stackable)][1]
*   <a href="https://www.adafruit.com/product/337" title="https://www.adafruit.com/product/337" target="_blank" rel="noreferrer noopener">Clear Enclosure for Arduino (adafruit.com)</a>
*   Standard LCD 16x2 screen ***(<a href="https://www.adafruit.com/product/181" target="_blank" rel="noreferrer noopener">adafruit.com version</a>) (<a href="https://www.amazon.com/Adafruit-Assembled-Standard-16x2-extras/dp/B01GQFVRCM/ref=sr_1_2?keywords=Standard+LCD+16x2+%2B+extras+-+white+on+blue&qid=1637993936&s=electronics&sr=1-2" target="_blank" rel="noreferrer noopener">amazon.com pre-soldered jumpers</a>)***
*   [i2c/SPI character LCD backpack][2]
*   <a href="https://www.sparkfun.com/products/8880" target="_blank" rel="noreferrer noopener">MQ-3 alcohol gas sensor (sparkfun.com)</a>
*   Power supply (see comments below)
*   <a href="https://amzn.to/3FVAVif" target="_blank" rel="noreferrer noopener">Standard USB printer cable</a>
*   500Ohm Trim Potentiometer (for rat operant boxes); 1k-2kOhm Trim Potentiometer (for mouse operant boxes) -- <a href="https://amzn.to/318VPLq" target="_blank" rel="noreferrer noopener">this kit contains 4 of each along with other (unnecessary for this project) resistance values</a>
*   Wiring: while there are many options for wires, <a href="https://www.amazon.com/Elegoo-EL-CP-004-Multicolored-Breadboard-arduino/dp/B01EV70C78/ref=pd_bxgy_img_2/132-1315716-1567653?pd_rd_w=cSDZ2&pf_rd_p=c64372fa-c41c-422e-990d-9e034f73989b&pf_rd_r=CH2KN5DS1W5BYMAQP5BN&pd_rd_r=4b0add23-3cdd-4e21-b3e6-f153ec79ec22&pd_rd_wg=HVNXr&pd_rd_i=B01EV70C78&th=1" target="_blank" rel="noreferrer noopener">this kit</a> has an assortment of Male-Female, Male-Male, and Female-Female wires that will be helpful in learning/testing the circuit later
*   ***Optional:*** <a href="https://www.amazon.com/Breadboard-Solderless-Prototype-Universal-Raspberry/dp/B07LF84HWK/ref=sr_1_2_sspa?keywords=arduino+breadboard&qid=1638163676&sr=8-2-spons&psc=1&smid=A14FP9XIRL6C1F&spLa=ZW5jcnlwdGVkUXVhbGlmaWVyPUExRURBV1paQTZUMEpFJmVuY3J5cHRlZElkPUEwNDY4MDQ3M0YwQUFTUkVaSjZUOCZlbmNyeXB0ZWRBZElkPUEwOTA4NzE2MlBGODVVMUtHTlIwRyZ3aWRnZXROYW1lPXNwX2F0ZiZhY3Rpb249Y2xpY2tSZWRpcmVjdCZkb05vdExvZ0NsaWNrPXRydWU=" target="_blank" rel="noreferrer noopener" title="https://www.amazon.com/Breadboard-Solderless-Prototype-Universal-Raspberry/dp/B07LF84HWK/ref=sr_1_2_sspa?keywords=arduino+breadboard&qid=1638163676&sr=8-2-spons&psc=1&smid=A14FP9XIRL6C1F&spLa=ZW5jcnlwdGVkUXVhbGlmaWVyPUExRURBV1paQTZUMEpFJmVuY3J5cHRlZElkPUEwNDY4MDQ3M0YwQUFTUkVaSjZUOCZlbmNyeXB0ZWRBZElkPUEwOTA4NzE2MlBGODVVMUtHTlIwRyZ3aWRnZXROYW1lPXNwX2F0ZiZhY3Rpb249Y2xpY2tSZWRpcmVjdCZkb05vdExvZ0NsaWNrPXRydWU=">Breadboard </a>(this is super helpful to learn/test the circuit before you commit to soldering, but it is definitely not a requirement)
*   ***Optional: ***This project REQUIRES soldering. I used<a href="https://amzn.to/31BtYEb" target="_blank" rel="noreferrer noopener"> this soldering iron kit here</a>. In addition to this soldering iron, a <a href="https://amzn.to/3pAkNMm" target="_blank" rel="noreferrer noopener">solder sucker kit</a> is highly recommended when you make a mistake.

<!-- /wp:list -->

<!-- wp:paragraph -->

***Power supply notes: ***For the power supply, you can theoretically use a *[5V 2A power supply][3]*, but I did not have luck with this option. For some reason, the voltage would drop to 3V on the Arduino unit when powered via this method. 3V is insufficient to run the readout on the screen, and I did not end up using this method for the finished product. If you want to test for yourself or know of some way to make this work, you could consider this <a href="https://amzn.to/3ldMdpT" target="_blank" rel="noreferrer noopener">5V 2A switching power supply</a>.

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

Otherwise, I highly recommend powering your Arduino unit with <a href="https://amzn.to/3FVAVif" target="_blank" rel="noreferrer noopener">a standard USB printer cable</a> and a<a href="https://www.amazon.com/Charger-LUOATIP-Adapter-Charging-Replacement/dp/B07TK6MPNB/ref=sr_1_5?keywords=5v+2a+power+block+usb&qid=1637993414&s=electronics&sr=1-5" target="_blank" rel="noreferrer noopener"> USB power block</a>. Your mileage with that particular power block may vary, as it is specifically 5V and 2.1A. I did not use this particular power block but instead used an Apple power block for an iPhone. Any block that supplies at minimum 5V and 2A should be sufficient.

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

Nonetheless, you will need at least one <a href="https://amzn.to/3FVAVif" target="_blank" rel="noreferrer noopener">standard USB printer cable</a> in order to transfer the program to the Arduino device for the readout. This is covered in the Programming section.

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

This list is adapted from a list shared by <meta charset="utf-8" />

<a href="https://school.wakehealth.edu/Faculty/M/Brian-A-McCool" target="_blank" rel="noreferrer noopener">Dr. Brian McCool</a>.

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

*As an Amazon Associate, I earn from qualifying purchases. **Thank you** for supporting the maintenance of this blog. The pricing will be the same for you regardless if you use my links or not! Thanks for your support!*

<!-- /wp:paragraph -->

<!-- wp:heading {"level":1} -->

# The Circuit

<!-- /wp:heading -->

<!-- wp:paragraph -->

This circuit diagram was drawn by my father, a radio and broadcast engineer, and I am very appreciative of his work and direction with this particular project. Hopefully this drawing can be useful to you or a technically-inclined student in your lab. ***Drawn by RW 09/04/2021***

<!-- /wp:paragraph -->

<!-- wp:image {"id":348,"width":840,"height":643,"sizeSlug":"large","linkDestination":"none"} --><figure class="wp-block-image size-large is-resized">

<img src="https://whitematter.tech/wp-content/uploads/2021/11/Screenshot-2021-11-25-012016-1024x784.png" alt="" class="wp-image-348" width="840" height="643" /><figcaption><a href="https://drive.google.com/file/d/1gVgyCg9lm8LaurHVQtRFqXGifgDlCiEb/view?usp=sharing" target="_blank" rel="noreferrer noopener">Arduino with MQ-3B Sensor Module Wiring Diagram</a></figcaption></figure> <!-- /wp:image -->

<!-- wp:paragraph -->

**See or download the diagram here** <a href="https://drive.google.com/file/d/1gVgyCg9lm8LaurHVQtRFqXGifgDlCiEb/view?usp=sharing" target="_blank" rel="noreferrer noopener">https://drive.google.com/file/d/1gVgyCg9lm8LaurHVQtRFqXGifgDlCiEb/view?usp=sharing</a> **OR here** <a href="https://github.com/RobertDWhite/arduino_mq-3b" target="_blank" rel="noreferrer noopener">https://github.com/RobertDWhite/arduino_mq-3b</a>

<!-- /wp:paragraph -->

<!-- wp:heading {"level":1} -->

# Assembling the Arduino

<!-- /wp:heading -->

<!-- wp:paragraph {"dropCap":true} -->

<p class="has-drop-cap">
  The order of completing these steps does not necessarily matter, but this is the order I completed them.
</p>

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

I am certainly no Arduino expert. In fact, this project was my first experience with Arduino. I definitely had a fun (sometimes irritating) time building the modules. Unfortunately, I did not take as many pictures as I should have of the process or the built circuit (mostly because I did not intend to write this up). If I have an opportunity to build more in the future, I will update this post with more / better pictures.

<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->

### Preparing the Protoshield and Connecting to the Mainboard

<!-- /wp:heading -->

<!-- wp:paragraph -->

Assembling the Protoshield will require some soldering. You will see the many components included with the Protoshield nearly immediately. These components should be assembled to look like the image below. Specifically not the location of the capacitors, resistors, switches/buttons, and LEDs. The components can be soldered from the bottom of the board.

<!-- /wp:paragraph -->

<!-- wp:image {"id":363,"sizeSlug":"full","linkDestination":"none"} --><figure class="wp-block-image size-full">

<img src="https://whitematter.tech/wp-content/uploads/2021/12/external-content.duckduckgo-2.jpg" alt="" class="wp-image-363" /></figure> <!-- /wp:image -->

<!-- wp:paragraph -->

The black pinouts should be matched and aligned as shown in the picture above as well. Those should also be soldered from the bottom (see picture below for clarity), and they will be used to align the Protoshield to the Mainboard. The pins soldered to the Protoshield will insert into the pinouts on the Mainboard.

<!-- /wp:paragraph -->

<!-- wp:image {"id":364,"sizeSlug":"full","linkDestination":"none"} --><figure class="wp-block-image size-full">

<img src="https://whitematter.tech/wp-content/uploads/2021/12/external-content.duckduckgo-1.jpg" alt="" class="wp-image-364" /></figure> <!-- /wp:image -->

<!-- wp:paragraph -->

Once complete, your Protoshield and Mainboard should look like the first image above.

<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->

### Connect the LCD Backpack to the LCD Screen

<!-- /wp:heading -->

<!-- wp:paragraph -->

The 16-pin connector will be used to connect the backpack to the screen. The front of the screen should be soldered using the short ends of the connectors (see image below). Solder all 16-pins.

<!-- /wp:paragraph -->

<!-- wp:image {"id":365,"sizeSlug":"full","linkDestination":"none"} --><figure class="wp-block-image size-full">

<img src="https://whitematter.tech/wp-content/uploads/2021/12/external-content.duckduckgo.jpg" alt="" class="wp-image-365" /></figure> <!-- /wp:image -->

<!-- wp:paragraph -->

***Protip***: Attach the 5-screw pins to the backpack before continuing. Once the backpack is attached to the screen, adding the screw pins is *very very* difficult.

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

From the other side, attach the backpack and solder all 16-pins as shown in the image below.

<!-- /wp:paragraph -->

<!-- wp:image {"id":366,"sizeSlug":"full","linkDestination":"none"} --><figure class="wp-block-image size-full">

<img src="https://whitematter.tech/wp-content/uploads/2021/12/external-content.duckduckgo-3.jpg" alt="" class="wp-image-366" /></figure> <!-- /wp:image -->

<!-- wp:paragraph -->

The GND, 5V, CLK, and DAT ports are shown on the Diagram as the *READ-OUT BOARD*.

<!-- /wp:paragraph -->

<!-- wp:heading -->

## Wire the Protoshield

<!-- /wp:heading -->

<!-- wp:paragraph -->

Unfortunately, I do not have too many detailed images of the Protoshield with the wires attached. In the image below, you can see how I wired the 5V and the Ground from the Mainboard to the central 5V and GND. From there, all the required 5V and Ground wires can be soldered to the center for easy access.

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

When wiring, I recommend using one of the <a href="https://www.amazon.com/Breadboard-Solderless-Prototype-Universal-Raspberry/dp/B07LF84HWK/ref=sr_1_2_sspa?keywords=arduino+breadboard&qid=1638163676&sr=8-2-spons&psc=1&smid=A14FP9XIRL6C1F&spLa=ZW5jcnlwdGVkUXVhbGlmaWVyPUExRURBV1paQTZUMEpFJmVuY3J5cHRlZElkPUEwNDY4MDQ3M0YwQUFTUkVaSjZUOCZlbmNyeXB0ZWRBZElkPUEwOTA4NzE2MlBGODVVMUtHTlIwRyZ3aWRnZXROYW1lPXNwX2F0ZiZhY3Rpb249Y2xpY2tSZWRpcmVjdCZkb05vdExvZ0NsaWNrPXRydWU=" target="_blank" rel="noreferrer noopener" title="https://www.amazon.com/Breadboard-Solderless-Prototype-Universal-Raspberry/dp/B07LF84HWK/ref=sr_1_2_sspa?keywords=arduino+breadboard&qid=1638163676&sr=8-2-spons&psc=1&smid=A14FP9XIRL6C1F&spLa=ZW5jcnlwdGVkUXVhbGlmaWVyPUExRURBV1paQTZUMEpFJmVuY3J5cHRlZElkPUEwNDY4MDQ3M0YwQUFTUkVaSjZUOCZlbmNyeXB0ZWRBZElkPUEwOTA4NzE2MlBGODVVMUtHTlIwRyZ3aWRnZXROYW1lPXNwX2F0ZiZhY3Rpb249Y2xpY2tSZWRpcmVjdCZkb05vdExvZ0NsaWNrPXRydWU=">breadboards</a> listed as optional in the parts list. As you can see in the image below, you can test your wiring before making it more permanent with solder. Some parts can and should still be soldered (e.g., the screen and the backpack), but you will not regret testing the wiring before committing to solder.

<!-- /wp:paragraph -->

<!-- wp:image {"id":377,"sizeSlug":"large","linkDestination":"none"} --><figure class="wp-block-image size-large">

<img src="https://whitematter.tech/wp-content/uploads/2021/12/IMG_0800-min-768x1024.jpeg" alt="" class="wp-image-377" /><figcaption>Successful Test Readout with Breadboard</figcaption></figure> <!-- /wp:image -->

<!-- wp:image {"id":376,"sizeSlug":"large","linkDestination":"none"} --><figure class="wp-block-image size-large">

<img src="https://whitematter.tech/wp-content/uploads/2021/12/65258649731__9EA374D0-5031-4C30-8B7E-748355CE1A17-1-min-768x1024.jpeg" alt="" class="wp-image-376" /><figcaption>Cleaned Up Wiring</figcaption></figure> <!-- /wp:image -->

<!-- wp:heading {"level":1} -->

# Programming

<!-- /wp:heading -->

<!-- wp:paragraph -->

The code provided at <a href="https://github.com/RobertDWhite/arduino_mq-3b/blob/main/MQ3_LCDi2C%5B454%5D.ino" target="_blank" rel="noreferrer noopener">GitHub</a> was provided by <a href="https://school.wakehealth.edu/Faculty/M/Brian-A-McCool" target="_blank" rel="noreferrer noopener">Dr. McCool</a>. Download the code to your computer. I highly recommend<a href="https://chipwired.com/uploading-code-arduino/" target="_blank" rel="noreferrer noopener"> this post</a> on how to upload the code to your Arduino. Once you have the connections as described above with your uploaded program to the Arduino, your screen should read-out the voltage.

<!-- /wp:paragraph -->

<!-- wp:heading -->

## Fine-Tuning the Read-Out

<!-- /wp:heading -->

<!-- wp:paragraph -->

The backpack has a small circular potentiometer built onto it near the top-right corner. The potentiometer is labeled "Contrast." If your screen lights up but you do not see a read-out, you may need to turn the potentiometer to adjust the contrast on the screen. I had to adjust the contrast on each one of the modules I assembled.

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

**Caution:** As shown in the image below, the potentiometer was ***easily*** displaced and broken. Be very careful when turning the potentiometer so you do not experience the same dilemma I did. This required a complete rewire for this particular module with a new external potentiometer to adjust contrast. I do not have a wiring schematic to share for this at this time, and if you happen to break the potentiometer, I recommend just getting a new backpack.

<!-- /wp:paragraph -->

<!-- wp:image {"id":350,"sizeSlug":"large","linkDestination":"none"} --><figure class="wp-block-image size-large">

<img src="https://whitematter.tech/wp-content/uploads/2021/11/IMG_0798-min-768x1024.jpeg" alt="" class="wp-image-350" /><figcaption>Broken Backpack Potentiometer</figcaption></figure> <!-- /wp:image -->

<!-- wp:heading {"level":1} -->

# Wrapping Up

<!-- /wp:heading -->

<!-- wp:paragraph -->

**Congratulations **if you made it this far and everything is working! I hope this tutorial aids you in your endeavors and can be a positive contribution to your research or personal projects. If you have any questions or need assistance, please let me know in the comments or email me at <a href="mailto:robert@whitematter.tech" target="_blank" rel="noreferrer noopener">robert@whitematter.tech</a> !

<!-- /wp:paragraph -->

<!-- wp:image {"id":352,"width":768,"height":1024,"sizeSlug":"large","linkDestination":"none"} --><figure class="wp-block-image size-large is-resized">

<img src="https://whitematter.tech/wp-content/uploads/2021/11/IMG_0825-min-768x1024.jpeg" alt="" class="wp-image-352" width="768" height="1024" /><figcaption>First Successful Unit</figcaption></figure> <!-- /wp:image -->

<!-- wp:image {"id":354,"sizeSlug":"large","linkDestination":"none"} --><figure class="wp-block-image size-large">

<img src="https://whitematter.tech/wp-content/uploads/2021/11/IMG_1882-min-768x1024.jpeg" alt="" class="wp-image-354" /><figcaption>First Completed Unit</figcaption></figure> <!-- /wp:image -->

<!-- wp:image {"id":353,"sizeSlug":"large","linkDestination":"none"} --><figure class="wp-block-image size-large">

<img src="https://whitematter.tech/wp-content/uploads/2021/11/IMG_1883-min-1024x768.jpeg" alt="" class="wp-image-353" /><figcaption>Undershot of a Successful Build</figcaption></figure> <!-- /wp:image -->

 [1]: https://amzn.to/3p3AT0S "https://amzn.to/3p3AT0S"
 [2]: https://www.amazon.com/Adafruit-i2c-Character-Backpack-ADA292/dp/B00OKCON84/ref=sr_1_2?keywords=i2c%2FSPI+character+LCD+backpack%2C&qid=1637994049&s=electronics&sr=1-2 "https://www.amazon.com/Adafruit-i2c-Character-Backpack-ADA292/dp/B00OKCON84/ref=sr_1_2?keywords=i2c%2FSPI+character+LCD+backpack%2C&qid=1637994049&s=electronics&sr=1-2"
 [3]: https://amzn.to/3ldMdpT "https://amzn.to/3ldMdpT"


 <!-- wp:heading -->

 ## Contribute {#contribute}

 <!-- /wp:heading -->

 <!-- wp:paragraph -->

 Do you notice any issues or want to add information to this post? Visit the link below to submit a PR on GitHub with your modifications in Markdown.
 <!-- /wp:paragraph -->
 [giw_edit_link]

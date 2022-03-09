---
title: "Live Better with Circadian Lighting"
date: "2021-05-25"
categories:
  - "home-automation"
  - "tutorials"
tags:
  - "health"
  - "home-automation"
  - "iot"
  - "open-source"
coverImage: "external-content.duckduckgo.jpg"
---

**A Little Background and Some Thoughts**

With today's technology, we are constantly bombarded with High Energy Visible (HEV) blue light from our screens as well as inconsistent lighting throughout the day within our homes and workplaces. Like all mammalian species, we humans have our own circadian rhythms which occur naturally and are vitally important to our health and well-being. Rather than writing an essay on the importance of our natural circadian rhythms, check out the educational write-up from the [NIH here](https://www.nigms.nih.gov/education/fact-sheets/Pages/circadian-rhythms.aspx "https://www.nigms.nih.gov/education/fact-sheets/Pages/circadian-rhythms.aspx"). Hopefully this will help explain the "why" of this particular post.

Use of Home Automation and open-source resources allows us to program our homes and lights to keep our natural rhythms aligned and consistent. This is an excellent use of technology to encourage a more natural environment, when technology often lends itself to the opposite effect (especially considering HEV blue light, etc.).

I whole-heartedly recommend this described home automation to better your health and your family's health, both mentally and physically. My wife and I are expecting our first child later this year. Evidence suggests that disruptions of the circadian rhythm of a prospective mother may have [negative implications for her offspring after birth.](https://pubmed.ncbi.nlm.nih.gov/32210175/) Additionally, research suggests certain reasonable modifiable behaviors, [such as simply going to sleep earlier](https://www.nature.com/articles/s41398-020-0683-3), not only may positively impact a newborn child but also may protect against certain symptoms in the mother in the early postpartum period. There are hundreds of studies around circadian rhythms concerning the non-pregnant as well. In my years of undergraduate/post-bacc work in psychology and neuroscience as well as my graduate training in medical school, we studied the positive impact of natural physical inclinations to one's overall physical and mental health. With the development and evolution of human life around a normal "sun-clock," we often reap benefit from tuning ourselves to our natural state and environment around us. Circadian Lighting can help your body stay in tune with the sun, even if you work third shift. Now, let's talk about how you can get this automation started for you and your family.

## **Getting Started**

This automation relies specifically on [Home Assistant](https://www.home-assistant.io/), a home automation platform designed to interact with your various smart-home devices from a single web-panel. You will need some smart lights _(I use and specifically recommend [Philips Hue with a Hue Bridge](https://amzn.to/2QOnxs9 "https://amzn.to/2QOnxs9"), though most other smart lights will probably work)_, a device to host Home Assistant _(like a [Raspberry Pi](https://amzn.to/34hK0kB), a Docker container, a NAS, or a PC of some sort)_, and finally, a little patience for the setup!

_As an Amazon Associate, I earn from qualifying purchases._ Thank you for _supporting the maintenance of this blog. The pricing will be the same for you regardless if you use my links or not! Thanks for your support!_

**Installing Home Assistant**

There are many excellent tutorials on the web for installing/setting up Home Assistant. I will not cover this, but I will refer you instead to the official [Home Assistant Documentation.](https://www.home-assistant.io/installation/ "https://www.home-assistant.io/installation/")

**Configuring Home Assistant and Installing Circadian Lighting**

First, download Circadian Lighting. There are two options for this. [Option 1](https://github.com/robertomano24/circadian_lighting-hue "https://github.com/robertomano24/circadian_lighting-hue") is recommended if you use Phillips Hue lights and have a Hue bridge. [Option 2](https://github.com/robertomano24/circadian_lighting "https://github.com/robertomano24/circadian_lighting") is recommended if you do not use Phillips Hue lights. For whichever option you choose, hit the link and click the green "Code" button near the top right of the screen. Choose to "Download Zip." Once the Zip is downloaded, use your favorite archive utility to extract the contents of the Zip.

You then must make a folder within your Home Assistant config root folder called "_custom\_components_" _(without the quotes)_. See the image below, as this folder should be in the same directory as the _configuration.yaml_. Inside the _custom\_components_ folder, make a folder called "_circadian\_lighting_" _(without the quotes)_. Inside that folder, place the contents of the Zip (I.e., _\_\_\_init\_\_\_.py, manifest.json, sensor.py, services.yaml_, and _switch.py_). The structure should look like this: _config/custom\_components/circadian\_lighting/_

![](/posts/images/Screen-Shot-2021-05-24-at-10.14.06-PM-1-1024x272.png)

Folder Structure Setup

Next, we will need to modify the _configuration.yaml_. We need to add the following lines to the file:

```
# Example configuration.yaml entry
circadian_lighting:
```

Next, you will need to create a switch in Home Assistant, which will act as a controller to turn of Circadian Lighting if you want to use your color lights or change the brightness at some point. Here is an example:

```
# Example configuration.yaml entry
switch:
  - platform: circadian_lighting
    lights_ct:
      - light.desk
      - light.lamp
```

If you want, you can create multiple switches so you can turn Circadian Lighting off in one, two, or more rooms independently from the rest of your home. You must add your lights manually to each switch by adding the entity ID from Home Assistant. You can see my personal example of multiple switches on my [Home Assistant GitHub repo](https://github.com/robertomano24/home-assistant/blob/master/switch/circadian_lighting.yaml).

**Hue Specific Setup (Option 1)**

The main difference between Option 1 and Option 2 mentioned above is that Option 1 allows you to have scenes set per room that can be assigned to a Hue switch, which lets you turn on your lights to the correct Circadian Lighting value. In each room where you would like to turn on the Circadian Light scene with a Hue switch/dimmer, you will need a scene in that room called "Circadian" without quotes. The "C" must be capitalized. I use the [iConnectHue app](https://iconnecthue.com/) on my iPhone to make these scenes. Different apps may not appropriately make the scenes, and I recommend iConnectHue anyway. In a room, like Kitchen, add a scene with the bulbs you would like to be turned on with your switch. The color/brightness values do not matter as this plugin will overwrite them. Create the Circadian scene and assign the scene to your switch (see the images below for screenshots of my iConnectHue app setup).

![](/posts/images/IMG_0311-473x1024.jpeg)

Kitchen Lights Example

![](/posts/images/IMG_0312-1-473x1024.jpeg)

Created Scene Example

There you have it! Once the scene is setup (for Option 1, only), your setup is complete! Option 2 will be complete too! The last thing to do is restart your Home Assistant instance, and your Circadian Lights will be keeping your rhythm in sync with nature! For advanced setup ideas, check out the "[Issues](https://github.com/claytonjn/hass-circadian_lighting/issues)" on GitHub.

**Wrapping Up**

I hope this post was helpful getting your Circadian Lighting plugin working. I truly believe it will aid the physical and mental health of you and your family. If you have any issues, questions, or something was not clear in this post, please comment below, email me at [robert@whitematter.tech,](mailto:robert@whitematter.tech "mailto:robert@whitematter.tech") or make an "Issue" on GitHub. Since you have IoT devices on your network, be sure to check out the [post on securing your network with VLANs](https://whitematter.tech/2021/how-to-add-vlan-segmentation-for-homekit-iot-devices-with-unifi/)

Thanks for reading!

**_Note: For your first launch with the plugin installed, you may need to turn on the Switch(s) manually. On your Home Assistant Dashboard, you can add entities to your home page like the image below. Once added, you can flip the switch to enable Circadian Lighting for those lights!_**

![](/posts/images/Screen-Shot-2021-05-24-at-11.09.04-PM.png)

CL Switches on Home Assistant Dashboard

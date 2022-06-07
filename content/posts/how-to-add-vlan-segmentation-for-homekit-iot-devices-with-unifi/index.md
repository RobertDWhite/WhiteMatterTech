---
title: "How to Add VLAN Segmentation for HomeKit IoT Devices with Unifi"
date: "2021-04-09"
lastmod: "2022-06-07"
categories:
  - "networking"
  - "security"
  - "tips"
  - "tutorials"
tags:
  - "hardening"
  - "iot"
  - "network"
  - "vlan"
cover:
    image: "/posts/how-to-add-vlan-segmentation-for-homekit-iot-devices-with-unifi/header_how-to-add-vlan-segmentation-for-homekit-iot-devices-with-unifi.jpg"
    alt: "IoT Graphic"
    caption: "<text>"
    relative: true
aliases:
    - /posts/how-to-add-vlan-segmentation-for-homekit-iot-devices-with-unifi/how-to-add-vlan-segmentation-for-homekit-iot-devices-with-unifi
    - /2021/how-to-add-vlan-segmentation-for-homekit-iot-devices-with-unifi/
---

## IoT Overview

The smart world of Internet-of-Things (IoT) devices is ever growing. From everyday lightbulbs to the sprinkler out front, just about every household appliance and utility has a smart-counterpart. For example, my smart home is fully Apple HomeKit compatible and consists of a [Hue bridge with lightbulbs](https://www.amazon.com/gp/product/B07XH4KDR5/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B07XH4KDR5&linkCode=as2&tag=whitematter-20&linkId=df6ecd2d3d2499551ee4fb509a49587b), [Lutron Caseta smart dimmers/switches](https://www.amazon.com/gp/product/B00KLAXFQA/ref=as_li_qf_asin_il_tl?ie=UTF8&tag=whitematter-20&creative=9325&linkCode=as2&creativeASIN=B00KLAXFQA&linkId=7921a6374b4b40c94161f4278c1b33d8 "https://www.amazon.com/gp/product/B00KLAXFQA/ref=as_li_qf_asin_il_tl?ie=UTF8&tag=whitematter-20&creative=9325&linkCode=as2&creativeASIN=B00KLAXFQA&linkId=7921a6374b4b40c94161f4278c1b33d8"), [Eve Aqua outdoor water hose control](https://www.amazon.com/gp/product/B08FBHCPPF/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B08FBHCPPF&linkCode=as2&tag=whitematter-20&linkId=5505218457879d684052765e37db35fa "https://www.amazon.com/gp/product/B08FBHCPPF/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B08FBHCPPF&linkCode=as2&tag=whitematter-20&linkId=5505218457879d684052765e37db35fa"), [iSmartGate garage door opener](https://www.amazon.com/gp/product/B07Q1J7RZM/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B07Q1J7RZM&linkCode=as2&tag=whitematter-20&linkId=dae9862d26805fd0af1e8817bd8645c2 "https://www.amazon.com/gp/product/B07Q1J7RZM/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B07Q1J7RZM&linkCode=as2&tag=whitematter-20&linkId=dae9862d26805fd0af1e8817bd8645c2"), [Schlage deadbolt](https://www.amazon.com/gp/product/B00YUPE85Y/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B00YUPE85Y&linkCode=as2&tag=whitematter-20&linkId=f1f239d916e964e7ba0ed727e7ad4d14 "https://www.amazon.com/gp/product/B00YUPE85Y/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B00YUPE85Y&linkCode=as2&tag=whitematter-20&linkId=f1f239d916e964e7ba0ed727e7ad4d14"), [Eve motion sensor](https://www.amazon.com/gp/product/B01MAV39M8/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B01MAV39M8&linkCode=as2&tag=whitematter-20&linkId=3c4d273460c2b1f2a7201582bb50342e), [Sonos speakers](https://www.amazon.com/gp/product/B07W6RYRZM/ref=as_li_qf_asin_il_tl?ie=UTF8&tag=whitematter-20&creative=9325&linkCode=as2&creativeASIN=B07W6RYRZM&linkId=c06286ddb9cac861e2da524be2f6acc4) throughout the house, a [Vocolinc oil diffuser](https://www.amazon.com/gp/product/B07HMPY7RX/ref=as_li_qf_asin_il_tl?ie=UTF8&tag=whitematter-20&creative=9325&linkCode=as2&creativeASIN=B07HMPY7RX&linkId=3bc57ed9890dc0278b52db28c3d42511), [Vocolionc power strip](https://www.amazon.com/gp/product/B083NFNN99/ref=as_li_qf_asin_il_tl?ie=UTF8&tag=whitematter-20&creative=9325&linkCode=as2&creativeASIN=B083NFNN99&linkId=fc19219e0df43f4a1c56d63749dbad2c), a couple [iRobot Roomba](https://www.amazon.com/gp/product/B08C4JXBPF/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B08C4JXBPF&linkCode=as2&tag=whitematter-20&linkId=7500e53510ab70cfb9e0d237978fe197) vacuum cleaners, some [Vocolinc pluggable outlets](https://www.amazon.com/gp/product/B07NJRS8TX/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B07NJRS8TX&linkCode=as2&tag=whitematter-20&linkId=5ab28257a60b56e62c85132b2afce653), an [Ecobee thermostat](https://www.amazon.com/gp/product/B06W56TBLN/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B06W56TBLN&linkCode=as2&tag=whitematter-20&linkId=59b864438ae9a389b269066a2902cdde) to replace each analog thermostat in the house, and a [Unifi G4 Doorbell](https://www.amazon.com/gp/product/B08L3X9ZZX/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B08L3X9ZZX&linkCode=as2&tag=whitematter-20&linkId=19dd1b06c1c8884232de18bc438fefa1) (the doorbell is not technically compatible with HomeKit, but I added support with a third-party tool known as "[Homebridge](https://homebridge.io/)"). On top of all these smart home devices, I have a handful of other Unifi Protect cameras around my property.

_As an Amazon Associate, I earn from qualifying purchases._ Thank you for _supporting the maintenance of this blog. The pricing will be the same for you regardless if you use my links or not! Thanks for your support!_

---------------------------------------------------------------------------------------------------------
If you're reading this, you may not have quite that many devices, but you are probably either looking to invest in some smart home devices or you have already started the process of converting your home to the world of IoT. Either way, it is important to consider the security implications of adding these devices to your network. For example, some smart switches have such poor encryption that they are easily compromised and can be [overpowered to catch on fire](https://www.komando.com/security-privacy/smart-plugs-hacked/757290/). While none of the devices in my home have this sort of vulnerability that has been publicized, the possibility exists nonetheless that these devices could be used by nefarious actors to cause ruckus in my home or attempt to gain access to other devices on my network.

IoT devices continue to improve their security mechanisms (mostly), and IoT is certainly not going away anytime soon. Because of this, prudent users, like you, should consider how to best protect their internal resources. One recommended method of securing your network containing IoT devices is to segment your network with VLANs. I will show you how to segment your home network from your IoT devices with VLANs, including how to create subnets, VLANs, firewall rules, and how to enable IPS/IDS for good measure. To follow along, your network will need to be comprised of Unifi networking gear. My gateway and Unifi controller is the _[Unifi Dream Machine Pro](https://www.amazon.com/gp/product/B086967C9X/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B086967C9X&linkCode=as2&tag=whitematter-20&linkId=4fc0624a437d4bfe761f2ebb02ca61bd)_, though you could use any Unifi gateway + controller combination. Additionally, many other network providers besides Unifi will have similar functionality, and you will likely be able to accomplish some of these tasks with other gear.

_Check out a community ports list for IoT on GitHub here: [https://github.white.fm](https://github.com/RobertDWhite/IoT-ports)_

----------------------------------------------------------------
## **Creating VLANs and Segmenting the Network**

The first step is creating a VLAN for your IoT network. The easiest way to accomplish this task is to create a new subnet for your IoT network. For example, if you currently just have a single network for all of your Internet-connected devices, including your personal computers, phones, etc, you probably have a single subnet that looks something like this: 192.168.1.1/24. This is seen on your Unifi Controller by going to **Settings > Networks** (on the old GUI). I recommend you next click **_"Create New Network,_"** and name the network something like _"IoT"_. Specifically select _"Corporate"_ for the _"Purpose."_ It makes it easy to remember if you set the Gateway IP/Subnet 1 number off from your default network (e.g., set it to something like 192.168.2.1/24 or 192.168.10.1/24). Below, you will see my settings. Notice my Gateway is 10.100.1.1. My default subnet is 10.100.0.1, in contrast. For simplicity, I have _IGMP snooping_ and _UPNP_ enabled. This might help down the road for certain smart components like Home Assistant. For _VLAN_, set any number from _2-4018_. I set my _DHCP range_ to only include x.101-x.254 because I wanted to reserve the first 100 IPs in this subnet for static addressing. If you want all your devices to be DHCP, you do not need to modify this option. Go ahead and save this network.

![](/posts/how-to-add-vlan-segmentation-for-homekit-iot-devices-with-unifi/images/Screen-Shot-2021-04-08-at-3.03.01-PM-1024x879.png)

**Preparing the Wireless**

Since most IoT devices are wireless, you will need to create a wireless SSID for all of your IoT devices to connect to separately from the rest of your home network. Go to **Settings -> Wireless Networks**, and click **_"Create New Wireless Network."_** Name the SSID something memorable, and set the security to _"WPA Personal"_ (old GUI...the new GUI may allow you to specifically choose _WPA2_, in which case, do that). For _"Network,"_ choose the subnet/VLAN you made in the previous step. This will associate the new SSID to that particular network segment.

![](/posts/how-to-add-vlan-segmentation-for-homekit-iot-devices-with-unifi/images/Screen-Shot-2021-04-08-at-3.16.16-PM-1024x557.png)

Continue through the setup screen to _"Advanced Options."_ Here, I specifically have ONLY _2.4GHz_ enabled for _WiFi Bands_ because most IoT devices still only use 2.4GHz. If you happen to have some 5GHz IoT devices, the slightly better performance for those devices will likely be overshadowed by the constant disconnecting of your devices when both 2.4GHz and 5GHz are enabled simultaneously. IoT devices in general do a pretty bad job of handling Unifi APs with both bands enabled. Feel free to try enabling both bands in your environment, but if you have lots of issues with connectivity and the infamous **"No Response"** message on Apple HomeKit, I recommend again to stick with just 2.4GHz for now. Disable all of Unifi's _"BETA"_ tagged options like _Fast Roaming_, as these will also cause performance and connectivity issues. I also prevent my SSID from being broadcast to clean up the WiFi experience for users at home. It is a lot nicer to only see my LAN and my guest networks being broadcast. This will, however, force an extra step when you try to add devices to HomeKit, as you will need to connect your phone to the IoT WiFi before adding the IoT devices to that network. Manually adding the SSID can be tedious, but it is well worth it in my opinion once the overall setup is complete. I leave _GTK rekeying_ to _3600 seconds_. I also have a _User Group_ setup for IoT devices in case I want to throttle IoT in the future. Check to _Enable multicast enhancement (IGMPv3)_. Leave everything else as is, and you're finished with the Wireless setup.

![](/posts/how-to-add-vlan-segmentation-for-homekit-iot-devices-with-unifi/images/Screen-Shot-2021-04-08-at-3.15.50-PM-869x1024.png)

----------------------------------------------------
## **Blocking Traffic Between Subnets/VLANs**

The next part of this process will be setting up the Firewall to block traffic between the subnets/VLANs. Go to **Settings > Routing & Firewall > Firewall**. I will assume you are only using IPv4, and we will therefore only look at IPv4 rules. For a detailed definition of the _**WAN IN, WAN OUT, WAN LOCAL**_, etc. options, I will recommend you search the Internet. This part can be pretty confusing, and the definition of these options is outside the scope of this post. We will focus on **LAN IN** and **LAN LOCAL** for our purposes.

**LAN IN**

This portion can get complicated depending on how specific you want to be with allowances of devices between these network segments. I have a lot of different home automation programs running like HomeBridge and Home Assistant. I also have Sonos speakers, which need their own rules to function properly with your iPhone on a different subnet. If you have some IoT devices (no Sonos) without any external programs like HomeBridge, the only rules you will need to concern yourself with are 2003 and 2012.

![](/posts/how-to-add-vlan-segmentation-for-homekit-iot-devices-with-unifi/images/Screen-Shot-2021-04-08-at-3.48.20-PM-1024x335.png)

Let's look at the mentioned _Rule 2003_. Go ahead and create a rule in the **LAN IN** section. In the image below, you can see my settings for this rule. Essentially, this rule allows your devices in your default network to communicate with your IoT devices only (_traffic flow LAN -> IoT_). Match your settings to the settings below. Be sure _Action_ is set to _Accept_.

![](/posts/how-to-add-vlan-segmentation-for-homekit-iot-devices-with-unifi/images/Screen-Shot-2021-04-08-at-3.49.12-PM-1024x715.png)

Next, let's check out Rule 2012. Create a new rule and match to the image below. Note that _Action_ Is set to _Drop_. Also, note the _States_ that are checked are _New_ and _Invalid_. This prevents traffic from flowing from the **Source (IoT)** to **Destination (LAN)** (_traffic flow IoT ->X LAN_) based on the status of the traffic. Only _established_ and _related_ traffic will be allowed, then.

![](/posts/how-to-add-vlan-segmentation-for-homekit-iot-devices-with-unifi/images/Screen-Shot-2021-04-08-at-4.00.57-PM-1013x1024.png)

**LAN LOCAL**

![](/posts/how-to-add-vlan-segmentation-for-homekit-iot-devices-with-unifi/images/Screen-Shot-2021-04-08-at-3.44.52-PM-1024x209.png)

Next, let's check **LAN LOCAL** rules These rule is concerned with allowing [multicast DNS (mDNS)](https://www.ionos.com/digitalguide/server/know-how/multicast-dns/) traffic and with allowing HomeKit-specific ports to receive data as needed.

***mDNS***
For mDSN, we are only concerned with a single port: 5353. You will need two allow rules for mDNS: 1) source=_ANY:5353_ -> destination=_ANY:ANY_, and 2) source=_ANY:ANY_ -> destination=_ANY:5353_. See an example of the first rule in the image below.

![](/posts/how-to-add-vlan-segmentation-for-homekit-iot-devices-with-unifi/images/Screen-Shot-2021-04-08-at-4.09.28-PM-1024x884.png)

***HomeKit***
I have a _Port Group_ with ports 51826 and 51827 for HomeKit. Make your own rules and match your settings to the image below. All you will need to do is change your _source/destination_ like in the image below (Rules 2000-2003) to allow HomeKit communications. You can more finely tune this particular rule by granularly allowing different _source/destination_ combos (e.g., source: IoT, destination: home), but I am currently simply allowing any _source/destination_ combo to communicate over HomeKit ports.

![](/posts/how-to-add-vlan-segmentation-for-homekit-iot-devices-with-unifi/images/Screen-Shot-2021-04-08-at-3.44.52-PM-1024x209.png)


**In summary**, one rule will allow ANY:5353 -> ANY:ANY, one will allow ANY:ANY -> ANY:5353, one will allow ANY:51826-7 -> ANY:ANY, and finally one will allow ANY:ANY -> ANY:51826-7. Make and save your rules!



--------------------------------------------------------------
## Wrapping Up

There you have it! You now have a fully-functional HomeKit setup enabled with extra security practices to prevent mischief from poorly-secured IoT devices reaching your internal LAN. It is clear this does not mitigate 100% of the risk since we're allowing traffic to flow in opposite direction. You can lock your subnets down even more by experimenting with fully blocking your traffic from your LAN to your IoT network but ONLY allowing instead your HomeKit controller (e.g., Apple TV, Homepod, etc.). These rules can and probably should be tweaked to fit your environment, but the rules described above will at least get you started.

> As always, if you have any questions, feel free to start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a GitHub](https://github.com/RobertDWhite/WhiteMatterTech/pulls) PR to recommend changes/fixes in the article, or reach out to me directly at [robert@whitematter.tech](mailto:robert@whitematter.tech).
>
> Thanks for reading!
>
> Robert

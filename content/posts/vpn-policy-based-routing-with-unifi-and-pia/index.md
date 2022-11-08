---
title: "Policy Based Routing with Unifi, PIA, and pfSense: How I Route My IoT External Traffic through PIA VPN"
date: "2022-11-07"
categories:
  - "networking"
  - "security"
  - "tutorials"
tags:
  - "anonymous"
  - "encrypt"
  - "network"
  - "pfsense"
  - "unifi"
  - "vlan"
  - "policy"
cover:
    image: "/posts/vpn-policy-based-routing-with-unifi-and-pia/policy-route-unifi-pfsense-pia.png"
    alt: "pfSense, Unifi, & PIA Graphic"
    caption: "<text>"
aliases:
    - /posts/VPN-policy-based-routing-with-unifi-and-PIA/VPN-policy-based-routing-with-unifi-and-PIA/
    - /2022/VPN-policy-based-routing-with-unifi-and-PIA/

---

--------------------------------------------------------------------

# Introduction

In this post, I will show you how to use policy-based routing in Unifi to route specific traffic through a VPN client _(I use [Private Internet Access](http://www.privateinternetaccess.com/pages/buy-a-vpn/1218buyavpn?invite=U2FsdGVkX19vJeCiFLTHejdg7_UKL-kbJpMDRcdZ8ZM%2CwwbqkM0Pr8u1JywwOJHsqq-mX14))_ on pfSense. This setup allows you to retain complete control of your devices and subnets via Unifi's Network app while taking advantage of pfSense's ability to host a VPN client.

With this setup, I am getting my full ISP speeds on devices using a VPN for encryption. Depending on your hardware, you should be able to get full speeds as well.

This post will ***not*** detail how to setup the VPN client or how to segment a Unifi network with subnets and VLANs.
Instead, this post complements a previous post about [adding VLAN segmentation for HomeKit IoT devices with Unifi](http://whitematter.tech/posts/how-to-add-vlan-segmentation-for-homekit-iot-devices-with-unifi/) and ***requires*** [setting up a routable VPN client on pfSense as explained in a previous post](http://whitematter.tech/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/).

## Requirements

- ***Unifi Gateway*** with at least two WAN capable ports _\[in my case, the gateway is the [Unifi Dream Machine Pro](https://www.amazon.com/gp/product/B086967C9X/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B086967C9X&linkCode=as2&tag=whitematter-20&linkId=4fc0624a437d4bfe761f2ebb02ca61bd) (hereafter referred to as UDMP)\]_)
- ***VPN Client*** _(I use [Private Internet Access](http://www.privateinternetaccess.com/pages/buy-a-vpn/1218buyavpn?invite=U2FsdGVkX19vJeCiFLTHejdg7_UKL-kbJpMDRcdZ8ZM%2CwwbqkM0Pr8u1JywwOJHsqq-mX14))_
- ***pfSense*** (I built a custom baremetal pfSense machine with the following components: [Intel(R) Core(TM) i5-8500 CPU @ 3.00GHz](https://www.amazon.com/gp/product/B0759FGJ3Q/ref=as_li_tl?ie=UTF8&tag=whitematter-20&camp=1789&creative=9325&linkCode=as2&creativeASIN=B0759FGJ3Q&linkId=4867310b8da8586d142f13325ea48c62), [GIGABYTE B365M DS3H](https://www.amazon.com/gp/product/B07T6N8N56/ref=as_li_tl?ie=UTF8&tag=whitematter-20&camp=1789&creative=9325&linkCode=as2&creativeASIN=B07T6N8N56&linkId=790c04299d5dccec41764ccf5a8b1050), [Corsair Vengeance LPX 16GB](https://www.amazon.com/gp/product/B0143UM4TC/ref=as_li_tl?ie=UTF8&tag=whitematter-20&camp=1789&creative=9325&linkCode=as2&creativeASIN=B0143UM4TC&linkId=b021ad78bd94c0b12c1d29dd3e2d5dcf), [Thermaltake Smart 500W Power Supply](https://www.amazon.com/gp/product/B014W3EM2W/ref=as_li_tl?ie=UTF8&tag=whitematter-20&camp=1789&creative=9325&linkCode=as2&creativeASIN=B014W3EM2W&linkId=c417280f78f0257d9a06afa4a36d3c24), and a [4-Port PCI-E Network Interface Card](https://www.amazon.com/gp/product/B07R7GLN6H/ref=as_li_tl?ie=UTF8&tag=whitematter-20&camp=1789&creative=9325&linkCode=as2&creativeASIN=B07R7GLN6H&linkId=1a3b9783e3fbfbb9c0f3e06eea4c0c42).)
- An unused port on pfSense connected to Unifi

# Overview

The finished project will have a few coordinating components. On the pfSense side, we will be creating a subnet (for the purposes of this post, **10.99.3.0/24**) and an interface (which will be **10.99.3.15**) which will act as the gateway for *WAN2 on Unifi*. The pfSense subnet will be routed through your VPN client, which will encrypt the traffic and send it out through *pfSense's WAN* connection, which is in the **10.99.1.0/24** subnet on Unifi. Here, the traffic will exit via *WAN1* (e.g., your ISP).

--------------------------------------------------------------------

**client** ---_policy-based routing_---> **Unifi WAN2 (10.99.3.10)** ---> **pfSense subnet (10.99.3.0/24)** _(via pfSense Interface acting as gateway [10.99.3.15])_---> **PIA Gateway (traffic is encrypted)** ---> **pfSense WAN (10.99.1.15)** ---> **Unifi "pfSense WAN" subnet (10.99.1.0/24)** ---> **Unifi WAN1** (ISP)

--------------------------------------------------------------------


Don't worry if this doesn't make sense right now. I am finding it challenging to describe the flow better. A picture would be worth a thousand words. Check back sometime in the future, and maybe this description will be a nice, pretty image instead of a blob of text.

# Preparing pfSense

As a reminder, these instructions assume you have already setup a VPN client on pfSense and have that client assigned to an interface with appropriate NAT rules. If you have not done this yet, please check out [my previous post on this topic](http://whitematter.tech/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/).

If you have already completed these steps, proceed.

### Setting the Interface

First, we will create an interface and subnet that will be used for *Unifi's WAN2* connection. Go to **Interfaces > Assignments**, and select one of the available Network ports. You will need to know where this interface is connected to Unifi, and taking note of the MAC address may prove useful. Once the interface is selected, click **Add**. Then, select the newly created interface in your list of interfaces.

Setup your new interface to look similar to the image below. Be certain to select **Enable interface**, and set a static address that can be used in Unifi (in my case, **10.99.3.15/24**). Be sure not to overlap subnets with existing Unifi/pfSense subnets. Also, be sure to choose a reasonable CIDR that will allow your *Unifi WAN2* to have an address that can communicate with the **pfSense address (10.99.3.15/24)**. It is ***easy*** to accidentally leave the CIDR set to the _/32_ default.
![](/posts/vpn-policy-based-routing-with-unifi-and-pia/images/post3.png)

### Outbound NAT Rules

If you followed the instructions in my previous post, these instructions will be identical with the exception of changing your subnet addresses where applicable.

Select **Firewall > NAT**, and click **Outbound**.

Click the radio button to change the outbound _NAT mode_ to **Hybrid**, and click **_Save_**.

You will need to make rules for the traffic that will need to reach the VPN, which will be the subnet from Unifi that you will add (e.g., in my case, 10.99.2.0/24 is the PIA Subnet). The rules are as follows (see the image below): **Localhost to PIA rule**, **ISAKMP Localhost to PIA rule**, **LAN (Subnet) to PIA rule**, **ISAKMP LAN (Subnet) to PIA rule**.

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/image-3-1024x436.png)

**Below, I will show the settings page for each of the rules that I needed. If you have more interfaces or subnets, you will need to create your own rules to match. Just replace my values with your own.**

Your "localhost" and "127.0.0.0" information will be the same as mine. You will just need to replace the PIA_CHICAGO with your own PIA Interface you created earlier along with your intended subnet to be created in Unifi (e.g., 10.99.3.0/24).

--------------------------------------------------------------------

**ISAKMP - localhost to WAN**

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/image-4-1024x552.png)

ISAKMP - localhost to WAN

--------------------------------------------------------------------

**localhost to WAN**

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/image-5-1024x543.png)

localhost to WAN

--------------------------------------------------------------------

**ISAKMP - LAN (Subnet) to WAN**

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/image-6-1024x551.png)

ISAKMP - LAN (Subnet) to WAN

--------------------------------------------------------------------

**LAN to WAN**

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/image-7-1024x548.png)

LAN to WAN

--------------------------------------------------------------------

When you are finished with these rules, your setup will likely look a bit more like this:

![](/posts/vpn-policy-based-routing-with-unifi-and-pia/images/post4.png)

### Firewall in pfSense

To ensure you do not have traffic leaks from your subnet that are not encrypted, we need to create an allow rule and a block rule.

Go to **Firewall > Rules** and select the name of the Interface you created earlier. Click **Add** and create an allow rule from any source/port to any source/port. Under the **Advanced** options for this rule, select the PIA_CHICAGO Gateway under **Gateway**. Save the rule.

Now, create another rule. This time, under **Source**, select **Network** and input your **10.99.3.0/24** subnet _(remember to change the CIDR to /24)_.

![](/posts/vpn-policy-based-routing-with-unifi-and-pia/images/post3.png)

# Preparing Unifi

The screenshots taken from Unifi will be on the new interface. If you are using the old interface, your setup will be slightly different.

### Assign WAN2

Now, in Unifi, go to **Settings > Internet**. Select the second WAN option from the list. The cable connected to your *pfSense Interface* created above should be plugged into the *WAN2* port.

Set your *WAN2* settings to match the image below, taking specific care to set a static IP address in the subnet you defined earlier (e.g., **10.99.3.10**). For the gateway, set the pfSense static address you defined above (e.g., **10.99.3.15**). Once complete, click save.

![](/posts/vpn-policy-based-routing-with-unifi-and-pia/images/post5.png)

![](/posts/vpn-policy-based-routing-with-unifi-and-pia/images/post1.png)

## Policy-Based Routing

Finally, go to **Settings > Traffic Management**. Under **Routes**, click **Create New Route**. Here, you can define the type of traffic you want to route. For example, see the image below, where I am targeting my IoT subnet and routing it to *WAN2*. It really is that simple!

![](/posts/vpn-policy-based-routing-with-unifi-and-pia/images/post6.png)

All the traffic routed through WAN2 should now be encrypted via your VPN client.

--------------------------------------------------------------------

> **END**

**Congratulations** if you made it this far and everything is working!

I hope this tutorial aids you in your endeavors to anonymize certain portions of your network.

> As always, if you have any questions, feel free to start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a GitHub](https://github.com/RobertDWhite/WhiteMatterTech/pulls) PR to recommend changes/fixes in the article, or reach out to me directly at [robert@whitematter.tech](mailto:robert@whitematter.tech).
>
> Thanks for reading!
>
> Robert

_As an Amazon Associate, I earn from qualifying purchases._ ***Thank you*** _for supporting the maintenance of this blog. The pricing will be the same for you regardless if you use my links or not! Thanks for your support!_

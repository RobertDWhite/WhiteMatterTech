---
title: "How to Use pfSense and Unifi to Anonymize and Encrypt VLAN Tagged Traffic"
date: "2021-04-05"
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
cover:
    image: "/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic.png"
    alt: "pfSense, Unifi, & PIA Graphic"
    caption: "<text>"
aliases:
    - /posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/
    - /2021/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/

---

This post aims to show you how to use pfSense within a Unifi network behind a Unifi Gateway _\[in my case, the gateway is the [Unifi Dream Machine Pro](https://www.amazon.com/gp/product/B086967C9X/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B086967C9X&linkCode=as2&tag=whitematter-20&linkId=4fc0624a437d4bfe761f2ebb02ca61bd) (hereafter referred to as UDMP)\]_. I will explain my current network configuration including applicable subnets, VLANs, and wireless SSIDs needed to make this setup successful. The end goal is to be able to add a client on my Unifi network to a particular VLAN either by joining this client wirelessly to a particular SSID or by tagging the client's physical port to that VLAN. This VLAN will be tied to a subnet that sends data through the pfSense machine which is acting as a VPN client _(I use [Private Internet Access](http://www.privateinternetaccess.com/pages/buy-a-vpn/1218buyavpn?invite=U2FsdGVkX19vJeCiFLTHejdg7_UKL-kbJpMDRcdZ8ZM%2CwwbqkM0Pr8u1JywwOJHsqq-mX14))_. This method allows the UDMP to continue to act as the DHCP server for these clients while allowing pfSense to anonymize and encrypt the data of the clients in question.

_As an Amazon Associate, I earn from qualifying purchases._ Thank you for _supporting the maintenance of this blog. The pricing will be the same for you regardless if you use my links or not! Thanks for your support!_

This post assumes that you have the following: a Unifi Gateway device (e.g., [UDMP](https://www.amazon.com/gp/product/B086967C9X/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B086967C9X&linkCode=as2&tag=whitematter-20&linkId=4fc0624a437d4bfe761f2ebb02ca61bd), Unifi Security Gateway, etc.), a pfSense machine/VM, Unifi wireless APs (only if you want to add wireless devices to the VPN), and Unifi switches (only if you want to tag specific switch ports to the VPN). This post also assumes you have access to or a subscription to a VPN service. In this post, all references to VPN use will be specific to PIA. This guide may or may not work with other VPN providers initially. However, I am confident that, if you can initialize the client connection to your VPN provider from pfSense, you will be able to successfully use the tutorial to anonymous traffic with Unifi VLANs. We will first look at the pfSense setup and VPN configuration. After, we will explore the Unifi setup and configuration.

## pfSense Setup and Configuration

I built a custom pfSense machine with the following components: [Intel(R) Core(TM) i5-8500 CPU @ 3.00GHz](https://www.amazon.com/gp/product/B0759FGJ3Q/ref=as_li_tl?ie=UTF8&tag=whitematter-20&camp=1789&creative=9325&linkCode=as2&creativeASIN=B0759FGJ3Q&linkId=4867310b8da8586d142f13325ea48c62), [GIGABYTE B365M DS3H](https://www.amazon.com/gp/product/B07T6N8N56/ref=as_li_tl?ie=UTF8&tag=whitematter-20&camp=1789&creative=9325&linkCode=as2&creativeASIN=B07T6N8N56&linkId=790c04299d5dccec41764ccf5a8b1050), [Corsair Vengeance LPX 16GB](https://www.amazon.com/gp/product/B0143UM4TC/ref=as_li_tl?ie=UTF8&tag=whitematter-20&camp=1789&creative=9325&linkCode=as2&creativeASIN=B0143UM4TC&linkId=b021ad78bd94c0b12c1d29dd3e2d5dcf), [Thermaltake Smart 500W Power Supply](https://www.amazon.com/gp/product/B014W3EM2W/ref=as_li_tl?ie=UTF8&tag=whitematter-20&camp=1789&creative=9325&linkCode=as2&creativeASIN=B014W3EM2W&linkId=c417280f78f0257d9a06afa4a36d3c24), and a [4-Port PCI-E Network Interface Card](https://www.amazon.com/gp/product/B07R7GLN6H/ref=as_li_tl?ie=UTF8&tag=whitematter-20&camp=1789&creative=9325&linkCode=as2&creativeASIN=B07R7GLN6H&linkId=1a3b9783e3fbfbb9c0f3e06eea4c0c42).

## Select a PIA Server

First, we need to select a server that works best. This likely will be mainly determined by your country and geographical area. With your acount username and password for PIA, you will be able to see a complete list of servers here: [https://www.privateinternetaccess.com/pages/ovpn-config-generator](https://www.privateinternetaccess.com/pages/ovpn-config-generator)

To import the certificate needed, choose the 1198 port option, and click "Generate".

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/Screen-Shot-2021-04-02-at-1.38.10-AM-1024x612.png)

Once the file is downloaded, open it in your favorite text editor (e.g., **Atom**, Notepad++, etc.). Copy the portion **\-----BEGIN CERTIFICATE-----** all the way through **\-----END CERTIFICATE-----** as shown in the image below.

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic-4.jpg)

## Create a Certificate Authority in pfSense

In pfSense, navigate to **System > Cert Manager** and click on the "**_\+ ADD_**" Button. Change the "_Method_" to "_Import an existing certificate authority_" and paste the copied certificate text into the box. It should look like below:

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/2019-01-01-12_16_57.png)

Click _Save_.

You should now see the certificate listed:

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/2019-01-01-12_18_57.png)

## Configure OpenVPN Client

Now we have the certificate listed, navigate to **VPN > OpenVPN**, then click _**Clients**_ and finally click _**ADD**._

See the following images about changes to make in. your configuration. It should match mine with replacement of the Server Host and your PIA Username and Password. You will find the server host in the _.ovpn_ file you downloaded earlier from PIA. Here is the info needed to copy+paste into the "_Custom options_" box toward the end of the configuration page:

remote-cert-tls server

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/Screen-Shot-2021-04-02-at-1.33.00-PM-1024x754.png)

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/Screen-Shot-2021-04-02-at-1.31.44-PM-1-1024x653.png)

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/Screen-Shot-2021-04-02-at-1.33.28-PM-907x1024.png)

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/Screen-Shot-2021-04-02-at-1.33.43-PM-826x1024.png)

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/Screen-Shot-2021-04-02-at-1.34.01-PM-842x1024.png)

## pfSense Gateway and Interface Assignment

Now, we move to the complicated part. For this step, we will need to create a Gateway on pfSense for the traffic to use. I will detail this more later, but my setup contains a WAN (corresponding to a 10.99.1.0/24 subnet on Unifi), LAN (corresponding to a 10.99.2.0/24 subnet on Unifi), VLAN500 (which is the VLAN tag on my Unifi setup) and PIA interface. I will detail the setup of each, which will move us to the Unifi setup.

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/Screen-Shot-2021-04-02-at-2.17.23-PM-1024x211.png)

**Configure the Gateway**

First, go to **System > Routing > Gateways** and click **"_\+ Add_"** to add a Gateway for this setup. Add the Gateway IP from your Unifi Gateway, which, in my case, the Gateway IP is 10.99.1.1 corresponding to the Unifi UDMP's address in that subnet (subnet is 10.99.1.0/24, named pfSense WAN on Unifi). Save and continue.

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/Screen-Shot-2021-04-02-at-2.25.35-PM-1024x772.png)

**Interface Assignments**

Now go to **Interfaces > Assignments**. If a WAN interface is already assigned, great! Edit to ensure it looks similar to below (I chose 10.99.1.15 for my static WAN IP because it was easy to remember. You can use any address in the 10.99.1.0/24 subnet EXCEPT for the Gateway, 10.99.1.1). Be sure the IPv4 Upstream gateway is set to the Gateway we just made. Additionally, check "**_Block bogon networks_**" at the bottom of the configuration page.

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/Screen-Shot-2021-04-02-at-2.28.38-PM-1024x667.png)

Likewise, check your existing LAN interface, if it exists, or create one as follows below. The LAN interface corresponds to the 10.99.2.0/24 subnet, where devices tagged with the VLAN 500 will go and retrieve their DHCP lease on Unifi. Again, I set my LAN interface IP to 10.99.2.15 because it seemed easy to remember for me. Make sure the IPv4 Upstream gateway is set to "None." DO NOT block bogon networks on the LAN interface.

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/Screen-Shot-2021-04-02-at-2.39.39-PM-1024x677.png)

**Add a PIA Interface**

On the dropdown for "**_Available Network Ports_**" you should see your PIA VPN listed. Select your PIA VPN, and click add.

Now that the interface has been added, click on the interface name (it will likely be something like OPT2 or OPT3, but yours may be different...it should be at the bottom of the list). Now you can check the box to enable the interface and give it a better name, I called mine _PIA\_Netherlands_. Also, make sure the reserved network checkboxes are unchecked.

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/Screen-Shot-2021-04-02-at-2.55.27-PM-1024x735.png)

Finally, go to **Interfaces > VLANs** and add a VLAN. Here, choose your previously configured LAN interface as the parent interface, and choose a VLAN tag between 1 and 4094. This tag will be used in Unifi. I chose 500.

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/Screen-Shot-2021-04-02-at-3.11.51-PM-1024x363.png)

Finally, you will need to plug in both physical interfaces corresponding to your WAN and LAN interfaces. If you have only two NICs on your pfSense box, you should easily be able to figure out which port corresponds to which interface. If you have more than two NICs, it may be more difficult. You need to know which port is which because you will need to tag the LAN interface with the VLAN 500 in Unifi (you can do this now, but we will cover it shortly).

## Outbound NAT Rules

Select **Firewall > NAT**, and click **Outbound**.

Click the radio button to change the outbound _NAT mode_ to **Hybrid**, and click **_Save_**.

You will need to make rules for the traffic that will need to reach the VPN, which will be the subnet from Unifi that you will add (e.g., in my case, 10.99.2.0/24 is the PIA Subnet). The rules are as follows (see the image below): **Localhost to PIA rule**, **ISAKMP Localhost to PIA rule**, **LAN (Subnet) to PIA rule**, **ISAKMP LAN (Subnet) to PIA rule**.

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/image-3-1024x436.png)

Outbound NAT Rules

**Below, I will show the settings page for each of the rules that I needed. If you have more interfaces or subnets, you will need to create your own rules to match. Just replace my values with your own.**

Your "localhost" and "127.0.0.0" information will be the same as mine. You will just need to replace the PIA\_CHICAGO with your own PIA Interface you created earlier along with your intended subnet to be created in Unifi (e.g., 10.99.2.0/24).

**ISAKMP - localhost to WAN**

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/image-4-1024x552.png)

ISAKMP - localhost to WAN

**localhost to WAN**

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/image-5-1024x543.png)

localhost to WAN

**ISAKMP - LAN (Subnet) to WAN**

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/image-6-1024x551.png)

ISAKMP - LAN (Subnet) to WAN

**LAN to WAN**

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/image-7-1024x548.png)

LAN to WAN

> This concludes our setup of pfSense.
>
> We can now head over to Unifi!

## Unifi Setup and Configuration

In our **Unifi Settings** page, we will create two Corporate LAN networks: one will be for the **_pfSense WAN_**, and the other will be for the **_pfSense LAN_**. As shown in the image below, the subnets correspond to the subnets we mentioned and configured for pfSense above.

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/Screen-Shot-2021-04-02-at-11.39.20-PM-1024x73.png)

**pfSense WAN on Unifi**

Make a new Corporate LAN on Unifi for your **pfSense WAN**, and match the options to the options in the image below. Make sure your subnet matches the subnet added to pfSense earlier for the WAN interface.

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/Screen-Shot-2021-04-02-at-11.40.54-PM-1024x929.png)

**pfSense LAN on Unifi**

Make another Corporate LAN in Unifi. Below is my settings page for the **pfSense LAN**. You can match your settings to mine. **_Be sure to set the DHCP Gateway IP to the static IP address you gave to the pfSense LAN Interface earlier (e.g., 10.99.2.15)_**. **_Also be sure to add THE SAME VLAN as you did in pfSense earlier (e.g., VLAN 500)._**

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/Screen-Shot-2021-04-02-at-11.44.51-PM-1024x806.png)

Finally for the Unifi LAN, you will need your pfSense physical port (the one corresponding to the LAN interface) plugged into Unifi, and you will need to manually set the port to use the VLAN you set up.

**Tagging Ports on Unifi Switches**

From your Unifi clients page, select a client you want to add to pfSense. Under the overview of the client, select the Port it is plugged into (_e.g., Family Room - UniFi Switch 8 POE-60W #7_ as shown below).

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/Screen-Shot-2021-04-02-at-11.49.20-PM.png)

This should bring up a page that allows you to specifically override the configuration of that port. At this point, select the new pfSense (500) Port Profile _(if the Port Profile is not here, please skip to the end of the article to find out how to add the profile)._ Once you apply the configuration, your device will obtain a new DHCP lease from Unifi in the new pfSense subnet. Then, your wired device will be sending its traffic through PIA.

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/Screen-Shot-2021-04-02-at-11.48.17-PM-717x1024.png)

**Adding Wireless Clients to pfSense on Unifi APs**

Go to **Settings > Wireless Networks** and click "_CREATE NEW WIRELESS NETWORK_." You can mimic the setup from the image below, but the important aspect here is to select **pfSense** as the Network with which the WLAN is associated (see pic below). Now, any devices connected to this Wireless network will have their traffic sent through PIA! Verify this is working by going to "whatismyip.com" on a mobile device or some other device on this WLAN.

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/Screen-Shot-2021-04-03-at-12.01.14-AM-1024x968.png)

> **END**

**Congratulations** if you made it this far and everything is working!

I hope this tutorial aids you in your endeavors to anonymize certain portions of your network.

> As always, if you have any questions, feel free to start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a GitHub](https://github.com/RobertDWhite/WhiteMatterTech/pulls) PR to recommend changes/fixes in the article, or reach out to me directly at [robert@whitematter.tech](mailto:robert@whitematter.tech).
>
> Thanks for reading!
>
> Robert

## TROUBLESHOOTING

**Adding Missing Port Profiles**

If for some reason the Port Profile was not made automatically when you created your respective networks, you may need to go to Settings > Profiles in the Unifi dashboard. On this page, switch from RADIUS to SWITCH PORTS. Click "ADD NEW PORT PROFILE." Name the Profile and then click Native Network, and assign the pfSense network to this profile as shown below. Once selected, click Save/Apply. You can return to the assignment area and assign ports appropriately to use the pfSense VPN.

![](/posts/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/images/Screen-Shot-2021-04-02-at-11.53.29-PM-1024x541.png)

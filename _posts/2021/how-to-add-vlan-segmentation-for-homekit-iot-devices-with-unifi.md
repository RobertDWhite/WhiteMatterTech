---
ID: 152
post_title: >
  How to Add VLAN Segmentation for HomeKit
  IoT Devices with Unifi
post_name: >
  how-to-add-vlan-segmentation-for-homekit-iot-devices-with-unifi
author: Robert White
post_date: 2021-04-08 22:40:46
layout: post
link: >
  https://whitematter.tech/2021/how-to-add-vlan-segmentation-for-homekit-iot-devices-with-unifi/
published: true
tags:
  - hardening
  - iot
  - network
  - vlan
categories:
  - Networking
  - Security
  - Tips
  - Tutorials
---
<!-- wp:heading -->
<h2>IoT Overview</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The smart world of Internet-of-Things (IoT) devices is ever growing. From everyday lightbulbs to the sprinkler out front, just about every household appliance and utility has a smart-counterpart. For example, my smart home is fully Apple HomeKit compatible and consists of a <a href="https://www.amazon.com/gp/product/B07XH4KDR5/ref=as_li_tl?ie=UTF8&amp;camp=1789&amp;creative=9325&amp;creativeASIN=B07XH4KDR5&amp;linkCode=as2&amp;tag=whitematter-20&amp;linkId=df6ecd2d3d2499551ee4fb509a49587b" target="_blank" rel="noreferrer noopener">Hue bridge with lightbulbs</a>, <a href="https://www.amazon.com/gp/product/B00KLAXFQA/ref=as_li_qf_asin_il_tl?ie=UTF8&amp;tag=whitematter-20&amp;creative=9325&amp;linkCode=as2&amp;creativeASIN=B00KLAXFQA&amp;linkId=7921a6374b4b40c94161f4278c1b33d8" title="https://www.amazon.com/gp/product/B00KLAXFQA/ref=as_li_qf_asin_il_tl?ie=UTF8&amp;tag=whitematter-20&amp;creative=9325&amp;linkCode=as2&amp;creativeASIN=B00KLAXFQA&amp;linkId=7921a6374b4b40c94161f4278c1b33d8" target="_blank" rel="noreferrer noopener">Lutron Caseta smart dimmers/switches</a>, <a href="https://www.amazon.com/gp/product/B08FBHCPPF/ref=as_li_tl?ie=UTF8&amp;camp=1789&amp;creative=9325&amp;creativeASIN=B08FBHCPPF&amp;linkCode=as2&amp;tag=whitematter-20&amp;linkId=5505218457879d684052765e37db35fa" title="https://www.amazon.com/gp/product/B08FBHCPPF/ref=as_li_tl?ie=UTF8&amp;camp=1789&amp;creative=9325&amp;creativeASIN=B08FBHCPPF&amp;linkCode=as2&amp;tag=whitematter-20&amp;linkId=5505218457879d684052765e37db35fa" target="_blank" rel="noreferrer noopener">Eve Aqua outdoor water hose control</a>, <a href="https://www.amazon.com/gp/product/B07Q1J7RZM/ref=as_li_tl?ie=UTF8&amp;camp=1789&amp;creative=9325&amp;creativeASIN=B07Q1J7RZM&amp;linkCode=as2&amp;tag=whitematter-20&amp;linkId=dae9862d26805fd0af1e8817bd8645c2" title="https://www.amazon.com/gp/product/B07Q1J7RZM/ref=as_li_tl?ie=UTF8&amp;camp=1789&amp;creative=9325&amp;creativeASIN=B07Q1J7RZM&amp;linkCode=as2&amp;tag=whitematter-20&amp;linkId=dae9862d26805fd0af1e8817bd8645c2">iSmartGate garage door opener</a>, <a href="https://www.amazon.com/gp/product/B00YUPE85Y/ref=as_li_tl?ie=UTF8&amp;camp=1789&amp;creative=9325&amp;creativeASIN=B00YUPE85Y&amp;linkCode=as2&amp;tag=whitematter-20&amp;linkId=f1f239d916e964e7ba0ed727e7ad4d14" title="https://www.amazon.com/gp/product/B00YUPE85Y/ref=as_li_tl?ie=UTF8&amp;camp=1789&amp;creative=9325&amp;creativeASIN=B00YUPE85Y&amp;linkCode=as2&amp;tag=whitematter-20&amp;linkId=f1f239d916e964e7ba0ed727e7ad4d14" target="_blank" rel="noreferrer noopener">Schlage deadbolt</a>, <a href="https://www.amazon.com/gp/product/B01MAV39M8/ref=as_li_tl?ie=UTF8&amp;camp=1789&amp;creative=9325&amp;creativeASIN=B01MAV39M8&amp;linkCode=as2&amp;tag=whitematter-20&amp;linkId=3c4d273460c2b1f2a7201582bb50342e" target="_blank" rel="noreferrer noopener">Eve motion sensor</a>, <a href="https://www.amazon.com/gp/product/B07W6RYRZM/ref=as_li_qf_asin_il_tl?ie=UTF8&amp;tag=whitematter-20&amp;creative=9325&amp;linkCode=as2&amp;creativeASIN=B07W6RYRZM&amp;linkId=c06286ddb9cac861e2da524be2f6acc4" target="_blank" rel="noreferrer noopener">Sonos speakers</a> throughout the house, a <a href="https://www.amazon.com/gp/product/B07HMPY7RX/ref=as_li_qf_asin_il_tl?ie=UTF8&amp;tag=whitematter-20&amp;creative=9325&amp;linkCode=as2&amp;creativeASIN=B07HMPY7RX&amp;linkId=3bc57ed9890dc0278b52db28c3d42511" target="_blank" rel="noreferrer noopener">Vocolinc oil diffuser</a>, <a href="https://www.amazon.com/gp/product/B083NFNN99/ref=as_li_qf_asin_il_tl?ie=UTF8&amp;tag=whitematter-20&amp;creative=9325&amp;linkCode=as2&amp;creativeASIN=B083NFNN99&amp;linkId=fc19219e0df43f4a1c56d63749dbad2c" target="_blank" rel="noreferrer noopener">Vocolionc power strip</a>, a couple <a href="https://www.amazon.com/gp/product/B08C4JXBPF/ref=as_li_tl?ie=UTF8&amp;camp=1789&amp;creative=9325&amp;creativeASIN=B08C4JXBPF&amp;linkCode=as2&amp;tag=whitematter-20&amp;linkId=7500e53510ab70cfb9e0d237978fe197" target="_blank" rel="noreferrer noopener">iRobot Roomba</a> vacuum cleaners, some <a href="https://www.amazon.com/gp/product/B07NJRS8TX/ref=as_li_tl?ie=UTF8&amp;camp=1789&amp;creative=9325&amp;creativeASIN=B07NJRS8TX&amp;linkCode=as2&amp;tag=whitematter-20&amp;linkId=5ab28257a60b56e62c85132b2afce653" target="_blank" rel="noreferrer noopener">Vocolinc pluggable outlets</a>, an <a href="https://www.amazon.com/gp/product/B06W56TBLN/ref=as_li_tl?ie=UTF8&amp;camp=1789&amp;creative=9325&amp;creativeASIN=B06W56TBLN&amp;linkCode=as2&amp;tag=whitematter-20&amp;linkId=59b864438ae9a389b269066a2902cdde" target="_blank" rel="noreferrer noopener">Ecobee thermostat</a> to replace each analog thermostat in the house, and a <a href="https://www.amazon.com/gp/product/B08L3X9ZZX/ref=as_li_tl?ie=UTF8&amp;camp=1789&amp;creative=9325&amp;creativeASIN=B08L3X9ZZX&amp;linkCode=as2&amp;tag=whitematter-20&amp;linkId=19dd1b06c1c8884232de18bc438fefa1" target="_blank" rel="noreferrer noopener">Unifi G4 Doorbell</a> (the doorbell is not technically compatible with HomeKit, but I added support with a third-party tool known as "<a href="https://homebridge.io/" target="_blank" rel="noreferrer noopener">Homebridge</a>"). On top of all these smart home devices, I have a handful of other Unifi Protect cameras around my property. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><meta charset="utf-8"><em>As an Amazon Associate, I earn from qualifying purchases.</em> Thank you for<em> supporting the maintenance of this blog. The pricing will be the same for you regardless if you use my links or not! Thanks for your support!</em> </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If you're reading this, you may not have quite that many devices, but you are probably either looking to invest in some smart home devices or you have already started the process of converting your home to the world of IoT. Either way, it is important to consider the security implications of adding these devices to your network. For example, some smart switches have such poor encryption that they are easily compromised and can be <a href="https://www.komando.com/security-privacy/smart-plugs-hacked/757290/" target="_blank" rel="noreferrer noopener">overpowered to catch on fire</a>. While none of the devices in my home have this sort of vulnerability that has been publicized, the possibility exists nonetheless that these devices could be used by nefarious actors to cause ruckus in my home or attempt to gain access to other devices on my network. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>IoT devices continue to improve their security mechanisms (mostly), and IoT is certainly not going away anytime soon. Because of this, prudent users, like you, should consider how to best protect their internal resources. One recommended method of securing your network containing IoT devices is to segment your network with VLANs. I will show you how to segment your home network from your IoT devices with VLANs, including how to create subnets, VLANs, firewall rules, and how to enable IPS/IDS for good measure. To follow along, your network will need to be comprised of Unifi networking gear. My gateway and Unifi controller is the <em><a href="https://www.amazon.com/gp/product/B086967C9X/ref=as_li_tl?ie=UTF8&amp;camp=1789&amp;creative=9325&amp;creativeASIN=B086967C9X&amp;linkCode=as2&amp;tag=whitematter-20&amp;linkId=4fc0624a437d4bfe761f2ebb02ca61bd" target="_blank" rel="noreferrer noopener">Unifi Dream Machine Pro</a></em>, though you could use any Unifi gateway + controller combination. Additionally, many other network providers besides Unifi will have similar functionality, and you will likely be able to accomplish some of these tasks with other gear.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><em>Check out a community ports list for IoT on GitHub here: <a href="https://github.com/RobertDWhite/IoT-ports" target="_blank" rel="noreferrer noopener">https://github.white.fm</a></em></p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2><strong>Creating VLANs and Segmenting the Network</strong></h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The first step is creating a VLAN for your IoT network. The easiest way to accomplish this task is to create a new subnet for your IoT network. For example, if you currently just have a single network for all of your Internet-connected devices, including your personal computers, phones, etc, you probably have a single subnet that looks something like this: 192.168.1.1/24. This is seen on your Unifi Controller by going to <strong>Settings &gt; Networks</strong> (on the old GUI). I recommend you next click <strong><em>"Create New Network,</em>"</strong> and name the network something like <em>"IoT"</em>. Specifically select <em>"Corporate"</em> for the <em>"Purpose."</em> It makes it easy to remember if you set the Gateway IP/Subnet 1 number off from your default network (e.g., set it to something like 192.168.2.1/24 or 192.168.10.1/24). Below, you will see my settings. Notice my Gateway is 10.100.1.1. My default subnet is 10.100.0.1, in contrast. For simplicity, I have <em>IGMP snooping </em>and <em>UPNP</em> enabled. This might help down the road for certain smart components like Home Assistant. For <em>VLAN</em>, set any number from <em>2-4018</em>. I set my <em>DHCP range</em> to only include x.101-x.254 because I wanted to reserve the first 100 IPs in this subnet for static addressing. If you want all your devices to be DHCP, you do not need to modify this option. Go ahead and save this network. </p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":156,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-08-at-3.03.01-PM-1024x879.png" alt="" class="wp-image-156"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p><strong>Preparing the Wireless</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Since most IoT devices are wireless, you will need to create a wireless SSID for all of your IoT devices to connect to separately from the rest of your home network. Go to <strong>Settings -&gt; Wireless Networks</strong>, and click <strong><em>"Create New Wireless Network."</em></strong> Name the SSID something memorable, and set the security to <em>"WPA Personal"</em> (old GUI...the new GUI may allow you to specifically choose <em>WPA2</em>, in which case, do that). For<em> "Network,"</em> choose the subnet/VLAN you made in the previous step. This will associate the new SSID to that particular network segment.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":159,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-08-at-3.16.16-PM-1024x557.png" alt="" class="wp-image-159"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>Continue through the setup screen to <em>"Advanced Options."</em> Here, I specifically have ONLY <em>2.4GHz</em> enabled for <em>WiFi Bands</em> because most IoT devices still only use 2.4GHz. If you happen to have some 5GHz IoT devices, the slightly better performance for those devices will likely be overshadowed by the constant disconnecting of your devices when both 2.4GHz and 5GHz are enabled simultaneously. IoT devices in general do a pretty bad job of handling Unifi APs with both bands enabled. Feel free to try enabling both bands in your environment, but if you have lots of issues with connectivity and the infamous <strong><span class="has-inline-color has-vivid-red-color">"No Response"</span></strong> message on Apple HomeKit, I recommend again to stick with just 2.4GHz for now. Disable all of Unifi's <em>"BETA"</em> tagged options like <em>Fast Roaming</em>, as these will also cause performance and connectivity issues. I also prevent my SSID from being broadcast to clean up the WiFi experience for users at home. It is a lot nicer to only see my LAN and my guest networks being broadcast. This will, however, force an extra step when you try to add devices to HomeKit, as you will need to connect your phone to the IoT WiFi before adding the IoT devices to that network. Manually adding the SSID can be tedious, but it is well worth it in my opinion once the overall setup is complete. I leave <em>GTK rekeying</em> to <em>3600 seconds</em>. I also have a <em>User Group </em>setup for IoT devices in case I want to throttle IoT in the future. Check to <em>Enable multicast enhancement (IGMPv3)</em>. Leave everything else as is, and you're finished with the Wireless setup.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":158,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-08-at-3.15.50-PM-869x1024.png" alt="" class="wp-image-158"/></figure>
<!-- /wp:image -->

<!-- wp:heading -->
<h2><strong>Blocking Traffic Between Subnets/VLANs</strong></h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The next part of this process will be setting up the Firewall to block traffic between the subnets/VLANs. Go to <strong>Settings &gt; Routing &amp; Firewall &gt; Firewall</strong>. I will assume you are only using IPv4, and we will therefore only look at IPv4 rules. For a detailed definition of the <em><strong>WAN IN, WAN OUT, WAN LOCAL</strong></em>, etc. options, I will recommend you search the Internet. This part can be pretty confusing, and the definition of these options is outside the scope of this post. We will focus on <strong>LAN IN</strong> and <strong>LAN LOCAL</strong> for our purposes.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>LAN IN</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This portion can get complicated depending on how specific you want to be with allowances of devices between these network segments. I have a lot of different home automation programs running like HomeBridge and Home Assistant. I also have Sonos speakers, which need their own rules to function properly with your iPhone on a different subnet. If you have some IoT devices (no Sonos) without any external programs like HomeBridge, the only rules you will need to concern yourself with are 2003 and 2012. </p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":162,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-08-at-3.48.20-PM-1024x335.png" alt="" class="wp-image-162"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>Let's look at the mentioned <em>Rule 2003</em>. Go ahead and create a rule in the <strong>LAN IN</strong> section. In the image below, you can see my settings for this rule. Essentially, this rule allows your devices in your default network to communicate with your IoT devices only (<em>traffic flow LAN -&gt; IoT</em>). Match your settings to the settings below. Be sure <em>Action</em> is set to <em>Accept</em>.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":163,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-08-at-3.49.12-PM-1024x715.png" alt="" class="wp-image-163"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>Next, let's check out Rule 2012. Create a new rule and match to the image below. Note that <em>Action </em>Is set to <em>Drop</em>. Also, note the <em>States</em> that are checked are <em>New</em> and <em>Invalid</em>. This prevents traffic from flowing from the <strong>Source (IoT)</strong> to <strong>Destination (LAN) </strong>(<em>traffic flow IoT -&gt;X LAN</em>) based on the status of the traffic. Only <em>established</em> and <em>related</em> traffic will be allowed, then.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":166,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-08-at-4.00.57-PM-1013x1024.png" alt="" class="wp-image-166"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p><strong><br>LAN LOCAL</strong></p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":161,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-08-at-3.44.52-PM-1024x209.png" alt="" class="wp-image-161"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>Next, let's check <strong>LAN LOCAL</strong> rules These rule is concerned with allowing <a href="https://www.ionos.com/digitalguide/server/know-how/multicast-dns/" target="_blank" rel="noreferrer noopener">multicast DNS</a> traffic and with allowing HomeKit-specific ports to receive data as needed. I have a <em>Port Group</em> with ports 51826 and 51827 for HomeKit. Make your own rules and match your settings to the image below. For the sake of space, I will show one image. All you will need to do is change your <em>source/destination</em> like in the image above (Rules 2000-2003). You are targeting specific ports. One rule will allow ANY:5353 -&gt; ANY:ANY, one will allow ANY:ANY -&gt; ANY:5353, one will allow ANY:51826-7 -&gt; ANY:ANY, and finally one will allow ANY:ANY -&gt; ANY:51826-7. Make and save your rules!</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":167,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-08-at-4.09.28-PM-1024x884.png" alt="" class="wp-image-167"/></figure>
<!-- /wp:image -->

<!-- wp:heading -->
<h2>Wrapping Up</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>There you have it! You now have a fully-functional HomeKit setup enabled with extra security practices to prevent mischief from poorly-secured IoT devices reaching your internal LAN. It is clear this does not mitigate 100% of the risk since we're allowing traffic to flow in opposite direction. You can lock your subnets down even more by experimenting with fully blocking your traffic from your LAN to your IoT network but ONLY allowing instead your HomeKit controller (e.g., Apple TV, Homepod, etc.). These rules can and probably should be tweaked to fit your environment, but the rules described above will at least get you started. If you have any specific issues or have an IoT device not functioning properly, please reach out in the comments or shoot me an email!</p>
<!-- /wp:paragraph -->
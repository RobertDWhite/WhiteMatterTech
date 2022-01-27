---
ID: 70
post_title: >
  How to Use pfSense and Unifi to
  Anonymize and Encrypt VLAN Tagged
  Traffic
post_name: >
  how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic
author: Robert White
post_date: 2021-04-05 02:34:00
layout: post
link: >
  https://whitematter.tech/2021/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/
published: true
tags:
  - anonymous
  - encrypt
  - network
  - pfsense
  - unifi
  - vlan
categories:
  - Networking
  - Security
  - Tutorials
---
<!-- wp:paragraph -->
<p>This post aims to show you how to use pfSense within a Unifi network behind a Unifi Gateway <em>[in my case, the gateway is the <a href="https://www.amazon.com/gp/product/B086967C9X/ref=as_li_tl?ie=UTF8&amp;camp=1789&amp;creative=9325&amp;creativeASIN=B086967C9X&amp;linkCode=as2&amp;tag=whitematter-20&amp;linkId=4fc0624a437d4bfe761f2ebb02ca61bd" target="_blank" rel="noreferrer noopener">Unifi Dream Machine Pro</a> (hereafter referred to as UDMP)]</em>. I will explain my current network configuration including applicable subnets, VLANs, and wireless SSIDs needed to make this setup successful. The end goal is to be able to add a client on my Unifi network to a particular VLAN either by joining this client wirelessly to a particular SSID or by tagging the client's physical port to that VLAN. This VLAN will be tied to a subnet that sends data through the pfSense machine which is acting as a VPN client <em>(I use <a href="http://www.privateinternetaccess.com/pages/buy-a-vpn/1218buyavpn?invite=U2FsdGVkX19vJeCiFLTHejdg7_UKL-kbJpMDRcdZ8ZM%2CwwbqkM0Pr8u1JywwOJHsqq-mX14" target="_blank" rel="noreferrer noopener">Private Internet Access</a>)</em>. This method allows the UDMP to continue to act as the DHCP server for these clients while allowing pfSense to anonymize and encrypt the data of the clients in question. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"fontSize":"small"} -->
<p class="has-small-font-size"><em><meta charset="utf-8">As an Amazon Associate, I earn from qualifying purchases.</em> Thank you for<em> supporting the maintenance of this blog. The pricing will be the same for you regardless if you use my links or not! Thanks for your support!</em> </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This post assumes that you have the following: a Unifi Gateway device (e.g., <a href="https://www.amazon.com/gp/product/B086967C9X/ref=as_li_tl?ie=UTF8&amp;camp=1789&amp;creative=9325&amp;creativeASIN=B086967C9X&amp;linkCode=as2&amp;tag=whitematter-20&amp;linkId=4fc0624a437d4bfe761f2ebb02ca61bd" target="_blank" rel="noreferrer noopener">UDMP</a>, Unifi Security Gateway, etc.), a pfSense machine/VM, Unifi wireless APs (only if you want to add wireless devices to the VPN), and Unifi switches (only if you want to tag specific switch ports to the VPN). This post also assumes you have access to or a subscription to a VPN service. In this post, all references to VPN use will be specific to PIA. This guide may or may not work with other VPN providers initially. However, I am confident that, if you can initialize the client connection to your VPN provider from pfSense, you will be able to successfully use the tutorial to anonymous traffic with Unifi VLANs. We will first look at the pfSense setup and VPN configuration. After, we will explore the Unifi setup and configuration.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>pfSense Setup and Configuration</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>I built a custom pfSense machine with the following components: <a href="https://www.amazon.com/gp/product/B0759FGJ3Q/ref=as_li_tl?ie=UTF8&amp;tag=whitematter-20&amp;camp=1789&amp;creative=9325&amp;linkCode=as2&amp;creativeASIN=B0759FGJ3Q&amp;linkId=4867310b8da8586d142f13325ea48c62" target="_blank" rel="noreferrer noopener">Intel(R) Core(TM) i5-8500 CPU @ 3.00GHz</a>, <a href="https://www.amazon.com/gp/product/B07T6N8N56/ref=as_li_tl?ie=UTF8&amp;tag=whitematter-20&amp;camp=1789&amp;creative=9325&amp;linkCode=as2&amp;creativeASIN=B07T6N8N56&amp;linkId=790c04299d5dccec41764ccf5a8b1050" target="_blank" rel="noreferrer noopener">GIGABYTE B365M DS3H</a>, <a href="https://www.amazon.com/gp/product/B0143UM4TC/ref=as_li_tl?ie=UTF8&amp;tag=whitematter-20&amp;camp=1789&amp;creative=9325&amp;linkCode=as2&amp;creativeASIN=B0143UM4TC&amp;linkId=b021ad78bd94c0b12c1d29dd3e2d5dcf" target="_blank" rel="noreferrer noopener">Corsair Vengeance LPX 16GB</a>, <a href="https://www.amazon.com/gp/product/B014W3EM2W/ref=as_li_tl?ie=UTF8&amp;tag=whitematter-20&amp;camp=1789&amp;creative=9325&amp;linkCode=as2&amp;creativeASIN=B014W3EM2W&amp;linkId=c417280f78f0257d9a06afa4a36d3c24" target="_blank" rel="noreferrer noopener">Thermaltake Smart 500W Power Supply</a>, and a <a href="https://www.amazon.com/gp/product/B07R7GLN6H/ref=as_li_tl?ie=UTF8&amp;tag=whitematter-20&amp;camp=1789&amp;creative=9325&amp;linkCode=as2&amp;creativeASIN=B07R7GLN6H&amp;linkId=1a3b9783e3fbfbb9c0f3e06eea4c0c42" target="_blank" rel="noreferrer noopener">4-Port PCI-E Network Interface Card</a>.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Select a PIA Server</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>First, we need to select a server that works best. This likely will be mainly determined by your country and geographical area. With your acount username and password for PIA, you will be able to see a complete list of servers here: <a href="https://www.privateinternetaccess.com/pages/ovpn-config-generator">https://www.privateinternetaccess.com/pages/ovpn-config-generator</a></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>To import the certificate needed, choose the 1198 port option, and click "Generate".</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":72,"width":899,"height":537,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large is-resized"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-02-at-1.38.10-AM-1024x612.png" alt="" class="wp-image-72" width="899" height="537"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>Once the file is downloaded, open it in your favorite text editor (e.g., <strong>Atom</strong>, Notepad++, etc.). Copy the portion <span class="has-inline-color has-vivid-cyan-blue-color"><strong>-----BEGIN CERTIFICATE-----</strong> all the way through <strong>-----END CERTIFICATE-----</strong></span> as shown in the image below.</p>
<!-- /wp:paragraph -->

<!-- wp:image -->
<figure class="wp-block-image"><img src="https://blog.networkprofile.org/content/images/2020/08/image-1.png" alt=""/></figure>
<!-- /wp:image -->

<!-- wp:heading -->
<h2>Create a Certificate Authority in pfSense</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>In pfSense, navigate to <strong>System &gt; Cert Manager</strong>&nbsp;and click on the "<strong><em>+ ADD</em></strong>" Button. Change the "<em>Method</em>" to "<em>Import an existing certificate authority</em>" and paste the copied certificate text into the box. It should look like below:</p>
<!-- /wp:paragraph -->

<!-- wp:image -->
<figure class="wp-block-image"><img src="https://blog.networkprofile.org/content/images/2019/01/2019-01-01-12_16_57.png" alt=""/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>Click <em>Save</em>.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>You should now see the certificate listed:</p>
<!-- /wp:paragraph -->

<!-- wp:image -->
<figure class="wp-block-image"><img src="https://blog.networkprofile.org/content/images/2019/01/2019-01-01-12_18_57.png" alt=""/></figure>
<!-- /wp:image -->

<!-- wp:heading -->
<h2>Configure OpenVPN Client</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Now we have the certificate listed, navigate to&nbsp;<strong>VPN &gt; OpenVPN</strong>, then click<em>&nbsp;<strong>Clients</strong></em>&nbsp;and finally click<em>&nbsp;<strong>ADD</strong>.</em></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>See the following images about changes to make in. your configuration. It should match mine with replacement of the Server Host and your PIA Username and Password. You will find the server host in the <em>.ovpn</em> file you downloaded earlier from PIA. Here is the info needed to copy+paste into the "<em>Custom options</em>" box toward the end of the configuration page: </p>
<!-- /wp:paragraph -->

<!-- wp:preformatted -->
<pre class="wp-block-preformatted">remote-cert-tls server</pre>
<!-- /wp:preformatted -->

<!-- wp:image {"id":76,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-02-at-1.33.00-PM-1024x754.png" alt="" class="wp-image-76"/></figure>
<!-- /wp:image -->

<!-- wp:image {"id":75,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-02-at-1.31.44-PM-1-1024x653.png" alt="" class="wp-image-75"/></figure>
<!-- /wp:image -->

<!-- wp:image {"id":77,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-02-at-1.33.28-PM-907x1024.png" alt="" class="wp-image-77"/></figure>
<!-- /wp:image -->

<!-- wp:image {"id":78,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-02-at-1.33.43-PM-826x1024.png" alt="" class="wp-image-78"/></figure>
<!-- /wp:image -->

<!-- wp:image {"id":79,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-02-at-1.34.01-PM-842x1024.png" alt="" class="wp-image-79"/></figure>
<!-- /wp:image -->

<!-- wp:heading -->
<h2 id="interface-assignment">pfSense Gateway and Interface Assignment</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Now, we move to the complicated part. For this step, we will need to create a Gateway on pfSense for the traffic to use. I will detail this more later, but my setup contains a WAN (corresponding to a 10.99.1.0/24 subnet on Unifi), LAN (corresponding to a 10.99.2.0/24 subnet on Unifi), VLAN500 (which is the VLAN tag on my Unifi setup) and PIA interface. I will detail the setup of each, which will move us to the Unifi setup.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":80,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-02-at-2.17.23-PM-1024x211.png" alt="" class="wp-image-80"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p><strong>Configure the Gateway</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>First, go to <strong>System &gt; Routing &gt; Gateways</strong> and click <strong>"<em>+ Add</em>"</strong> to add a Gateway for this setup. Add the Gateway IP from your Unifi Gateway, which, in my case, the Gateway IP is 10.99.1.1 corresponding to the Unifi UDMP's address in that subnet (subnet is 10.99.1.0/24, named pfSense WAN on Unifi). Save and continue.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":81,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-02-at-2.25.35-PM-1024x772.png" alt="" class="wp-image-81"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p><strong>Interface Assignments</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Now go to&nbsp;<strong>Interfaces &gt; Assignments</strong>. If a WAN interface is already assigned, great! Edit to ensure it looks similar to below (I chose 10.99.1.15 for my static WAN IP because it was easy to remember. You can use any address in the 10.99.1.0/24 subnet EXCEPT for the Gateway, 10.99.1.1). Be sure the IPv4 Upstream gateway is set to the Gateway we just made. Additionally, check "<strong><em>Block bogon networks</em></strong>" at the bottom of the configuration page.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":82,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-02-at-2.28.38-PM-1024x667.png" alt="" class="wp-image-82"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>Likewise, check your existing LAN interface, if it exists, or create one as follows below. The LAN interface corresponds to the 10.99.2.0/24 subnet, where devices tagged with the VLAN 500 will go and retrieve their DHCP lease on Unifi. Again, I set my LAN interface IP to 10.99.2.15 because it seemed easy to remember for me. Make sure the IPv4 Upstream gateway is set to "None." DO NOT block bogon networks on the LAN interface.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":83,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-02-at-2.39.39-PM-1024x677.png" alt="" class="wp-image-83"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p><strong>Add a PIA Interface</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>On the dropdown for "<strong><em>Available Network Ports</em></strong>" you should see your PIA VPN listed. Select your PIA VPN, and click add. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Now that the interface has been added, click on the interface name (it will likely be something like OPT2 or OPT3, but yours may be different...it should be at the bottom of the list). Now you can check the box to enable the interface and give it a better name, I called mine <em>PIA_Netherlands</em>. Also, make sure the reserved network checkboxes are unchecked.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":84,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-02-at-2.55.27-PM-1024x735.png" alt="" class="wp-image-84"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>Finally, go to <strong>Interfaces &gt; VLANs</strong> and add a VLAN. Here, choose your previously configured LAN interface as the parent interface, and choose a VLAN tag between 1 and 4094. This tag will be used in Unifi. I chose 500. </p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":85,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-02-at-3.11.51-PM-1024x363.png" alt="" class="wp-image-85"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>Finally, you will need to plug in both physical interfaces corresponding to your WAN and LAN interfaces. If you have only two NICs on your pfSense box, you should easily be able to figure out which port corresponds to which interface. If you have more than two NICs, it may be more difficult. You need to know which port is which because you will need to tag the LAN interface with the VLAN 500 in Unifi (you can do this now, but we will cover it shortly).</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Outbound NAT Rules</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Select <strong>Firewall > NAT</strong>, and click <strong>Outbound</strong>.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Click the radio button to change the outbound <em>NAT mode</em> to <strong>Hybrid</strong>, and click <strong><em>Save</em></strong>.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>You will need to make rules for the traffic that will need to reach the VPN, which will be the subnet from Unifi that you will add (e.g., in my case, 10.99.2.0/24 is the PIA Subnet). The rules are as follows (see the image below): <strong>Localhost to PIA rule</strong>, <strong>ISAKMP Localhost to PIA rule</strong>, <strong>LAN (Subnet) to PIA rule</strong>, <strong>ISAKMP LAN (Subnet) to PIA rule</strong>.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":459,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2022/01/image-3-1024x436.png" alt="" class="wp-image-459"/><figcaption>Outbound NAT Rules</figcaption></figure>
<!-- /wp:image -->

<!-- wp:paragraph {"dropCap":true} -->
<p class="has-drop-cap"><strong>Below, I will show the settings page for each of the rules that I needed. If you have more interfaces or subnets, you will need to create your own rules to match. Just replace my values with your own.</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Your "localhost" and "127.0.0.0" information will be the same as mine. You will just need to replace the PIA_CHICAGO with your own PIA Interface you created earlier along with your intended subnet to be created in Unifi (e.g., 10.99.2.0/24).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"align":"center"} -->
<p class="has-text-align-center"><span style="text-decoration: underline;"><strong>ISAKMP - localhost to WAN</strong></span></p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":461,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2022/01/image-4-1024x552.png" alt="" class="wp-image-461"/><figcaption> ISAKMP - localhost to WAN </figcaption></figure>
<!-- /wp:image -->

<!-- wp:paragraph {"align":"center"} -->
<p class="has-text-align-center"><strong><span style="text-decoration: underline;">localhost to WAN</span></strong></p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":462,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2022/01/image-5-1024x543.png" alt="" class="wp-image-462"/><figcaption>localhost to WAN</figcaption></figure>
<!-- /wp:image -->

<!-- wp:paragraph {"align":"center"} -->
<p class="has-text-align-center"><strong><span style="text-decoration: underline;"> ISAKMP - LAN (Subnet) to WAN </span></strong></p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":463,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2022/01/image-6-1024x551.png" alt="" class="wp-image-463"/><figcaption>ISAKMP - LAN (Subnet) to WAN</figcaption></figure>
<!-- /wp:image -->

<!-- wp:paragraph {"align":"center"} -->
<p class="has-text-align-center"><strong><span style="text-decoration: underline;">LAN to WAN</span></strong></p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":464,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2022/01/image-7-1024x548.png" alt="" class="wp-image-464"/><figcaption>LAN to WAN</figcaption></figure>
<!-- /wp:image -->

<!-- wp:pullquote -->
<figure class="wp-block-pullquote"><blockquote><p>This concludes our setup of pfSense. </p><p>We can now head over to Unifi!</p></blockquote></figure>
<!-- /wp:pullquote -->

<!-- wp:heading -->
<h2>Unifi Setup and Configuration</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>In our <strong>Unifi Settings</strong> page, we will create two Corporate LAN networks: one will be for the <strong><em>pfSense WAN</em></strong>, and the other will be for the <strong><em>pfSense LAN</em></strong>. As shown in the image below, the subnets correspond to the subnets we mentioned and configured for pfSense above. </p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":87,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-02-at-11.39.20-PM-1024x73.png" alt="" class="wp-image-87"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p><strong>pfSense WAN on Unifi</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Make a new Corporate LAN on Unifi for your <strong>pfSense WAN</strong>, and match the options to the options in the image below. Make sure your subnet matches the subnet added to pfSense earlier for the WAN interface.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":88,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-02-at-11.40.54-PM-1024x929.png" alt="" class="wp-image-88"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p><strong>pfSense LAN on Unifi</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Make another Corporate LAN in Unifi. Below is my settings page for the <strong>pfSense LAN</strong>. You can match your settings to mine. <strong><em>Be sure to set the DHCP Gateway IP to the static IP address you gave to the pfSense LAN Interface earlier (e.g., 10.99.2.15)</em></strong>. <strong><em>Also be sure to add THE SAME VLAN as you did in pfSense earlier (e.g., VLAN 500). </em></strong></p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":90,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-02-at-11.44.51-PM-1024x806.png" alt="" class="wp-image-90"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>Finally for the Unifi LAN, you will need your pfSense physical port (the one corresponding to the LAN interface) plugged into Unifi, and you will need to manually set the port to use the VLAN you set up.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Tagging Ports on Unifi Switches</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>From your Unifi clients page, select a client you want to add to pfSense. Under the overview of the client, select the Port it is plugged into (<em>e.g., Family Room - UniFi Switch 8 POE-60W #7</em> as shown below).</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":92,"width":707,"height":483,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large is-resized"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-02-at-11.49.20-PM.png" alt="" class="wp-image-92" width="707" height="483"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>This should bring up a page that allows you to specifically override the configuration of that port. At this point, select the new pfSense (500) Port Profile <em>(if the Port Profile is not here, please skip to the end of the article to find out how to add the profile).</em> Once you apply the configuration, your device will obtain a new DHCP lease from Unifi in the new pfSense subnet. Then, your wired device will be sending its traffic through PIA.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":91,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-02-at-11.48.17-PM-717x1024.png" alt="" class="wp-image-91"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p><strong>Adding Wireless Clients to pfSense on Unifi APs</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Go to <strong>Settings &gt; Wireless Networks</strong> and click "<em>CREATE NEW WIRELESS NETWORK</em>." You can mimic the setup from the image below, but the important aspect here is to select <strong>pfSense</strong> as the Network with which the WLAN is associated (see pic below). Now, any devices connected to this Wireless network will have their traffic sent through PIA! Verify this is working by going to "whatismyip.com" on a mobile device or some other device on this WLAN. </p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":94,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-03-at-12.01.14-AM-1024x968.png" alt="" class="wp-image-94"/></figure>
<!-- /wp:image -->

<!-- wp:pullquote -->
<figure class="wp-block-pullquote"><blockquote><p><strong>END</strong></p></blockquote></figure>
<!-- /wp:pullquote -->

<!-- wp:paragraph -->
<p><strong>Congratulations</strong> if you made it this far and everything is working! </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>I hope this tutorial aids you in your endeavors to anonymize certain portions of your network. If you have any questions or need assistance, please let me know in the comments! </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>TROUBLESHOOTING</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><strong>Adding Missing Port Profiles</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If for some reason the Port Profile was not made automatically when you created your respective networks, you may need to go to Settings &gt; Profiles in the Unifi dashboard. On this page, switch from RADIUS to SWITCH PORTS. Click "ADD NEW PORT PROFILE." Name the Profile and then click Native Network, and assign the pfSense network to this profile as shown below. Once selected, click Save/Apply. You can return to the assignment area and assign ports appropriately to use the pfSense VPN.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":93,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-02-at-11.53.29-PM-1024x541.png" alt="" class="wp-image-93"/></figure>
<!-- /wp:image -->
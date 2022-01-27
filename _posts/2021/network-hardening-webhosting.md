---
ID: 109
post_title: >
  How to Harden Your Network Security for
  Your In-Home Web Hosting
post_name: network-hardening-webhosting
author: Robert White
post_date: 2021-04-06 16:36:56
layout: post
link: >
  https://whitematter.tech/2021/network-hardening-webhosting/
published: true
tags:
  - hardening
  - network
  - security
  - webhost
categories:
  - Networking
  - Security
  - Tips
  - Tutorials
  - WebHosting
---
<!-- wp:heading -->
<h2>Overview</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The purpose of this post is to provide some tips to address some network security concerns when <a href="https://whitematter.tech/2021/04/01/hosting-your-own-site-with-traefik-and-wordpress/" target="_blank" rel="noreferrer noopener">hosting an externally-facing web server</a> from a device within your home network. For this post, I will be using Unifi networking gear. My screenshots will be of the Unifi controller on my<em> <a href="https://www.amazon.com/gp/product/B086967C9X/ref=as_li_tl?ie=UTF8&amp;camp=1789&amp;creative=9325&amp;creativeASIN=B086967C9X&amp;linkCode=as2&amp;tag=whitematter-20&amp;linkId=4fc0624a437d4bfe761f2ebb02ca61bd" target="_blank" rel="noreferrer noopener">Unifi Dream Machine Pro</a></em> <em>(UDMP)</em>, but I will do my best to overview the concepts so you can replicate with your own networking gear.  Let's get started!</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><em><meta charset="utf-8"><em>As an Amazon Associate, I earn from qualifying purchases.</em> Thank you for<em> supporting the maintenance of this blog. The pricing will be the same for you regardless if you use my links or not! Thanks for your support!</em> </em></p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Strong Passwords/Encryption Keys</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Here is your obligatory "strong password" spiel. Be sure, during the setup and maintenance of any services, OSs, logins, databases, etc., that you use complex and variable passwords and encryption keys where possible. Utilizing a password manager <em>(I recommend <a href="http://1password.com" target="_blank" rel="noreferrer noopener">1password.com</a>)</em> can help you in this endeavor by allowing you to easily generate and securely store complex passwords/encryption keys. This step alone will help mitigate security concerns overall even if a hacker were able to compromise your network security mechanisms. If it takes a hacker one-million years to brute-force the encryption key for your WordPress database, gaining access to the network in which the database rests approaches pointless. This idea is true regarding your OS root user(s) passwords, GUI application logins/passwords,  databases encryption keys, and anything that is secured with a password or encryption key. The concept here is to do your best to prevent hackers from gaining access to your network in the first place <em>(I will show you some tools at your disposal if you use Unifi networking gear in this post)</em>, but if they somehow manage to succeed gaining access, have your resources utilizing passwords/encryption keys locked as much as possible with long, complex, non-reused strings. </p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2><strong>Build and Configure an Isolated "DMZ"-like Network</strong></h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>DMZ stands for "de-militarized zone." DMZs in practice are relatively antiquated in today's networking world, as the concept behind a DMZ is to clump a bunch of relatively insecure servers/resources together and hope a hacker is unable to pivot to your internal network. You will still hear the terminology, especially if you explore technical certifications like <strong>CompTIA's Security+</strong>. The concept behind what we will do is relatively similar to the DMZ. We will setup VLANs and firewall rules on our router to prevent any traffic from coming from the "DMZ" network to the internal network(s). From this point forward, I will refer to the subnet we will create containing the WebHost as the "DMZ network," and all other subnets will be referred to as "internal networks."</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><em>Note: If you are following along with my images, you will need to ensure you are on the old settings page.</em> <em>To disable the new interface, go to <strong>Settings &gt; System Settings</strong> and locate the "New User Interface" check box. Uncheck and click "Deactivate" on the popup to go back to the old settings for now. I will try to update this post in the future with the new interface.</em></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>To get started, in Unifi, go to <strong>Settings &gt; Networks</strong>, and add a Corporate Lan and name it whatever--I named mine DMZ. For other networking gear, you will want to create a subnet or isolated iteration of a LAN or VLAN, but it helps if you are able to make a new subnet. On my Corporate LAN on Unifi, I assigned VLAN 777 to this subnet.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":118,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-05-at-10.44.06-PM-1024x62.png" alt="" class="wp-image-118"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>Now, we can assign any device to this network. Below is a screenshot of the port assignment for my webhost. You can assign any physical port on your Unifi switches to this particular subnet. Other networking devices will probably have similar setups or allowances. If your particular networking equipment does not, perhaps it is time to consider switching to Unifi!</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":119,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-06-at-3.02.53-PM-673x1024.png" alt="" class="wp-image-119"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p><strong>Setting Firewall Rules</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Next, go to <strong>Settings &gt; Routing &amp; Firewall &gt; Firewall</strong>. From here, we want to select <strong>LAN IN</strong>. Click "Create New Rule." I recommend naming your rules something descriptive and helpful (e.g., Block DMZ -&gt; IoT). You will want to make sure the rule is <em>Enabled</em> and <em>"Before predefined rules"</em> is selected for the <em>Rule Applied</em> option. Check <em>"Drop"</em> as the <em>Action,</em> and choose <em>"All"</em> for the <em>IPv4 Protocol</em> selection. Now, under <strong>Advanced,</strong> select all available states <em>(i.e., New, Established, Invalid, Related)</em>. Leave the IPsec option as is. Finally, we will change the Source and Destination to match our intended subnets. Under <strong>Source</strong>, choose <em>"Network"</em> for <em>"Source Type"</em> and select your DMZ network. Similarly, for <strong>Destination</strong>, choose <em>"Network"</em> for <em>"Source Type"</em> and select your internal network (in the image below, I chose my IoT network). This will drop all IPv4 traffic in any state from your DMZ network destined for your internal network. Be aware that this will cause trouble if you need to access your WebHost for some reason from your internal networks. This will break SSH, RDP, etc. See below if you need to setup certain protocol access to your WebHost.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":120,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-06-at-3.08.18-PM-897x1024.png" alt="" class="wp-image-120"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>If you have multiple internal networks defined as Corporate LANs in Unifi, you will need to recreate the above rules for <strong><em>each</em></strong> network. In the image below, you can see I set up this same rule for my IoT and Protect networks.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":117,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-05-at-10.45.05-PM-1024x90.png" alt="" class="wp-image-117"/></figure>
<!-- /wp:image -->

<!-- wp:heading -->
<h2><strong>Allowing Specific Traffic From DMZ to Internal Network</strong></h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Any adjustments made at this point will lead to unnecessary security concerns. I highly recommend avoiding making these adjustments unless absolutely necessary. Before making the changes, ask yourself if there is <strong><em>any possible other way</em></strong> to achieve your goal--protect your internal resources as much as possible.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Adding Firewall Rules</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The image below shows how your configuration might look if you need certain protocols open between your WebHost and your internal network. Notice the changes from our previous rules: <strong><em>Action = Accept, Invalid = Unchecked, Source = Address/Port Group</em></strong>. </p>
<!-- /wp:paragraph -->

<!-- wp:image -->
<figure class="wp-block-image"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-06-at-3.24.24-PM-824x1024.png" alt="This image has an empty alt attribute; its file name is Screen-Shot-2021-04-06-at-3.24.24-PM-824x1024.png"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>Concerning <strong>Source </strong>specifically, I highly recommend specifying which WebHost will need this access. For example, if you have multiple WebHosts, and you would like your WordPress WebHost to be accessible via SSH, choose "<em>Create IPv4 Address Group.</em>" Input a descriptive name (e.g., WebHost), and add the static IP of the WebHost under "<em>Address</em>" (e.g., 10.99.100.77).</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":122,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-06-at-3.30.40-PM-1024x828.png" alt="" class="wp-image-122"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p><em>Note: Your WebHost really should have a static address in general, so if you do not currently have it configured that way, go back and give the WebHost a static address before proceeding. </em></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Finally, continuing under <strong>Source,</strong> select "<em>Create Port Group.</em>" Here, add the ports which you would like to be able to access from your internal network. Below, you can see I added SSH (port 22) and RDP (port 3389). Click "<em>Save.</em>" Under <strong>Destination</strong>, you can either specify which networks/specific devices need this access or allow any of your internal networks to access these ports by leaving "<em>Any" </em>selected in both boxes.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":123,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-06-at-3.32.05-PM-1024x1008.png" alt="" class="wp-image-123"/></figure>
<!-- /wp:image -->

<!-- wp:heading -->
<h2>Enable IPS/IDS</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The <strong><em><a href="https://www.amazon.com/gp/product/B086967C9X/ref=as_li_tl?ie=UTF8&amp;camp=1789&amp;creative=9325&amp;creativeASIN=B086967C9X&amp;linkCode=as2&amp;tag=whitematter-20&amp;linkId=4fc0624a437d4bfe761f2ebb02ca61bd" target="_blank" rel="noreferrer noopener">Unifi Dream Machine Pro</a></em></strong> comes with some excellent security features. The feature we will look at next is IPS/IDS located under <strong>Settings &gt; Threat Management</strong> (old GUI) or <strong>Settings &gt; Security &gt; Internet Threat Management</strong> (new GUI). IPS stands for Intrusion Prevention System while IDS stands for Intrusion Detection System. The best way to think about these concepts is to think about IPS as an "active" system while IDS is a "passive" system. IDS pays attention to all of your traffic and logs/alerts you if something nefarious/abnormal is detected. IPS on the other hand pays attention to all of your traffic and actively prevents/blocks traffic it detects as nefarious/abnormal based on the rules you give it. </p>
<!-- /wp:paragraph -->

<!-- wp:quote -->
<blockquote class="wp-block-quote"><p>IPS may be the single best security measure you have at your disposal with the UDMP to protect your network while WebHosting at home. </p></blockquote>
<!-- /wp:quote -->

<!-- wp:paragraph -->
<p>If you do not use Unifi, you may be able to get hardware or software that provides this service, but I am not knowledgeable about current consumer/prosumer-priced alternatives.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>In your <strong>Settings &gt; Threat Management</strong> page, I recommend choosing IPS for your Protection Mode. If you are not using a<em>&nbsp;<a href="https://www.amazon.com/gp/product/B086967C9X/ref=as_li_tl?ie=UTF8&amp;camp=1789&amp;creative=9325&amp;creativeASIN=B086967C9X&amp;linkCode=as2&amp;tag=whitematter-20&amp;linkId=4fc0624a437d4bfe761f2ebb02ca61bd" target="_blank" rel="noreferrer noopener">Unifi Dream Machine Pro</a></em>, this may negatively impact your overall download speed. Before you enable IPS, your device will tell you what your maximum throughput will be with IPS enabled. The <em><a href="https://www.amazon.com/gp/product/B086967C9X/ref=as_li_tl?ie=UTF8&amp;camp=1789&amp;creative=9325&amp;creativeASIN=B086967C9X&amp;linkCode=as2&amp;tag=whitematter-20&amp;linkId=4fc0624a437d4bfe761f2ebb02ca61bd" target="_blank" rel="noreferrer noopener">Unifi Dream Machine Pro</a></em> is good to use IPS up to 3.5Gbps of throughput. Below you can see the way I currently have the IPS rules configured. The rules are similar in both version of the GUI (new and old). This image is from the old GUI, but you should easily be able to mix+match on the new GUI too.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":124,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-06-at-3.50.42-PM-1024x988.png" alt="" class="wp-image-124"/></figure>
<!-- /wp:image -->

<!-- wp:heading -->
<h2>Wrapping Up</h2>
<!-- /wp:heading -->

<!-- wp:quote -->
<blockquote class="wp-block-quote"><p>Network security is an important topic to discuss in general, but the benefits of taking security seriously when WebHosting on a device at home cannot be overstated. </p></blockquote>
<!-- /wp:quote -->

<!-- wp:paragraph -->
<p>I implore you to consider implementing the above outlined security measures regardless of your WebHosting status, but it should really not even be an option if you do indeed have a WebHost. Go ahead and get your isolated network prepared and enable IPS on your <em><a href="https://www.amazon.com/gp/product/B086967C9X/ref=as_li_tl?ie=UTF8&amp;camp=1789&amp;creative=9325&amp;creativeASIN=B086967C9X&amp;linkCode=as2&amp;tag=whitematter-20&amp;linkId=4fc0624a437d4bfe761f2ebb02ca61bd" target="_blank" rel="noreferrer noopener">Unifi Dream Machine Pro</a></em> or other <em><a href="https://www.amazon.com/gp/product/B019PBEI5W/ref=as_li_tl?ie=UTF8&amp;camp=1789&amp;creative=9325&amp;creativeASIN=B019PBEI5W&amp;linkCode=as2&amp;tag=whitematter-20&amp;linkId=6c6cfd4f08014ed587a37392b9bb957f" target="_blank" rel="noreferrer noopener">Unifi Gateway device</a>.</em> </p>
<!-- /wp:paragraph -->
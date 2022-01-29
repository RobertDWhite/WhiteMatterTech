---
ID: 240
post_title: 'How to Connect to Your Unifi Dream Machine or UNVR with SSL from Let&#8217;s Encrypt'
post_name: >
  how-to-connect-to-your-unifi-dream-machine-or-unvr-with-ssl-from-lets-encrypt
author: Robert White
post_date: 2021-09-21 23:37:12
layout: post
link: >
  https://whitematter.tech/2021/how-to-connect-to-your-unifi-dream-machine-or-unvr-with-ssl-from-lets-encrypt/
published: true
tags:
  - network
  - security
  - unifi
  - webhost
categories:
  - Networking
  - Security
  - Tips
  - Tutorials
---
<!-- wp:paragraph {"dropCap":true} -->
<p class="has-drop-cap">Alright, if you have a Unifi device like a <a href="https://amzn.to/3zvS2nd" target="_blank" rel="noreferrer noopener"><em>Dream Machine</em></a>, <em><a href="https://www.amazon.com/gp/product/B086967C9X/ref=as_li_tl?ie=UTF8&amp;camp=1789&amp;creative=9325&amp;creativeASIN=B086967C9X&amp;linkCode=as2&amp;tag=whitematter-20&amp;linkId=4fc0624a437d4bfe761f2ebb02ca61bd" rel="noreferrer noopener" target="_blank"><u>Dream Machine Pro</u></a></em>, <em><a href="https://amzn.to/3Cze3TN" title="https://amzn.to/3Cze3TN">UNVR</a></em>, <em><a href="https://amzn.to/2W1CZUz" target="_blank" rel="noreferrer noopener" title="https://amzn.to/2W1CZUz">CloudKey</a></em>, or other device, you likely have been met with the dreaded red triangle followed by the tedious words, "<strong>Your</strong> <strong>connection is not private</strong>." </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>For some reason, at the time of this writing, there is still no official/built-in way to generate a cert for your device, though some interesting <a href="https://github.com/kchristensen/udm-le" target="_blank" rel="noreferrer noopener">GitHub projects</a> exist that claim to allow this functionality if you're feeling lucky. My solution is not quite as glamorous as directly <a href="https://github.com/kchristensen/udm-le" title="https://github.com/kchristensen/udm-le" target="_blank" rel="noreferrer noopener">generating certs with LetsEncrypt server-side</a> like the GitHub project linked above, but it will definitely get the job done!</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>For my solution, I have a NGINX reverse proxy setup to forward traffic from a subdomain associated with my domain (e.g., unifi.whitematter.tech, protect.whitematter.tech) to either my Dream Machine Pro or my UNVR as necessary. For steps on setting up a reverse proxy using Docker, check out my previous post <a href="https://whitematter.tech/2021/run-a-reverse-proxy-using-docker/" target="_blank" rel="noreferrer noopener">here</a>. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Once your reverse proxy is setup and you have added a subdomain to your DNS records (e.g., unifi.whitematter.tech) to point to your public IP address, you are ready to configure your reverse proxy. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This particular configuration assumes that you have forwarded your subdomain (e.g., unifi.whitematter.tech) to your public IP. If you do not have a static public IP address, you might consider a free dynamic DNS service like <a href="https://www.duckdns.org/" target="_blank" rel="noreferrer noopener" title="https://www.duckdns.org/">DuckDNS</a>, which will automatically update the DNS records to point to your IP address if your public IP is changed by your ISP. I have my private domain pointing to a DuckDNS hostname.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><meta charset="utf-8"><em>As an Amazon Associate, I earn from qualifying purchases.</em> Thank you for<em> supporting the maintenance of this blog. The pricing will be the same for you regardless if you use my links or not! Thanks for your support!</em> </p>
<!-- /wp:paragraph -->

<!-- wp:pullquote -->
<figure class="wp-block-pullquote"><blockquote><p>Configure the Reverse Proxy for Unifi Devices</p></blockquote></figure>
<!-- /wp:pullquote -->

<!-- wp:paragraph -->
<p>The config is relatively simple at this point. Check out the image below to see what the config should look like. Under "Domain Names," add your domain (e.g., unifi.whitematter.tech). The "<strong>Scheme</strong>" should be "<strong>https</strong>" and the "<strong>Forward Hostname / IP</strong>" should be the local IP of your Unifi Dream Machine or other Unifi device (e.g., 192.168.1.1, 10.0.0.1). The "<strong>Forward Port</strong>" should be 443. I always check "<strong>Cache Assets</strong>." Since Unifi devices are protected with Unifi account, I leave the "<strong>Access List</strong>" public. You can protect it with a username/password, but I recommend instead using a strong Unifi password, which is better in the long run anyway. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Now, click "<strong>SSL</strong>" in the top menu (see the next image below). Choose "<strong>Request a new SSL Certificate</strong>" and check the "<strong>Force SSL</strong>," "<strong>HTTP/2 Support</strong>," and "<strong>HSTS Enabled</strong>" options. Enter an email address (this is used to send to Let's Encrypt to generate your cert), and finally agree to the Let's Encrypt terms after reading them. Click "<strong>Save</strong>," and you're good to go!</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><img class="wp-image-242" style="width: 500px;" src="https://whitematter.tech/wp-content/uploads/2021/09/Screenshot_3.png" alt=""></p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":243,"sizeSlug":"full","linkDestination":"none"} -->
<figure class="wp-block-image size-full"><img src="https://whitematter.tech/wp-content/uploads/2021/09/Screenshot_4.png" alt="" class="wp-image-243"/></figure>
<!-- /wp:image -->

<!-- wp:heading -->
<h2>Closing</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Assuming you followed these instructions successfully and your DNS records are correct, you should be able to go to unifi.yourdomain.com and connect to your Unifi device with the cert generated from Let's Encrypt. You will notice that the annoying error will not appear upon connection! When you view the cert info associated with your Unifi domain now, you will be directed to <a href="https://letsencrypt.org/documents/isrg-cps-v4.1/" target="_blank" rel="noreferrer noopener">https://letsencrypt.org/documents/isrg-cps-v4.1/</a> ! </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This solution is nice to me because you only have to remember your subdomain instead of an IP address for your devices. This also lets you connect to your device without going through Unifi's cloud-based connection while outside of your local network. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Like mentioned above, anytime you make services available to the world, you should protect your resources with strong passwords. I recommend a password manager to help with this. I use <a href="https://1password.com/" target="_blank" rel="noreferrer noopener">1Password</a> and a <a href="https://www.amazon.com/Yubico-Authentication-Security-Supported-Accounts/dp/B08DHL1YDL/ref=sr_1_4?dchild=1&amp;keywords=yubikey&amp;qid=1632281315&amp;sr=8-4" target="_blank" rel="noreferrer noopener">Yubikey</a>. </p>
<!-- /wp:paragraph -->

<!-- wp:quote -->
<blockquote class="wp-block-quote"><p>As always, if you have any questions, feel free to post below or reach out to me at <a href="mailto:robert@whitematter.tech" target="_blank" rel="noreferrer noopener">robert@whitematter.tech</a>. </p><p>Thanks for reading!</p></blockquote>
<!-- /wp:quote -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->
---
title: "How to Connect to Your Unifi Dream Machine or UNVR with SSL from Let's Encrypt"
date: "2021-09-22"
categories:
  - "networking"
  - "security"
  - "tips"
  - "tutorials"
tags:
  - "network"
  - "security"
  - "unifi"
  - "webhost"
cover:
    image: "/posts/how-to-connect-to-your-unifi-dream-machine-or-unvr-with-ssl-from-lets-encrypt/header_how-to-connect-to-your-unifi-dream-machine-or-unvr-with-ssl-from-lets-encrypt.png"
    alt: "SSL Error Screenshot"
    caption: "<text>"
    relative: true
aliases:
    - /posts/how-to-connect-to-your-unifi-dream-machine-or-unvr-with-ssl-from-lets-encrypt/how-to-connect-to-your-unifi-dream-machine-or-unvr-with-ssl-from-lets-encrypt/
    - /2021/how-to-connect-to-your-unifi-dream-machine-or-unvr-with-ssl-from-lets-encrypt/
---
> **Update 05/09/2022**:
> The conclusions of this post will route your traffic externally, requiring your local devices to reach external DNS servers (e.g., in my case, CloudFlare) in order to resolve your Unifi Gateway address. If you want to handle all of this completely locally/internally, check out my newer post: [HTTPS for Internal Resources](https://whitematter.tech/2022/05/001)

--------------------------------------------------------------------------------------------------

Alright, if you have a Unifi device like a [_Dream Machine_](https://amzn.to/3zvS2nd), _[Dream Machine Pro](https://www.amazon.com/gp/product/B086967C9X/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B086967C9X&linkCode=as2&tag=whitematter-20&linkId=4fc0624a437d4bfe761f2ebb02ca61bd)_, _[UNVR](https://amzn.to/3Cze3TN "https://amzn.to/3Cze3TN")_, _[CloudKey](https://amzn.to/2W1CZUz "https://amzn.to/2W1CZUz")_, or other device, you likely have been met with the dreaded red triangle followed by the tedious words, "**Your** **connection is not private**."

For some reason, at the time of this writing, there is still no official/built-in way to generate a cert for your device, though some interesting [GitHub projects](https://github.com/kchristensen/udm-le) exist that claim to allow this functionality if you're feeling lucky. My solution is not quite as glamorous as directly [generating certs with LetsEncrypt server-side](https://github.com/kchristensen/udm-le "https://github.com/kchristensen/udm-le") like the GitHub project linked above, but it will definitely get the job done!

For my solution, I have a NGINX reverse proxy setup to forward traffic from a subdomain associated with my domain (e.g., unifi.whitematter.tech, protect.whitematter.tech) to either my Dream Machine Pro or my UNVR as necessary. For steps on setting up a reverse proxy using Docker, check out my previous post [here](https://whitematter.tech/2021/run-a-reverse-proxy-using-docker/).

Once your reverse proxy is setup and you have added a subdomain to your DNS records (e.g., unifi.whitematter.tech) to point to your public IP address, you are ready to configure your reverse proxy.

This particular configuration assumes that you have forwarded your subdomain (e.g., unifi.whitematter.tech) to your public IP. If you do not have a static public IP address, you might consider a free dynamic DNS service like [DuckDNS](https://www.duckdns.org/ "https://www.duckdns.org/"), which will automatically update the DNS records to point to your IP address if your public IP is changed by your ISP. I have my private domain pointing to a DuckDNS hostname.

_As an Amazon Associate, I earn from qualifying purchases._ Thank you for _supporting the maintenance of this blog. The pricing will be the same for you regardless if you use my links or not! Thanks for your support!_

# Configure the Reverse Proxy for Unifi Devices

The config is relatively simple at this point. Check out the image below to see what the config should look like. Under "Domain Names," add your domain (e.g., unifi.whitematter.tech). The "**Scheme**" should be "**https**" and the "**Forward Hostname / IP**" should be the local IP of your Unifi Dream Machine or other Unifi device (e.g., 192.168.1.1, 10.0.0.1). The "**Forward Port**" should be 443. I always check "**Cache Assets**." Since Unifi devices are protected with Unifi account, I leave the "**Access List**" public. You can protect it with a username/password, but I recommend instead using a strong Unifi password, which is better in the long run anyway.

Now, click "**SSL**" in the top menu (see the next image below). Choose "**Request a new SSL Certificate**" and check the "**Force SSL**," "**HTTP/2 Support**," and "**HSTS Enabled**" options. Enter an email address (this is used to send to Let's Encrypt to generate your cert), and finally agree to the Let's Encrypt terms after reading them. Click "**Save**," and you're good to go!

![](/posts/how-to-connect-to-your-unifi-dream-machine-or-unvr-with-ssl-from-lets-encrypt/images/Screenshot_3.png)

![](/posts/how-to-connect-to-your-unifi-dream-machine-or-unvr-with-ssl-from-lets-encrypt/images/Screenshot_4.png)

## Closing

Assuming you followed these instructions successfully and your DNS records are correct, you should be able to go to unifi.yourdomain.com and connect to your Unifi device with the cert generated from Let's Encrypt. You will notice that the annoying error will not appear upon connection! When you view the cert info associated with your Unifi domain now, you will be directed to [https://letsencrypt.org/documents/isrg-cps-v4.1/](https://letsencrypt.org/documents/isrg-cps-v4.1/) !

This solution is nice to me because you only have to remember your subdomain instead of an IP address for your devices. This also lets you connect to your device without going through Unifi's cloud-based connection while outside of your local network.

Like mentioned above, anytime you make services available to the world, you should protect your resources with strong passwords. I recommend a password manager to help with this. I use [1Password](https://1password.com/) and a [Yubikey](https://www.amazon.com/Yubico-Authentication-Security-Supported-Accounts/dp/B08DHL1YDL/ref=sr_1_4?dchild=1&keywords=yubikey&qid=1632281315&sr=8-4).

> As always, if you have any questions, feel free to start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a GitHub](https://github.com/RobertDWhite/WhiteMatterTech/pulls) PR to recommend changes/fixes in the article, or reach out to me directly at [robert@whitematter.tech](mailto:robert@whitematter.tech).
>
> Thanks for reading!
>
> Robert

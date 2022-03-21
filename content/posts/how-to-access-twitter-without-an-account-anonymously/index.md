---
title: "How to Access Twitter Without an Account, Anonymously"
date: "2021-11-19"
categories:
  - "docker"
  - "security"
  - "tips"
  - "tutorials"
  - "unraid"
tags:
  - "docker"
  - "twitter"
  - "unraid"
cover:
    image: "/posts/how-to-access-twitter-without-an-account-anonymously/header_how-to-access-twitter-without-an-account-anonymously.jpg"
    alt: "Twitter Icon"
    caption: "<text>"
    relative: true
aliases:
    - /posts/how-to-access-twitter-without-an-account-anonymously/how-to-access-twitter-without-an-account-anonymously/
    - /2021/how-to-access-twitter-without-an-account-anonymously/
---

Interestingly, after my previous post describing [how to route Docker containers through VPN on Unraid,](https://whitematter.tech/2021/how-to-route-any-docker-container-through-vpn-in-unraid/) I received a substantial lot of questions via email about my hints at accessing Twitter anonymously. This post is my response to those questions, and I will describe my workflow to access Twitter feeds anonymously, without an account.

This post will assume you have read my post on [how to route Docker containers through VPN on Unraid](https://whitematter.tech/2021/how-to-route-any-docker-container-through-vpn-in-unraid/) or that you already know how to accomplish this. If you do not, start [here](https://whitematter.tech/2021/how-to-route-any-docker-container-through-vpn-in-unraid/ "https://whitematter.tech/2021/how-to-route-any-docker-container-through-vpn-in-unraid/").

I will be using **Unraid** in this tutorial, but you could accomplish the same functionality with Docker on another host OS.

## Nitter

The Docker container used to access Twitter is a wonderful third-party tool known as _Nitter_ (**_zedeus/nitter_**). This container is relatively self-explanatory, but the purpose of the container is to be able to search for your favorite Twitter users and see their feeds.

All requests go through the backend, and your client never talks to Twitter, which is how Nitter prevents Twitter from tracking your IP or JavaScript fingerprint, thus enhancing privacy. Behind a VPN, you have yourself a self-hosted, anonymous Twitter reader that does not require an account or track you.

There are also public Nitter instances you could use if your prefer not to host your own instance: [https://github.com/zedeus/nitter/wiki/Instances](https://github.com/zedeus/nitter/wiki/Instances). But don't you want to [use your reverse proxy](https://whitematter.tech/2021/run-a-reverse-proxy-using-docker/) to route twitter.your-domain.com to your Nitter instance and have your own Twitter?

![](/posts/how-to-access-twitter-without-an-account-anonymously/images/Screen-Shot-2021-11-19-at-11.25.38-AM-1024x644.png)

Example Nitter Search for "Apple"

Search for your favorite user(s), select their profile, and click the _RSS icon_ in the top right corner of the screen. Copy the URL of the RSS page for use in the next steps.

![](/posts/how-to-access-twitter-without-an-account-anonymously/images/Screen-Shot-2021-11-19-at-11.41.37-AM.png)

Click the RSS Icon

![](/posts/how-to-access-twitter-without-an-account-anonymously/images/Screen-Shot-2021-11-19-at-11.41.29-AM.png)

Example User Account on Nitter, of your favorite Elon Musk

## FreshRSS

Now, in conjunction with your Nitter container behind a VPN _(or simply a public Nitter instance like mentioned above)_, add FreshRSS (**_linuxserver/freshrss_**). This container will allow you to maintain the records of the feeds you want to follow in the form of RSS.

Even if you choose to only use this container to access a locally hosted Nitter instance, I still recommend routing it through a VPN. There may come a day where you open your Nitter container publically or where you decide to grab RSS feeds from elsewhere. In either case, a VPN will help provide anonymity and security, making it even harder for trackers to store your data.

Once the container is launched, select "**_Add a feed or category_**" on the left navigation panel. Under "**_Add a category_**," you can create your own categories to keep your feeds organized (e.g., Tech, Politics, etc.). Under "**_Add a feed_**," you can begin adding the feeds from Nitter that you want to follow. In my screenshot below, you can see I am using a public Nitter instance and attempting to follow Elon Musk ([https://nitter.fdn.fr/elonmusk/rss](https://nitter.fdn.fr/elonmusk/rss)). Add the URL in the "_**Feed URL**_" section, select a category that you have made previously, and click "**_Add_**" to confirm. If you want to add even ANOTHER layer of privacy, you can also set up a SOCKS5 proxy connection as shown in the screenshot. If using **Unraid** to host your SOCKS5 proxy server, it would look something like the screenshot below.

![](/posts/how-to-access-twitter-without-an-account-anonymously/images/Screen-Shot-2021-11-19-at-12.04.52-PM-1024x551.png)

Even with FreshRSS, you can consider [using your reverse proxy](https://whitematter.tech/2021/run-a-reverse-proxy-using-docker/) to route something like rss.your-domain.com to your container.

I would **highly recommend** setting up HTTP auth via your reverse proxy if you plan to open either of these containers to the public. Strong authentication will be invaluable in such a case. As always, I recommend the use of a password manager in order to generate, store, and access strong credentials (_I use [1Password](https://1password.com/ "https://1password.com/") currently)_.

## Conclusion

**Congratulations** if you made it this far and everything is working! I hope this tutorial aids you in your endeavors to anonymize your access to Twitter while substantially enhancing the privacy and preventing tracking of your personal data. If you have any questions or need assistance, please let me know in the comments or email me at [robert@whitematter.tech](mailto:robert@whitematter.tech) !

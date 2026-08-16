---
title: "This Site on Tor (Onion Service)"
hidemeta: true
disableShare: true
ShowReadingTime: false
ShowBreadCrumbs: false
ShowPostNavLinks: false
ShowWordCount: false
comments: false
---

This site is also available as a **Tor onion service**: a version reachable only
through the [Tor network](https://www.torproject.org/). An onion service conceals
the service's network location and IP address, while Tor Browser prevents the
site from learning a visitor's public IP address through the connection itself.

This privacy property has defined boundaries. Your network provider can
ordinarily observe a connection to Tor, although it cannot ordinarily determine
the particular onion service you visit. Information you voluntarily disclose
through an account, form, or other application interaction remains attributable
in the ordinary way.

## Onion address

```
geum4af5dyfmyiagbablqyixvwcjlo7zvwgmyebcsg7qmnbucignomqd.onion
```

[**Open this site on Tor**](http://geum4af5dyfmyiagbablqyixvwcjlo7zvwgmyebcsg7qmnbucignomqd.onion)

The address requires a Tor-aware browser and connection. **Tor Browser** is the
recommended client; in an ordinary browser, copy the address above and open it
in Tor Browser instead.

## Contribute capacity

This cluster also contributes censorship-circumvention capacity through a
Snowflake proxy deployment and a privately configured obfs4 bridge. Those
services help Tor users reach the network where direct connections are subject
to filtering. [Read about the deployment and its operational boundaries](/onion/tor-bridges-kubernetes/).

## Don't have Tor Browser yet?

Tor Browser is free and available from the official
[Tor Project download page](https://www.torproject.org/download/) for Windows,
macOS, Linux, and Android. Install it, open it, and paste the address above.

## Navigating from the clearnet site

Tor Browser displays a purple **".onion available"** prompt when a clearnet
site returns the non-standard `Onion-Location` HTTP response header. This site
does not currently emit that header from its public edge, which means the prompt
should not be relied upon for automatic navigation. Use the address above when
you want the onion version of the site.

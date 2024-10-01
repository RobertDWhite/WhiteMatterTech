---
title: "How to Use ODoH with UniFi: Securing DNS Queries with Anonymous and Encrypted Resolvers"
date: "2024-09-30"
categories:
  - "networking"
  - "unifi"
  - "dns"
tags:
  - "dns"
  - "networking"
  - "unifi"
  - "anonymous"
  - "encryption"
cover:
    image: "/posts/odoh-unifi/odoh.jpg"
    alt: "odoh"
    caption: "<text>"
    relative: true
aliases:
    - /posts/odoh-unifi/odoh-unifi/
    - /2024/odoh-unifi/
---

# How to Use ODoH with UniFi: Securing DNS Queries with Anonymous and Encrypted Resolvers

I have been using ODoH with Pi-hole DNS servers on my network for a while now. Recently, some UniFi updates introduced support for DNS over HTTPS (DoH) technology. This led me to explore whether it was possible to use ODoH with UniFi. Oblivious DNS over HTTPS (ODoH) adds an essential layer of privacy to your internet activity by anonymizing DNS queries. Today, I'll walk you through how to configure ODoH with UniFi, leveraging DNSCrypt resolvers to keep your queries private.

## What is ODoH?

Oblivious DNS over HTTPS (ODoH) is a protocol designed to keep your DNS queries secure and private. While regular DNS queries are often visible to ISPs or other intermediaries, ODoH encrypts these queries and sends them through proxy servers, preventing third parties from tracking your browsing history or identifying the origin of your requests.

## Setting up ODoH in UniFi

To get started with ODoH on your UniFi network, follow the steps below. We'll configure the DNS resolvers within UniFi's settings to use a DNSCrypt resolver, which supports encrypted DNS queries via ODoH.

### Step-by-Step Instructions:

1. **Access the UniFi Controller**: Open your UniFi Network application or log into your UniFi console.
   
2. **Navigate to Security Settings**:
   - Go to `Settings` in the left-hand navigation bar.
   - Select `Security`.
   - Under `General`, look for the section labeled **DNS Shield**.

3. **Set DNS Shield to Custom**:
   - In the **DNS Shield** section, switch the setting to **Custom**. This allows you to specify custom DNS resolvers instead of using the default options.

4. **Add ODoH DNS Resolvers**:
   - For the custom DNS resolver, we’ll use a DNSCrypt server based in Montreal as an example. Enter the following resolver information in the custom DNS field:
   
   `sdns://AQcAAAAAAAAADzE0Ny4xODkuMTM2LjE4MyCsCFB6EkMJdZLQ-IlsBbtjtSlasCfsTx7Q6u0bOI8OwBkyLmRuc2NyeXB0LWNlcnQuZG5zY3J5LnB0`
   
   This string points to a DNSCrypt server in Montreal that supports ODoH encryption. DNSCrypt not only encrypts the queries but also anonymizes the source, adding an additional layer of privacy.

5. **Save Your Configuration**:
   - After adding the custom resolver, save the changes. Your UniFi network will now route DNS queries through the specified ODoH resolver.

   Once your configuration is saved, if your device is using you Unifi gateway for DNS, you can run a [DNS leak test](https://www.dnsleaktest.com/) to ensure you have the settings correct. If you used the Montreal server mentioned above, the DNS leak test results should show the server you selected as originating in Montreal, Canada.

![Montreal](/posts/odoh-unifi/images/odoh_montreal.png)

### Where to Find Additional Resolvers

If you’d like to use a different ODoH server, you can find a full list of DNSCrypt-enabled resolvers by visiting the public list of DNS resolvers on GitHub:

[Public DNSCrypt Resolvers List](https://github.com/DNSCrypt/dnscrypt-resolvers/blob/master/v3/public-resolvers.md)

Be aware of the different features of each server. Some servers on this list may log your queries, may not support DNSSEC, or may censor content. This repository also includes many options from different regions, so you can pick one that best fits your needs. 

## Conclusion

Using ODoH with UniFi is a simple but powerful way to protect your network's DNS traffic from prying eyes. By anonymizing and encrypting DNS queries, you can significantly enhance the privacy and security of your internet activity.

I believe in making privacy-first solutions accessible to everyone, and I advocate for taking steps to increase privacy whenever possible. Whether you're setting up secure DNS for a home network or a business, ODoH can be a crucial part of your network security strategy.

> As always, if you have any questions, feel free to start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a GitHub](https://github.com/RobertDWhite/WhiteMatterTech/pulls) PR to recommend changes/fixes in the article, or reach out to me directly at [robert@whitematter.tech](mailto:robert@whitematter.tech).
>
> Thanks for reading!
>
> Robert

_Stay secure, stay private._
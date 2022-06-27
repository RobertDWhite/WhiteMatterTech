---
title: "Cloudflare Tunneling to Internal Resources with Cloudflared"
date: "2022-06-27"
categories:
  - "security"
  - "tutorials"
  - "homelab"
  - "networking"
tags:
  - "dns"
  - "nginx"
  - "proxy"
  - "docker"
  - "letsencrypt"
  - "internal"
  - "networking"
cover:
    image: "/posts/cloudflare-tunneling/logo.png"
    alt: "Cloudflare Tunnel"
    caption: "<text>"
    relative: true
aliases:
    - /posts/cloudflare-tunneling/cloudflare-tunneling
    - /2022/cloudflare-tunneling
    - /2022/06/003
    - /2022/06/27
---

--------------------------------------------------
# Introduction

This post will cover how to set up a Docker container of Cloudflared on your internal network to provide a private tunnel from Cloudflare to your internal resources. After setting up the Cloudflared tunnels, you will no longer need to expose ports 80 and 443.

This post assumes you currently have a vibrant and functioning internal network with a reverse proxy (in my case, [Nginx Proxy Manager](https://whitematter.tech/posts/run-a-reverse-proxy-using-docker/)) already configured. Additionally, this post assumes you have a Cloudflare account with the ability to modify DNS records for your domain(s).



--------------------------------------------------------
# The Cloudflared project

For this project, I am running Docker-Compose and Docker on a Ubuntu-VM. When I first started this project, I used my Unraid system and followed these instructions using the **aeleos/cloudflared** container: [https://github.com/aeleos/cloudflared](https://github.com/aeleos/cloudflared). I since have moved to Ubuntu to keep my hosting and my site independent from Unraid, but if you're using Unraid, I recommend that link.

For simplicity, I will be storing the necessary files at **/docker-host/cloudflared-whitemattertech/**. If you have more than one domain you would like to tunnel internally, I recommend creating separate folders for those such as **/docker-host/cloudflared-domain2/** and **/docker-host/cloudflared-domain3/**. Each step will need to be run separately for each separate domain.

First: login to Cloudflare. To do this, in terminal, paste the following:
```
docker run --rm -v /.cloudflared:/home/nonroot/.cloudflared/ cloudflare/cloudflared:latest tunnel login
```
Once run, you will see something like the image below:
![](/posts/cloudflare-tunneling/images/cloudflared-login.png)

Use the generated URL in the terminal output to sign into Cloudflare with your credentials. Once signed in, the required cert will be placed into your /docker-host/cloudflared-whitemattertech/.cloudflared directory.

Next, we will create a tunnel. In terminal, paste the following, being sure to change the **TUNNELNAMEHERE** to whatever you would like:
```
docker run --rm -v /docker-host/cloudflared-whitemattertech/.cloudflared:/home/nonroot/.cloudflared/ cloudflare/cloudflared:latest tunnel create TUNNELNAMEHERE
```
You can check the status of the tunnel with the following command:
```
docker run --rm -v /docker-host/cloudflared-whitemattertech/.cloudflared:/home/nonroot/.cloudflared/ cloudflare/cloudflared:latest tunnel list
```
Copy the tunnel ID from that command for use later.

Now, we need to create and modify a **config.yaml**:
```
touch /docker-host/cloudflared-whitemattertech/.cloudflared/config.yaml
nano /docker-host/cloudflared-whitemattertech/.cloudflared/config.yaml
```
In the config.yaml, paste the following, replacing the **"xxx..."** with your tunnel ID copied from earlier.

```
tunnel: xxxxxxxxxxxxxxxxxxxxxxxxxx
credentials-file: /home/nonroot/.cloudflared/xxxxxxxxxxxxxxxxxxxxxxxx.json

ingress:
  - service: https://localhost:443
    originRequest:
      originServerName: whitematter.tech
```
Under "**ingress**", **service** references the reverse proxy host you are using (in my case, the [Nginx Proxy Manager](https://whitematter.tech/posts/run-a-reverse-proxy-using-docker/) is hosted on the same host). Replace **localhost:443** with your reverse proxy IP as necessary. **originServerName** should be your root level domain. If you have issues starting the container, you very well may need to add a random subdomain as the **originServerName** such as **auth.whitematter.tech**. You only would need to provide a singular subdomain regardless of how many subdomains you will be using with the tunnel.

Now, create the **docker-compose.yml**:
```
touch /docker-host/cloudflared-whitemattertech/docker-compose.yml
nano /docker-host/cloudflared-whitemattertech/docker-compose.yml
```
For convenience, I have commented out the other domains that you could add. If you are using more than one domain like mentioned above, you can uncomment those lines and add your paths as required.
```
version: "3"
services:
  cloudflared-whitematter:
    image: cloudflare/cloudflared:latest
    container_name: cloudflared-whitematter
    environment:
      - TZ=America/New_York
    volumes:
      - /docker-host/cloudflared-whitematter/:/home/nonroot/.cloudflared/
    restart: always
    command: tunnel run
    network_mode: "host"
#  cloudflared-domain1:
#    image: cloudflare/cloudflared:latest
#    container_name: cloudflared-domain1
#    environment:
#      - TZ=America/New_York
#    volumes:
#      - /docker-host/cloudflared-domain1/:/home/nonroot/.cloudflared/
#    restart: always
#    command: tunnel run
#    network_mode: "host"
#  cloudflared-domain2:
#    image: cloudflare/cloudflared:latest
#    container_name: cloudflared-domain2
#    environment:
#      - TZ=America/New_York
#    volumes:
#      - /docker-host/cloudflared-domain2/:/home/nonroot/.cloudflared/
#    restart: always
#    command: tunnel run
#    network_mode: "host"
#  cloudflared-domain3:
#    image: cloudflare/cloudflared:latest
#    container_name: cloudflared-domain3
#    environment:
#      - TZ=America/New_York
#    volumes:
#      - /docker-host/cloudflared-domain3/:/home/nonroot/.cloudflared/
#    restart: always
#    command: tunnel run
#    network_mode: "host"
```

Finally, run the following to start your container(s):
```
docker-compose up -d
```

# Cloudflare DNS Modifications

Replace any A record you might have with a CNAME record where the **Name** points to the domain root (@). For the content **Value**, you need to add TUNID.cfargotunnel.com (inserting your tunnel ID that was copied earlier).

For subdomains, create a CNAME record for each subdomain where **Name** is the subdomian value (e.g., **auth**, **plex**, **unraid**, etc.), and **Value** is "**@**". As an FYI, once you save your CNAME record for your subdomain, the "**@**" will change to the root domain name. See the image below:
![](/posts/cloudflare-tunneling/images/cloudflare-cname.png)

Once saved, your internal self-hosted apps should be accessible via your Cloudflare tunnel. You can safely remove your port forwards for ports 80 and 443 to your reverse proxy now. If you do a **dig** against your domain or a subdomain, you will also notice that your services are no longer pointing to your external IP, which provides enhanced privacy for your self-hosted apps or sites.

--------------------------------------------------------
# Wrapping Up

I hope this post was helpful to you in setting up your own Cloudflare tunnel.

> As always, if you have any questions, feel free to start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a GitHub PR](https://github.com/RobertDWhite/WhiteMatterTech/pulls) to recommend changes/fixes in the article, or reach out to me directly at [robert@whitematter.tech](mailto:robert@whitematter.tech).
>
> Thanks for reading!
>
> Robert

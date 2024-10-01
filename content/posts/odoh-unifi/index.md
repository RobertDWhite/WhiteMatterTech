---
title: "Host Your Own Free Wordpress Site with Traefik and Docker"
date: "2024-09-30"
categories:
  - "networking"
  - "tutorials"
  - "webhosting"
tags:
  - "docker"
  - "portainer"
  - "traefik"
  - "ubuntu"
  - "webhost"
  - "wordpress"
cover:
    image: "/posts/hosting-your-own-site-with-traefik-and-wordpress/header_hosting-your-own-site-with-traefik-and-wordpress_main.jpg"
    alt: "Docker, Wordpress, & Traefik"
    caption: "<text>"
    relative: true
aliases:
    - /posts/hosting-your-own-site-with-traefik-and-wordpress/hosting-your-own-site-with-traefik-and-wordpress/
    - /2021/hosting-your-own-site-with-traefik-and-wordpress/
---

> **Update 03/20/2022**:
> I no longer host my site with Traefik, and my site is no longer built on WordPress. I now host my site internally using an Nginx proxy hosted in Docker. My site is built with Hugo. Learn more about my transition from WordPress to Hugo on my post here: [Migrating from WordPress to Hugo](https://whitematter.tech/posts/migrating-from-wordpress-to-hugo/)

-----------------------------------------------------------------------------------------------------------------------

My first post will, appropriately, show you how to build your own self-hosted Wordpress site utilizing Docker (just like this site)! For this setup, I am using a Ubuntu bare-metal machine behind a _[Unifi Dream Machine Pro](https://www.amazon.com/gp/product/B086967C9X/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B086967C9X&linkCode=as2&tag=whitematter-20&linkId=4fc0624a437d4bfe761f2ebb02ca61bd)_ . You can use a VPS or an OS on bare-metal capable of running Docker _(for this tutorial though, we will use tools only applicable to Ubuntu, but you can make adjustments where necessary if you are familiar with Docker and choose not to use Ubuntu)._ Check out [this project's GitHub page](https://github.com/robertomano24/WhiteMatterWP) for examples and help.

_As an Amazon Associate, I earn from qualifying purchases._ Thank you for _supporting the maintenance of this blog. The pricing will be the same for you regardless if you use my links or not! Thanks for your support!_

This post assumes you have Ubuntu installed with access to a user with root privileges, Docker and Docker-Compose installed, a domain that you own (if you do not have one, I suggest purchasing through Google Domains or Hover), the ability to modify your domain's DNS records _(I recommend [CloudFlare](https://www.cloudflare.com/))_, and the ability to forward ports on your network (unless you are using a VPS or other externally hosted OS).

One reason I am using Ubuntu to host this Docker setup is because of the ability to use Ubuntu's environment file to store pertinent and sensitive variables securely. This allows me to easily share my docker-compose files without exposing my secrets in GitHub or elsewhere. There may be better alternatives to storing your variables with Docker's built-in secrets management, but this tutorial will not cover that. Finally, consider the security implications of hosting a website on your network. Check out [this post](https://whitematter.tech/2021/04/06/network-hardening-webhosting/ "https://whitematter.tech/2021/04/06/network-hardening-webhosting/") to get some ideas and walkthroughs of some easy things you can do to increase your network security for this endeavor. You might also consider checking out [this post](https://whitematter.tech/2021/run-a-reverse-proxy-using-docker/) about reverse proxies if you run more than one webserver you need externally accessible.

## Prepare Your Domain

For your domain, you will need to add DNS records pointing your domain, for example, whitematter.tech, to the public IP address of your server _(if you are using a bare-metal install on your home network, this would be the public IP your ISP provides you, which can be determined at [whatismyip.com](http://whatismyip.com))_. I personally prefer a Dynamic DNS solution like [duckdns.org](http://duckdns.org "duckdns.org"), which allows me to automatically keep updated with my changing public IP since I do not have a static address from my ISP _(for tips on exploring duckdns for your setup, check out [this video](https://www.youtube.com/watch?v=bVmUV1G5wpI) on YouTube)._ The image below shows what CloudFlare looks like for my domain being pointed to my duckdns address _(if you do not have duckdns, "Content" would be your public-facing IP, like 177.99.88.10)_.

![](/posts/hosting-your-own-site-with-traefik-and-wordpress/images/Screen-Shot-2021-04-01-at-8.15.44-PM.jpg)

## **Set Environment Variables**

On Ubuntu, open the Environment file by issuing the following command:

```
sudo nano /etc/environment
```

Copy and paste the following underneath the PATH in the file. **Replace the generic values in red below with your own**. **_DO NOT modify the PATH itself for your configuration (i.e., PATH="" should not be changed!)_**.

To find your time zone (TZ), see [this list](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones).

Replace “username” in the USERDIR with your Ubuntu username. _I strongly recommend using a password manager (I use [1Password](https://1password.com)) to generate and store passwords for MySQL and WP databases._

```
PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games"

TZ=America/New_York
USERDIR=/home/username/docker
MYSQL_ROOT_PASSWORD=dbrootpassword
DATABASE_NAME=dbname
DATABASE_USER=dbuser
DATABASE_PASSWORD=dbpassword
DOMAIN=yourdomain.com
```

Save the file by “Ctrl” + “o” and then “Enter”. Use “Ctrl” + “x” to exit the file after saving.

After saving, you will need to logout and log back in or by rebooting.

```
sudo reboot
```

## **Preparing Directories and Permissions**

Issue the following commands. You can copy and paste all at once or issue one at a time. _The ${USERDIR} will be pulled from the environment file we just set up._

```
sudo mkdir ${USERDIR}
sudo mkdir ${USERDIR}/apps
sudo mkdir ${USERDIR}/wordpress
sudo mkdir ${USERDIR}/wordpress/wp-data
sudo mkdir ${USERDIR}/data
sudo mkdir ${USERDIR}/data/configurations
sudo touch ${USERDIR}/data/acme.json
sudo chmod 600 ${USERDIR}/data/acme.json
```

## **Create Traefik static configuration file.**

Issue this command to create the Traefik static configuration file. ${USERDIR} will be pulled from the environment file.

```
sudo nano ${USERDIR}/data/traefik.yml
```

Copy the following into the file. _**Be sure to change the email address in red to your own email address**._

Note that there are two caServer addresses at the bottom of the file. The one with “staging” in the address is for testing. You may want to use this address until you get everything working. However, you will get security warnings from browsers while using the staging server certificates. The actual LetsEncrypt server will only allow you to get a few certificates over a time period before it locks you out. Put a “#” in front of the caServer address that you do not want to use. Ubuntu ignores lines with “#” in front of them.

```
api:
  dashboard: true

entryPoints:
  http:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: https
  https:
    address: ":443"
    http:
      middlewares:
        - secureHeaders@file
        - page-ratelimit@file
      tls:
        certResolver: letsencrypt

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
  file:
    filename: /configurations/dynamic.yml
certificatesResolvers:
  letsencrypt:
    acme:
      email: you@yourdomain.com
      storage: acme.json
      keyType: EC384
      httpChallenge:
        entryPoint: http
      #caServer: https://acme-staging-v02.api.letsencrypt.org/directory
      caServer: https://acme-v02.api.letsencrypt.org/directory
```

Once you have copied the text above into the file, save the file with “Ctrl” + “o” and then “Enter”. Exit the file with “Ctrl” + “x”.

## **Prepare Traefik and Create Traefik Dynamic Config**

The Traefik password must be hashed using MD5, SHA1, or BCrypt. I recommend using BCrypt since it is more secure.

You can use an online [Htpassword generator](https://hostingcanada.org/htpasswd-generator/) to hash your password. For example, if your username is “admin” and password is “password1234”, the BCrypt hashed version will look something like this: “admin:$2y$10$d0yk7WE.XqhF5bT1DdJhduRFOM5JSabTiSFCTnbC2.JgMolypHgS2”. _I strongly recommend using a password manager (I use _[1Password](https://1password.com/)_) to generate a high bit-count password to use in this step._

Once you have created your username, password, and hashed version of the password, continue to the next steps.

Issue this command to create the Traefik dynamic configuration file. _${USERDIR} will be pulled from the environment file._

```
sudo nano ${USERDIR}/data/configurations/dynamic.yml
```

Copy the following into the dynamic.yml file. **Update the username and password (in red) with the hashed values you just created above.**

Note that this file uses the page-ratelimit middleware. The values below allow 50 requests per second average with a burst of 50. You can change this if desired.

```
http:
  middlewares:
    secureHeaders:
      headers:
        frameDeny: true
        sslRedirect: true
        browserXssFilter: true
        contentTypeNosniff: true
        forceSTSHeader: true
        stsIncludeSubdomains: true
        stsPreload: true
        stsSeconds: 31536000
        customFrameOptionsValue: SAMEORIGIN
    user-auth:
      basicAuth:
        users:
          - "admin:$2y$10$d0yk7WE.XqhF5bT1DdJhduRFOM5JSabTiSFCTnbC2.JgMolypHgS2"
    page-ratelimit:
      rateLimit:
        average: 50
        burst: 50
tls:
  options:
    default:
      cipherSuites:
        - TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384
        - TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
        - TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256
        - TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
        - TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305
        - TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305
      minVersion: VersionTLS12
```

Once you have copied the text above into the file, save the file with “Ctrl” + “o” and then “Enter”. Exit the file with “Ctrl” + “x”.

## **Create the Traefik Docker-Compose File**

Issue this command to create the Traefik docker-compose file. _${USERDIR} will be pulled from the environment file._

```
sudo nano ${USERDIR}/docker-compose.yml
```

Copy the following into the file. _Note that fields with “${ }” will be pulled from the environment file._

This file will pull the latest version of traefik (currently v2.2.6). You could limit the image to the latest version in the 2.2.X series by using image tag “traefik:chevrotin”. Note that if you use the “latest” tag, and Treafik releases the next version (v3, etc), your current configuration may not work with the new version. I prefer to use the latest tag and fix the configuration as needed. See [dockerhub](https://hub.docker.com/_/traefik?tab=tags) for the release tags.

This file will route ports 80 (http) and 443 (https) to the Traefik container.

You can also find a copy of the [docker-compose.yml here on GitHub](https://github.com/RobertDWhite/WhiteMatterWP/blob/main/docker-compose.yml "docker-compose.yml here on GitHub").

```
version: '3.3'
services:
  traefik:
    image: traefik:latest
    container_name: traefik
    restart: always
    security_opt:
      - no-new-privileges:true
    ports:
      - 80:80
      - 443:443
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ${USERDIR}/data/traefik.yml:/traefik.yml:ro
      - ${USERDIR}/data/configurations:/configurations
      - ${USERDIR}/data/acme.json:/acme.json
    environment:
      TZ: ${TZ}
    networks:
      - proxy
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=proxy"
      - "traefik.http.routers.traefik-secure.entrypoints=https"
      - "traefik.http.routers.traefik-secure.rule=Host(`traefik.${DOMAIN}`)"
      - "traefik.http.routers.traefik-secure.service=api@internal"
      - "traefik.http.routers.traefik-secure.middlewares=user-auth@file"

networks:
  proxy:
    external: true
```

Once you have copied the text above into the file, save the file with “Ctrl” + “o” and then “Enter”. Exit the file with “Ctrl” + “x”.  

## **Create the WordPress Docker-Compose File**

Issue this command to create the WordPress docker-compose file. _${USERDIR} will be pulled from the environment file._

```
sudo nano ${USERDIR}/apps/docker-compose.yml
```

Copy the following into the file. _Note that fields with “${ }” will be pulled from the environment file._

You can also find a copy of the [docker-compose.yml on GitHub](https://github.com/RobertDWhite/WhiteMatterWP/blob/main/apps/docker-compose.yml "docker-compose.yml on GitHub"):

```
version: '3.7'
services:
  db:
    image: mariadb:latest
    container_name: wp-db
    volumes:
      - db-data:/var/lib/mysql
    networks:
      - default
    security_opt:
      - no-new-privileges:true
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DATABASE_NAME}
      MYSQL_USER: ${DATABASE_USER}
      MYSQL_PASSWORD: ${DATABASE_PASSWORD}
      TZ: ${TZ}

  wordpress:
    depends_on:
      - db
    image: wordpress:latest
    container_name: wordpress
    environment:
      WORDPRESS_DB_HOST: db:3306
      WORDPRESS_DB_NAME: ${DATABASE_NAME}
      WORDPRESS_DB_USER: ${DATABASE_USER}
      WORDPRESS_DB_PASSWORD: ${DATABASE_PASSWORD}
      TZ: ${TZ}
    volumes:
      - ${USERDIR}/wordpress/wp-data:/var/www/html
    networks:
      - proxy
      - default
    security_opt:
      - no-new-privileges:true
    restart: unless-stopped
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=proxy"
      - "traefik.http.routers.wordpress-secure.entrypoints=https"
      - "traefik.http.routers.wordpress-secure.rule=Host(`${DOMAIN}`)"

  portainer:
    container_name: portainer
    image: portainer/portainer:latest
    restart: unless-stopped
    command: -H unix:///var/run/docker.sock
    networks:
      - proxy
      - default
    security_opt:
      - no-new-privileges:true
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      TZ: ${TZ}
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=proxy"
      - "traefik.http.routers.portainer-secure.entrypoints=https"
      - "traefik.http.routers.portainer-secure.rule=Host(`portainer.${DOMAIN}`)"

volumes:
  db-data:

networks:
  proxy:
    external: true
```

## **Create the Proxy Network and Start Traefik**

Now that the files are created, you are ready to create the proxy network and start Traefik.

Issue this command to create the proxy network:

```
docker network create proxy
```

Issue this command to start the Traefik container. _${USERDIR} will be pulled from the environment file._

```
docker-compose -f ${USERDIR}/docker-compose.yml up -d
```

Once that is complete, wait a few minutes and attempt to access the Traefik web admin page. You should be able to reach it at https://traefik.yourdomain.com. Replace “yourdomain.com” with your actual domain matching the domain you added to the environment file. If it works, use the **_non-hashed username and password_**. You should see this:

![](/posts/hosting-your-own-site-with-traefik-and-wordpress/images/traefik-dashboard-1024x683.png)

If you are unable to access this page, you will likely need to forward ports 80 and 443 to your Ubuntu server _(see the below screenshot for an example of the ports forwarded to Ubuntu(10.100.0.15), and also see this post for recommendations on how to secure your network)_. If you are using a VPS or other externally hosted option, this will not be necessary. Once your ports are forwarded, you should be ready to continue.

![](/posts/hosting-your-own-site-with-traefik-and-wordpress/images/Screen-Shot-2021-04-01-at-8.38.18-PM-1024x64.png)

## **Start the Remaining Containers**

**Warning – It is important that you login to WordPress and Portainer after you start them so that you can set passwords. If you do not, anyone could have access to them!**

Issue this command to start the remaining containers. _${USERDIR}_ will be pulled from the environment file.

```
docker-compose -f ${USERDIR}/apps/docker-compose.yml up -d
```

Give it a few minutes and attempt to access WordPress and Portainer from a browser.

> **WordPress:**

You should be able to access WordPress at “https://yourdomain.com“. Replace “yourdomain.com” with your domain.

If successful, you should see the initial WordPress screen where you **create your WordPress user and password**. Use a really strong password for WordPress _(again, I recommend using a password manager like _[1Password](https://1password.com/)_)._

![](/posts/hosting-your-own-site-with-traefik-and-wordpress/images/wordpress-initial.png)

![](/posts/hosting-your-own-site-with-traefik-and-wordpress/images/wordpress-initial-install.png)

If the WordPress installation was successful, you should see a message declaring success.

> **Portainer:**

You should be able to access Portainer at “https://portainer.yourdomain.com“. Replace “yourdomain.com” with your domain created in section 1.

If successful, you should see the initial Portainer screen where you **create your Portainer user and password**. Use a **_really strong_** password for Portainer _(again, I recommend using a password manager like _[1Password](https://1password.com/)_)._

![](/posts/images/portainer-initial.png)

After you create your Portainer password, login to Portainer, and click “containers” on the left side of the page. You will see a list of your running containers. You can stop, start, restart, remove, etc. installed containers.

![](/posts/hosting-your-own-site-with-traefik-and-wordpress/images/portainer-container-list-1024x515.png)

## **Getting Started with WordPress**

A solid recommended thing to do with a new WordPress site is increase the php memory limit and max file upload size. One way to do this is to modify the .htaccess file. To change this file, do the following in terminal. _${USERDIR} will be pulled from the environment file. The file path below assumes you specified the WordPress volume as shown in the docker-compose file._

```
sudo nano ${USERDIR}/wordpress/wp-data/.htaccess
```

Add these lines to the file:

```
php_value memory_limit 256M
php_value upload_max_filesize 128M
php_value post_max_size 128M
php_value max_execution_time 300
php_value max_input_time 1000
```

![](/posts/hosting-your-own-site-with-traefik-and-wordpress/images/increase-file-upload-size-1.png)

Once you have copied the text above into the file, save the file with “Ctrl” + “o” and then “Enter”. Exit the file with “Ctrl” + “x”.

Restart the WordPress container for changes to take effect. You can restart it from Portainer or restart all containers with this command:

```
docker restart $(docker ps -q)
```

> **WordPress Admin Page:**

To reach your WordPress admin page, open a browser and navigate to “https://yourdomain.com/wp-admin” (replace “yourdomain.com” with your actual domain). Log in using the credentials you created in Section 14.

> **Change the WordPress Theme:**

You can change the theme of your blog or website if you want.

After clicking “Add New Theme”, search your favorite theme and put your mouse over it and click “Install”. After it installs, click “Activate”.

> **Create a Blog Post:**

To add a blog post, click “Posts” and then “Add New”. A new, blank blog post will be created. I like using the default block editor that comes with WordPress. You can add page builder plugins if you want. This is what the default block editor looks like:

![](/posts/hosting-your-own-site-with-traefik-and-wordpress/images/blogpost-1024x665.png)

After creating your post using the block editor, click “Publish” and then “Publish” again to make the post available. Navigate to the address shown on the “Post address”. Your blog post will look something like this. You can customize your site by changing settings or adding plug-ins.


> As always, if you have any questions, feel free to start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a GitHub](https://github.com/RobertDWhite/WhiteMatterTech/pulls) PR to recommend changes/fixes in the article, or reach out to me directly at [robert@whitematter.tech](mailto:robert@whitematter.tech).
>
> Thanks for reading!
>
> Robert

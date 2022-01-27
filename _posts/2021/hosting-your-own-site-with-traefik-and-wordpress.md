---
ID: 42
post_title: >
  Host Your Own Free WordPress Site with
  Traefik and Docker
post_name: >
  hosting-your-own-site-with-traefik-and-wordpress
author: Robert White
post_date: 2021-04-01 21:07:20
layout: post
link: >
  https://whitematter.tech/2021/hosting-your-own-site-with-traefik-and-wordpress/
published: true
tags:
  - docker
  - portainer
  - traefik
  - ubuntu
  - webhost
  - wordpress
categories:
  - Networking
  - Tutorials
  - WebHosting
---
<!-- wp:paragraph {"dropCap":true} -->
<p class="has-drop-cap">My first post will, appropriately, show you how to build your own self-hosted Wordpress site utilizing Docker (just like this site)! For this setup, I am using a Ubuntu bare-metal machine behind a <em><a href="https://www.amazon.com/gp/product/B086967C9X/ref=as_li_tl?ie=UTF8&amp;camp=1789&amp;creative=9325&amp;creativeASIN=B086967C9X&amp;linkCode=as2&amp;tag=whitematter-20&amp;linkId=4fc0624a437d4bfe761f2ebb02ca61bd" target="_blank" rel="noreferrer noopener">Unifi Dream Machine Pro</a>&nbsp;</em>. You can use a VPS or an OS on bare-metal capable of running Docker <em>(for this tutorial though, we will use tools only applicable to Ubuntu, but you can make adjustments where necessary if you are familiar with Docker and choose not to use Ubuntu).</em> Check out <a href="https://github.com/robertomano24/WhiteMatterWP" target="_blank" rel="noreferrer noopener">this project's GitHub page</a> for examples and help.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><meta charset="utf-8"><em>As an Amazon Associate, I earn from qualifying purchases.</em> Thank you for<em> supporting the maintenance of this blog. The pricing will be the same for you regardless if you use my links or not! Thanks for your support!</em> </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This post assumes you have Ubuntu installed with access to a user with root privileges, Docker and Docker-Compose installed, a domain that you own (if you do not have one, I suggest purchasing through Google Domains or Hover), the ability to modify your domain's DNS records <em>(I recommend <a href="https://www.cloudflare.com/" target="_blank" rel="noreferrer noopener">CloudFlare</a>)</em>, and the ability to forward ports on your network (unless you are using a VPS or other externally hosted OS). </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>One reason I am using Ubuntu to host this Docker setup is because of the ability to use Ubuntu's environment file to store pertinent and sensitive variables securely. This allows me to easily share my docker-compose files without exposing my secrets in GitHub or elsewhere. There may be better alternatives to storing your variables with Docker's built-in secrets management, but this tutorial will not cover that. Finally, consider the security implications of hosting a website on your network. Check out <a href="https://whitematter.tech/2021/04/06/network-hardening-webhosting/" title="https://whitematter.tech/2021/04/06/network-hardening-webhosting/" target="_blank" rel="noreferrer noopener">this post</a> to get some ideas and walkthroughs of some easy things you can do to increase your network security for this endeavor. You might also consider checking out <a href="https://whitematter.tech/2021/run-a-reverse-proxy-using-docker/" target="_blank" rel="noreferrer noopener">this post</a> about reverse proxies if you run more than one webserver you need externally accessible.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Prepare Your Domain</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>For your domain, you will need to add DNS records pointing your domain, for example, whitematter.tech, to the public IP address of your server <em>(if you are using a bare-metal install on your home network, this would be the public IP your ISP provides you, which can be determined at <a href="http://whatismyip.com" target="_blank" rel="noreferrer noopener">whatismyip.com</a>)</em>. I personally prefer a Dynamic DNS solution like<a href="http://duckdns.org" target="_blank" rel="noreferrer noopener" title="duckdns.org"> duckdns.org</a>, which allows me to automatically keep updated with my changing public IP since I do not have a static address from my ISP <em>(for tips on exploring duckdns for your setup, check out <a href="https://www.youtube.com/watch?v=bVmUV1G5wpI" target="_blank" rel="noreferrer noopener">this video</a> on YouTube).</em> The image below shows what CloudFlare looks like for my domain being pointed to my duckdns address <em>(if you do not have duckdns, "Content" would be your public-facing IP, like 177.99.88.10)</em>.</p>
<!-- /wp:paragraph -->

<!-- wp:image -->
<figure class="wp-block-image"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-01-at-8.15.44-PM-1024x121.png" alt="This image has an empty alt attribute; its file name is Screen-Shot-2021-04-01-at-8.15.44-PM-1024x121.png"/></figure>
<!-- /wp:image -->

<!-- wp:heading -->
<h2><strong>Set Environment Variables</strong></h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>On Ubuntu, open the Environment file by issuing the following command:</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>sudo nano /etc/environment</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>Copy and paste the following underneath the PATH in the file.&nbsp;<strong>Replace the generic values in red below with your own</strong>. <strong><em>DO NOT modify the PATH itself for your configuration (i.e., PATH="" should not be changed!)</em></strong>.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>To find your time zone (TZ), see&nbsp;<a href="https://en.wikipedia.org/wiki/List_of_tz_database_time_zones" target="_blank" rel="noreferrer noopener">this list</a>.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Replace “<span class="has-inline-color has-vivid-red-color">username</span>” in the USERDIR with your Ubuntu username. <em>I strongly recommend using a password manager (I use <a href="https://1password.com" target="_blank" rel="noreferrer noopener">1Password</a>) to generate and store passwords for MySQL and WP databases.</em></p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games"

TZ=America/<span class="has-inline-color has-vivid-red-color">New_York</span>
USERDIR=/home/<span class="has-inline-color has-vivid-red-color">username</span>/docker
MYSQL_ROOT_PASSWORD=<span class="has-inline-color has-vivid-red-color">dbrootpassword</span>
DATABASE_NAME=<span class="has-inline-color has-vivid-red-color">dbname</span>
DATABASE_USER=<span class="has-inline-color has-vivid-red-color">dbuser</span>
DATABASE_PASSWORD=<span class="has-inline-color has-vivid-red-color">dbpassword</span>
DOMAIN=<span class="has-inline-color has-vivid-red-color">yourdomain.com</span></code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>Save the file by “Ctrl” + “o” and then “Enter”. Use “Ctrl” + “x” to exit the file after saving.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>After saving, you will need to logout and log back in or by rebooting.</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>sudo reboot</code></pre>
<!-- /wp:code -->

<!-- wp:heading -->
<h2><strong>Preparing Directories and Permissions</strong></h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Issue the following commands. You can copy and paste all at once or issue one at a time. <em>The ${USERDIR} will be pulled from the environment file we just set up.</em></p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>sudo mkdir ${USERDIR}
sudo mkdir ${USERDIR}/apps
sudo mkdir ${USERDIR}/wordpress
sudo mkdir ${USERDIR}/wordpress/wp-data
sudo mkdir ${USERDIR}/data
sudo mkdir ${USERDIR}/data/configurations
sudo touch ${USERDIR}/data/acme.json
sudo chmod 600 ${USERDIR}/data/acme.json</code></pre>
<!-- /wp:code -->

<!-- wp:heading -->
<h2><strong>Create Traefik static configuration file.</strong></h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Issue this command to create the Traefik static configuration file. ${USERDIR} will be pulled from the environment file.</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>sudo nano ${USERDIR}/data/traefik.yml</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>Copy the following into the file.&nbsp;<em><strong>Be sure to change the email address in red to your own email address</strong>.</em></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Note that there are two caServer addresses at the bottom of the file. The one with “staging” in the address is for testing. You may want to use this address until you get everything working. However, you will get security warnings from browsers while using the staging server certificates. The actual LetsEncrypt server will only allow you to get a few certificates over a time period before it locks you out. Put a “#” in front of the caServer address that you do not want to use. Ubuntu ignores lines with “#” in front of them.</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>api:
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
      email: <span class="has-inline-color has-vivid-red-color">you@yourdomain.com</span>
      storage: acme.json
      keyType: EC384
      httpChallenge:
        entryPoint: http
      #caServer: https://acme-staging-v02.api.letsencrypt.org/directory
      caServer: https://acme-v02.api.letsencrypt.org/directory</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>Once you have copied the text above into the file, save the file with “Ctrl” + “o” and then “Enter”. Exit the file with “Ctrl” + “x”.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2><strong>Prepare Traefik and Create Traefik Dynamic Config</strong></h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Traefik password must be hashed using MD5, SHA1, or BCrypt. I recommend using BCrypt since it is more secure.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>You can use an online&nbsp;<a rel="noreferrer noopener" href="https://hostingcanada.org/htpasswd-generator/" target="_blank">Htpassword generator</a>&nbsp;to hash your password. For example, if your username is “admin” and password is “password1234”, the BCrypt hashed version will look something like this: “admin:$2y$10$d0yk7WE.XqhF5bT1DdJhduRFOM5JSabTiSFCTnbC2.JgMolypHgS2”. <em>I strongly recommend using a password manager (I use <em><a href="https://1password.com/" target="_blank" rel="noreferrer noopener">1Password</a></em>) to generate a high bit-count password to use in this step. </em></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Once you have created your username, password, and hashed version of the password, continue to the next steps.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Issue this command to create the Traefik dynamic configuration file. <em>${USERDIR} will be pulled from the environment file.</em></p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>sudo nano ${USERDIR}/data/configurations/dynamic.yml</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>Copy the following into the dynamic.yml file.&nbsp;<strong>Update the username and password (in red) with the hashed values you just created above.</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Note that this file uses the page-ratelimit middleware. The values below allow 50 requests per second average with a burst of 50. You can change this if desired.</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>http:
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
          - "<span class="has-inline-color has-vivid-red-color">admin:$2y$10$d0yk7WE.XqhF5bT1DdJhduRFOM5JSabTiSFCTnbC2.JgMolypHgS2</span>"
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
      minVersion: VersionTLS12</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>Once you have copied the text above into the file, save the file with “Ctrl” + “o” and then “Enter”. Exit the file with “Ctrl” + “x”.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2><strong>Create the Traefik Docker-Compose File</strong></h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Issue this command to create the Traefik docker-compose file. <em>${USERDIR} will be pulled from the environment file.</em></p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>sudo nano ${USERDIR}/docker-compose.yml</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>Copy the following into the file. <em>Note that fields with “${ }” will be pulled from the environment file.</em></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This file will pull the latest version of traefik (currently v2.2.6). You could limit the image to the latest version in the 2.2.X series by using image tag “traefik:chevrotin”. Note that if you use the “latest” tag, and Treafik releases the next version (v3, etc), your current configuration may not work with the new version. I prefer to use the latest tag and fix the configuration as needed. See&nbsp;<a href="https://hub.docker.com/_/traefik?tab=tags" target="_blank" rel="noreferrer noopener">dockerhub</a>&nbsp;for the release tags.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This file will route ports 80 (http) and 443 (https) to the Traefik container. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>You can also find a copy of the <a href="https://github.com/RobertDWhite/WhiteMatterWP/blob/main/docker-compose.yml" target="_blank" rel="noreferrer noopener" title="docker-compose.yml here on GitHub">docker-compose.yml here on GitHub</a>.</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>version: '3.3'
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
    external: true</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>Once you have copied the text above into the file, save the file with “Ctrl” + “o” and then “Enter”. Exit the file with “Ctrl” + “x”.<br></p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2><strong>Create the WordPress Docker-Compose File</strong> </h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Issue this command to create the WordPress docker-compose file. <em>${USERDIR} will be pulled from the environment file.</em></p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>sudo nano ${USERDIR}/apps/docker-compose.yml</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>Copy the following into the file. <em>Note that fields with “${ }” will be pulled from the environment file.</em></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>You can also find a copy of the <a href="https://github.com/RobertDWhite/WhiteMatterWP/blob/main/apps/docker-compose.yml" target="_blank" rel="noreferrer noopener" title="docker-compose.yml on GitHub">docker-compose.yml on GitHub</a>:</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>version: '3.7'
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
    external: true</code></pre>
<!-- /wp:code -->

<!-- wp:heading -->
<h2><strong>Create the Proxy Network and Start Traefik</strong></h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Now that the files are created, you are ready to create the proxy network and start Traefik.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Issue this command to create the proxy network:</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>docker network create proxy</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>Issue this command to start the Traefik container. <em>${USERDIR} will be pulled from the environment file.</em></p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>docker-compose -f ${USERDIR}/docker-compose.yml up -d</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>Once that is complete, wait a few minutes and attempt to access the Traefik web admin page. You should be able to reach it at https://traefik.<span class="has-inline-color has-vivid-red-color">yourdomain.com</span>. Replace “yourdomain.com” with your actual domain matching the domain you added to the environment file. If it works, use the <strong><em>non-hashed username and password</em></strong>. You should see this:</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":296} -->
<figure class="wp-block-image"><img src="https://lukesblogsite.com/wp-content/uploads/2020/07/traefik-dashboard-1024x683.png" alt="" class="wp-image-296"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>If you are unable to access this page, you will likely need to forward ports 80 and 443 to your Ubuntu server <em>(see the below screenshot for an example of the ports forwarded to Ubuntu(10.100.0.15), and also see this post for recommendations on how to secure your network)</em>. If you are using a VPS or other externally hosted option, this will not be necessary. Once your ports are forwarded, you should be ready to continue. </p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":57,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/04/Screen-Shot-2021-04-01-at-8.38.18-PM-1024x64.png" alt="" class="wp-image-57"/></figure>
<!-- /wp:image -->

<!-- wp:heading -->
<h2><strong>Start the Remaining Containers</strong></h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><strong><span class="has-inline-color has-luminous-vivid-orange-color">Warning&nbsp;</span>– It is important that you login to WordPress and Portainer after you start them so that you can set passwords. If you do not, anyone could have access to them!</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Issue this command to start the remaining containers. <em>${USERDIR}</em> will be pulled from the environment file.</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>docker-compose -f ${USERDIR}/apps/docker-compose.yml up -d</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>Give it a few minutes and attempt to access WordPress and Portainer from a browser.</p>
<!-- /wp:paragraph -->

<!-- wp:quote -->
<blockquote class="wp-block-quote"><p><strong>WordPress:</strong></p></blockquote>
<!-- /wp:quote -->

<!-- wp:paragraph -->
<p>You should be able to access WordPress at “https://<span class="has-inline-color has-vivid-red-color">yourdomain.com</span>“. Replace “yourdomain.com” with your domain.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If successful, you should see the initial WordPress screen where you&nbsp;<strong>create your WordPress user and password</strong>. Use a really strong password for WordPress <em>(again, I recommend using a password manager like <em><a href="https://1password.com/" target="_blank" rel="noreferrer noopener">1Password</a></em>).</em></p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":313} -->
<figure class="wp-block-image"><img src="https://lukesblogsite.com/wp-content/uploads/2020/07/wordpress-initial.png" alt="" class="wp-image-313"/></figure>
<!-- /wp:image -->

<!-- wp:image {"id":315} -->
<figure class="wp-block-image"><img src="https://lukesblogsite.com/wp-content/uploads/2020/07/wordpress-initial-install.png" alt="" class="wp-image-315"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>If the WordPress installation was successful, you should see a message declaring success.</p>
<!-- /wp:paragraph -->

<!-- wp:quote -->
<blockquote class="wp-block-quote"><p><strong>Portainer:</strong></p></blockquote>
<!-- /wp:quote -->

<!-- wp:paragraph -->
<p>You should be able to access Portainer at “<span class="has-inline-color has-black-color">https://portainer.</span><span class="has-inline-color has-vivid-red-color">yourdomain.com</span>“. Replace “yourdomain.com” with your domain created in section 1.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If successful, you should see the initial Portainer screen where you&nbsp;<strong>create your Portainer user and password</strong>. Use a <strong><em>really strong</em></strong> password for Portainer <em>(again, I recommend using a password manager like <em><a href="https://1password.com/" target="_blank" rel="noreferrer noopener">1Password</a></em>).</em></p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":320} -->
<figure class="wp-block-image"><img src="https://lukesblogsite.com/wp-content/uploads/2020/07/portainer-initial.png" alt="" class="wp-image-320"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>After you create your Portainer password, login to Portainer, and click “containers” on the left side of the page. You will see a list of your running containers. You can stop, start, restart, remove, etc. installed containers. </p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":322} -->
<figure class="wp-block-image"><img src="https://lukesblogsite.com/wp-content/uploads/2020/07/portainer-container-list-1024x515.png" alt="" class="wp-image-322"/></figure>
<!-- /wp:image -->

<!-- wp:heading -->
<h2><strong>Getting Started with WordPress</strong></h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>A solid recommended thing to do with a new WordPress site is increase the php memory limit and max file upload size. One way to do this is to modify the .htaccess file. To change this file, do the following in terminal. <em>${USERDIR} will be pulled from the environment file. The file path below assumes you specified the WordPress volume as shown in the docker-compose file.</em></p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>sudo nano ${USERDIR}/wordpress/wp-data/.htaccess</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>Add these lines to the file:</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>php_value memory_limit 256M
php_value upload_max_filesize 128M
php_value post_max_size 128M
php_value max_execution_time 300
php_value max_input_time 1000</code></pre>
<!-- /wp:code -->

<!-- wp:image {"id":362} -->
<figure class="wp-block-image"><img src="https://lukesblogsite.com/wp-content/uploads/2020/07/increase-file-upload-size-1.png" alt="" class="wp-image-362"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>Once you have copied the text above into the file, save the file with “Ctrl” + “o” and then “Enter”. Exit the file with “Ctrl” + “x”.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Restart the WordPress container for changes to take effect. You can restart it from Portainer or restart all containers with this command:</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>docker restart $(docker ps -q)</code></pre>
<!-- /wp:code -->

<!-- wp:quote -->
<blockquote class="wp-block-quote"><p><strong>WordPress Admin Page:</strong></p></blockquote>
<!-- /wp:quote -->

<!-- wp:paragraph -->
<p>To reach your WordPress admin page, open a browser and navigate to “https://<span class="has-inline-color has-vivid-red-color">yourdomain.com</span>/wp-admin” (replace “yourdomain.com” with your actual domain). Log in using the credentials you created in Section 14.</p>
<!-- /wp:paragraph -->

<!-- wp:quote -->
<blockquote class="wp-block-quote"><p><strong>Change the WordPress Theme:</strong></p></blockquote>
<!-- /wp:quote -->

<!-- wp:paragraph -->
<p>You can change the theme of your blog or website if you want.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>After clicking “Add New Theme”, search your favorite theme and put your mouse over it and click “Install”. After it installs, click “Activate”.</p>
<!-- /wp:paragraph -->

<!-- wp:quote -->
<blockquote class="wp-block-quote"><p><strong>Create a Blog Post:</strong></p></blockquote>
<!-- /wp:quote -->

<!-- wp:paragraph -->
<p>To add a blog post, click “Posts” and then “Add New”. A new, blank blog post will be created. I like using the default block editor that comes with WordPress. You can add page builder plugins if you want. This is what the default block editor looks like:</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":329} -->
<figure class="wp-block-image"><img src="https://lukesblogsite.com/wp-content/uploads/2020/07/blogpost-1024x665.png" alt="" class="wp-image-329"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>After creating your post using the block editor, click “Publish” and then “Publish” again to make the post available. Navigate to the address shown on the “Post address”. Your blog post will look something like this. You can customize your site by changing settings or adding plug-ins.</p>
<!-- /wp:paragraph -->
---
ID: 209
post_title: >
  How to Easily Run A Reverse Proxy using
  Docker
post_name: run-a-reverse-proxy-using-docker
author: Robert White
post_date: 2021-08-17 00:09:31
post_excerpt: >
  In this post, I will show you how to
  easily setup a reverse proxy using
  Docker.
layout: post
link: >
  https://whitematter.tech/2021/run-a-reverse-proxy-using-docker/
published: true
tags:
  - docker
  - network
  - unifi
  - webhost
  - wordpress
categories:
  - Networking
  - Tutorials
  - WebHosting
---
<!-- wp:paragraph {"dropCap":true} -->
<p class="has-drop-cap">Reverse proxies are powerful tools used typically to forward client traffic to a server. In contrast to a forward proxy, a reverse proxy sits in front of web servers or other servers and forwards client traffic to the appropriate server. In this post, I will show you how to easily setup a reverse proxy using Docker, forward the necessary ports to the reverse proxy, and configure the reverse proxy to forward traffic to various servers on your network. Specifically, I will show how to setup the reverse proxy for se with WordPress, though the applications of this reverse proxy are endless!</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>For this tutorial, we will be setting up Nginx Reverse Proxy with Nginx Proxy Manager, which acts as a GUI frontend to manage your reverse proxy. Managing Nginx without a GUI is definitely doable, but I am not much of a fan of troubleshooting that setup. For this setup, I recommend a singular device or VM that can host your reverse proxy. You will need docker-compose installed on your system. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>For this setup, I am using a Ubuntu bare-metal machine behind a <em><a href="https://www.amazon.com/gp/product/B086967C9X/ref=as_li_tl?ie=UTF8&amp;camp=1789&amp;creative=9325&amp;creativeASIN=B086967C9X&amp;linkCode=as2&amp;tag=whitematter-20&amp;linkId=4fc0624a437d4bfe761f2ebb02ca61bd" rel="noreferrer noopener" target="_blank"><u>Unifi Dream Machine Pro</u></a> </em>. You can use a VM or an OS on bare-metal capable of running Docker <em>(for this tutorial though, we will use commands and terminology only applicable to Ubuntu, but you can make adjustments where necessary if you are familiar with Docker and choose not to use Ubuntu).</em></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>For tips on running a self-hosted WordPress site, which will be referenced in this post, check out <a href="https://whitematter.tech/2021/hosting-your-own-site-with-traefik-and-wordpress/" target="_blank" rel="noreferrer noopener">this tutorial</a>. You could run your WordPress site from the same machine/VM running your reverse proxy, but you will likely have to edit some docker-compose files. I may follow up with a post about that later, but until then, I suggest separate devices/VMs.</p>
<!-- /wp:paragraph -->

<!-- wp:pullquote -->
<figure class="wp-block-pullquote"><blockquote><p>Installing Nginx Proxy Manager</p></blockquote></figure>
<!-- /wp:pullquote -->

<!-- wp:paragraph -->
<p>To simplify your install, I have hosted the <a href="https://github.com/robertomano24/nginx-proxy-manager/blob/main/docker-compose.yml">docker-compose.yml</a> I use to deploy my Nginx Proxy Manager: <a href="https://github.com/robertomano24/nginx-proxy-manager" target="_blank" rel="noreferrer noopener">GitHub</a>. You can easily pull this <a href="https://github.com/robertomano24/nginx-proxy-manager/blob/main/docker-compose.yml">docker-compose.yml</a> with cURL or wget by running the commands below:</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><code>curl -LJO&nbsp;<a href="https://raw.githubusercontent.com/robertomano24/nginx-proxy-manager/main/docker-compose.yml">https://raw.githubusercontent.com/robertomano24/nginx-proxy-manager/main/docker-compose.yml</a></code></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>OR</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><code>wget --no-check-certificate --content-disposition&nbsp;<a href="https://raw.githubusercontent.com/robertomano24/nginx-proxy-manager/main/docker-compose.yml">https://raw.githubusercontent.com/robertomano24/nginx-proxy-manager/main/docker-compose.yml</a></code></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If you prefer to create your <a href="https://github.com/robertomano24/nginx-proxy-manager/blob/main/docker-compose.yml">docker-compose.yml</a> file yourself, make a file named "<a href="https://github.com/robertomano24/nginx-proxy-manager/blob/main/docker-compose.yml">docker-compose.yml</a>" and add the following to the file: </p>
<!-- /wp:paragraph -->

<!-- wp:preformatted -->
<pre class="wp-block-preformatted">version: '3'
services:
  app:
    image: 'jc21/nginx-proxy-manager:latest'
<code>    restart: unless-stopped
    ports:
      - '80:80'
      - '81:81'
      - '443:443'
    environment:
      DB_MYSQL_HOST: "db"
      DB_MYSQL_PORT: 3306
      DB_MYSQL_USER: "npm"
      DB_MYSQL_PASSWORD: "npm"
      DB_MYSQL_NAME: "npm"
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
  db:
    image: 'jc21/mariadb-aria:latest'
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: 'npm'
      MYSQL_DATABASE: 'npm'
      MYSQL_USER: 'npm'
      MYSQL_PASSWORD: 'npm'
    volumes:
      - ./data/mysql:/var/lib/mysql</code>
</pre>
<!-- /wp:preformatted -->

<!-- wp:paragraph -->
<p>Once you have either downloaded the file or created your own, build your containers by issuing the following command: </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><code>docker-compose up -d</code></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If all goes well, you should now have Nginx Proxy Manager and MariaDB (for the reverse proxy database) running successfully.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->

<!-- wp:pullquote -->
<figure class="wp-block-pullquote"><blockquote><p>Configuring Nginx Proxy Manager</p></blockquote></figure>
<!-- /wp:pullquote -->

<!-- wp:paragraph -->
<p>Access your reverse proxy frontend by going to http://youripaddress:81 (e.g., http://192.168.1.10:81). Login with the default user email and password shown below. Immediately change the login email and password for your admin user to secure your reverse proxy. </p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>Email:    admin@example.com
Password: changeme</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>Once your password is changed, you can begin configuration. For an example, I will show you how I am configuring the reverse proxy for this WordPress site. You can fill in your own server information. This particular configuration assumes that you have forwarded your domain name (e.g., whitematter.tech) to your public IP. If you do not have a static public IP address, you might consider a free dynamic DNS service like DuckDNS, which will automatically update the DNS records to point to your IP address if your public IP is changed by your ISP. I have whitematter.tech pointing to a DuckDNS hostname. </p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Forward Ports 443 and 80</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The first step is to forward ports 80 and 443 to your reverse proxy host (e.g., 192.168.1.10). I use <em>a <a href="https://www.amazon.com/gp/product/B086967C9X/ref=as_li_tl?ie=UTF8&amp;camp=1789&amp;creative=9325&amp;creativeASIN=B086967C9X&amp;linkCode=as2&amp;tag=whitematter-20&amp;linkId=4fc0624a437d4bfe761f2ebb02ca61bd" target="_blank" rel="noreferrer noopener">Unifi Dream Machine Pro</a></em>&nbsp;<em>(UDMP)</em> as my gateway, so the screenshots will reflect the Unifi Controller. For Unifi users, go to <em><strong>Settings &gt; Routing &amp; Firewall &gt; Port Forwarding</strong></em>. Create a new rule and name it something descriptive (I named mine NGINGX_443). Check to enable the forward, check the <em>WAN interface</em>, and check <em>"Anywhere."</em> In both the <em>Port</em> and the <em>Forward Port</em>, enter "443." Add your reverse proxy host local IP in the <em>Forward IP</em> spot (e.g., <meta charset="utf-8">192.168.1.10). Save the rule, and create another rule with the same info, but replace "443" with "80." Be sure to save this rule too! You should then have two rules: NGINX_443 and NGINX_80. This will forward all incoming Internet traffic using ports 443 (HTTPS) and 80 (HTTP) to your reverse proxy server. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><img class="wp-image-211" style="width: 1000px;" src="https://whitematter.tech/wp-content/uploads/2021/08/Screen-Shot-2021-08-16-at-11.15.04-PM.png" alt=""></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Configure a Proxy Host</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Go back to your Nginx Proxy Server at http://youripaddress:81. Select <strong><em>Hosts &gt; Proxy Hosts</em></strong>. Near the top right, select<em> Add Proxy Host</em>. From here, we can add our first proxy host! Under the <em>Details</em> section, fill in the info similarly to the screenshot below. Under <em>Domain Names</em>, enter the URL and subdomains of the traffic that you want forwarded to your server. For example, if you have a webserver like I do hosting a WordPress site, you could inout your domain whitematter.tech and www.whitematter.tech. If you were hosting a Docker container elsewhere on your network, you might have something like homeassistant.whitematter.tech or something. This will certainly vary on your use-case. Feel free to reach out if you have more questions or need assistance with this piece! Under <em>Scheme,</em> I recommend <em><strong>https</strong></em>, but this also may vary. For a WordPress site, definitely select <strong><em>https</em></strong>. Under the <em>Forward Hostname / IP, </em>input your server IP as shown below. For the forward port, you will use the port required for traffic flow. If using a WordPress site, you will use 443. If using a Docker container like HomeAssistant, you would use something like 8123. Finally, check <em>Cache Assets, Block Common Exploits, </em>and<em> Websockets Support.</em> </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><img class="wp-image-212" style="width: 500px;" src="https://whitematter.tech/wp-content/uploads/2021/08/Screen-Shot-2021-08-16-at-11.10.29-PM.png" alt=""></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Next, select <em><strong>Custom locations </strong></em>and click <em>Add location. </em>If forwarding to a WordPress server, type "<strong>/wp-admin</strong>" as the location. The scheme should match the previous page, which is <em>https</em> i<meta charset="utf-8">n this case. Again, add your server IP and forward port like the previous page as well. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><img class="wp-image-213" style="width: 500px;" src="https://whitematter.tech/wp-content/uploads/2021/08/Screen-Shot-2021-08-16-at-11.10.35-PM.png" alt=""></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Finally, under <strong><em>SSL, </em></strong>you can easily configure a LetsEncrypt certificate for use with your server, which will secure your connection to that server. You will probably not need this functionality every time you set up a proxy host especially if you use other means to generate SSL/TLS certs, but I will show you this function anyway! Under <em>SSL Certificate</em>, select "<em>Request a new SSL Certificate"</em>. Check <em>Force SSL </em>and <em>HTTP/2 Support. </em>Enter your email address at the bottom of the config and check to agree to LetsEncrypt's ToS. Click <em>Save</em>. A cert will generate, and your proxy host will be configured! </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><img class="wp-image-215" style="width: 500px;" src="https://whitematter.tech/wp-content/uploads/2021/08/Screen-Shot-2021-08-16-at-11.50.18-PM.png" alt=""></p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4>Your proxy host should look something like this:</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><img class="wp-image-216" style="width: 1000px;" src="https://whitematter.tech/wp-content/uploads/2021/08/Screen-Shot-2021-08-16-at-11.10.17-PM.png" alt=""></p>
<!-- /wp:paragraph -->

<!-- wp:pullquote -->
<figure class="wp-block-pullquote"><blockquote><p>Conclusion</p></blockquote></figure>
<!-- /wp:pullquote -->

<!-- wp:paragraph -->
<p>Once your host is added, you can add more following similar guidelines! The config may change slightly or substantially depending on your end goal, but the endless possibilities cannot be covered in a single post. However, I use this reverse proxy setup to add SSL for my connection to my <em>&nbsp;<a href="https://www.amazon.com/gp/product/B086967C9X/ref=as_li_tl?ie=UTF8&amp;camp=1789&amp;creative=9325&amp;creativeASIN=B086967C9X&amp;linkCode=as2&amp;tag=whitematter-20&amp;linkId=4fc0624a437d4bfe761f2ebb02ca61bd" target="_blank" rel="noreferrer noopener">Unifi Dream Machine Pro</a></em>&nbsp;<em>(UDMP)</em>. This entails forwarding ports 443 to the UDMP and adding the following Location: "<strong>/*</strong>". This is one of many neat applications of this reverse proxy setup. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Please feel free to reach out to me if you have any questions or if this post was helpful! I love to hear how people are running their homelabs or offices. Comment below or shoot me an email to <a href="mailto:robert@whitematter.tech" target="_blank" rel="noreferrer noopener">robert@whitematter.tech</a>. Thanks for reading!</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><a href="https://github.com/robertomano24/nginx-proxy-manager#wget-docker-compose"></a></p>
<!-- /wp:paragraph -->
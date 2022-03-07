---
ID: 306
post_title: >
  How to Route Any Docker Container
  Through VPN in Unraid
post_name: >
  how-to-route-any-docker-container-through-vpn-in-unraid
author: Robert White
post_date: 2021-11-17 14:11:09
layout: post
link: >
  https://whitematter.tech/2021/how-to-route-any-docker-container-through-vpn-in-unraid/
published: true
tags:
  - docker
  - unraid
  - vpn
categories:
  - Docker
  - Security
  - Tutorials
  - Unraid
---
<!-- wp:paragraph {"dropCap":true} -->
<p class="has-drop-cap">Today's post will cover how you can route any Docker container through a VPN.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>There are many reasons you might want to route a Docker container through a VPN. Some common considerations are <span class="has-inline-color has-vivid-purple-color">privacy, anonymity, and security</span>. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>I always recommend a VPN provider that values privacy, and in your search, you should consider providers that do not keep access logs that can be tied back to you <em>(I use <a href="http://www.privateinternetaccess.com/pages/buy-a-vpn/1218buyavpn?invite=U2FsdGVkX19vJeCiFLTHejdg7_UKL-kbJpMDRcdZ8ZM%2CwwbqkM0Pr8u1JywwOJHsqq-mX14" target="_blank" rel="noreferrer noopener">Private Internet Access</a> [PIA])</em>. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>There are many use-cases for this sort of functionality that <strong><em>do not entail breaking laws or piracy</em></strong>. I also <strong><em>DO NOT </em></strong>advocate for your use of these techniques for such purposes. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>For example, one might be interested in<span class="has-inline-color has-vivid-purple-color"> anonymously</span> accessing Twitter feeds in one container routed through a VPN, pulling those feeds into an RSS reader container, and <span class="has-inline-color has-vivid-purple-color">anonymously</span> <a href="https://whitematter.tech/2021/how-to-access-twitter-without-an-account-anonymously/" target="_blank" rel="noreferrer noopener" title="https://whitematter.tech/2021/how-to-access-twitter-without-an-account-anonymously/">hosting your own Twitter</a>, <span class="has-inline-color has-vivid-purple-color">anonymously</span>.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Obtain VPN Container</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The first thing you will need to do is obtain a container on Unraid that can host your VPN client. For example, I use <strong><em>binhex/arch-privoxyvpn</em></strong> and highly recommend it. However, there are viable alternatives like NordVPN. You might want to do some research and see which best meets your needs. But, for PIA, <strong><em>binhex/arch-privoxyvpn</em></strong> is the best. </p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":318,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/11/2021-10-16-01_53_52-WhiteHouse_Docker-1024x81.png" alt="" class="wp-image-318"/></figure>
<!-- /wp:image -->

<!-- wp:heading -->
<h2>Create Docker Network for VPN</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Next, you will need to use the Terminal on Unraid to issue a command that specifically creates a Docker network that will use the VPN to route traffic through. Using Binhex's PrivoxyVPN (where the container is named "privoxyvpn"), my command looks like this:</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>docker network create container:<span class="has-inline-color has-vivid-red-color">privoxyvpn</span></code></pre>
<!-- /wp:code -->

<!-- wp:heading -->
<h2>Route Containers Through the New Network</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The next step is to route your containers through the new network you just created. To do this, go to the settings page of the container you would like to route and edit the "<strong>Network Type</strong>" on the container. Here, choose the new network you just created (e.g., privoxyvpn) (see image below). <br></p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":319,"sizeSlug":"full","linkDestination":"none"} -->
<figure class="wp-block-image size-full"><img src="https://whitematter.tech/wp-content/uploads/2021/11/2021-10-16-02_07_27-WhiteHouse_UpdateContainer.png" alt="" class="wp-image-319"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>Then, you need to take note of and delete all port mappings on the container you just routed. Port mappings will either render the container useless or render the VPN useless. Delete the mappings and keep them for reference in the next step (for example, if you use the container "<strong><em>Nitter</em></strong>," you would take note of and delete the port mapping to <span class="has-inline-color has-vivid-green-cyan-color">8080</span>).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>After the port mappings are deleted, all ports to your container will be routed through your VPN container.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Adding GUI Ports to VPN Container</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Finally, in order to access your containers that are routed through the VPN, you must tell the VPN container what ports can be used for access. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>To do this, go to your VPN container's settings. In settings, add your ports to the <strong>VPN_OUTPUT_PORTS</strong> option (this may be different if you are not using<strong><em> Privoxyvpn</em></strong>). Then, map each port directly to the container by selecting "<strong><em>Add another Path, Port, Variable, Label or Device</em></strong>" at the bottom container's settings page. Change "<em>Config Type</em>" to "<em>Port</em>". Next, add the original port from your container under the "<em>Container Port:</em>" option. Then, add the port you would like mapped to the container to access that port under "<em>Host Port:</em>". For example, if you want to access <strong><em>Nitter's</em></strong> port <span class="has-inline-color has-vivid-green-cyan-color">8080 </span>on<span class="has-inline-color has-vivid-green-cyan-color"> 8082</span>,  "<em>Container Port:</em>" will be <span class="has-inline-color has-vivid-green-cyan-color">8080</span> and "<em>Host Port:</em>" will be <span class="has-inline-color has-vivid-green-cyan-color">8082</span>. Otherwise, you can make these two ports match for ease of setup. See the image below for an example.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":321,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/11/2021-10-16-01_55_10-WhiteHouse_UpdateContainer-1024x440.png" alt="" class="wp-image-321"/></figure>
<!-- /wp:image -->

<!-- wp:heading -->
<h2>Conclusion</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Once your container settings are saved, you will be able to access the GUI of your container, but the container traffic will be routed through your VPN! This will provide extra <span class="has-inline-color has-vivid-purple-color">security, privacy, and anonymity</span> for your data.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Congratulations </strong>if you made it this far and everything is working! I hope this tutorial aids you in your endeavors to anonymize certain portions of your network. If you have any questions or need assistance, please let me know in the comments or email me at <a href="mailto:robert@whitematter.tech" target="_blank" rel="noreferrer noopener">robert@whitematter.tech</a> !</p>
<!-- /wp:paragraph -->
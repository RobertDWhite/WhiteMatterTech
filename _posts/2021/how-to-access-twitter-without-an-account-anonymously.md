---
ID: 334
post_title: >
  How to Access Twitter Without an
  Account, Anonymously
post_name: >
  how-to-access-twitter-without-an-account-anonymously
author: Robert White
post_date: 2021-11-19 12:20:22
layout: post
link: >
  https://whitematter.tech/2021/how-to-access-twitter-without-an-account-anonymously/
published: true
tags:
  - docker
  - twitter
  - unraid
categories:
  - Docker
  - Security
  - Tips
  - Tutorials
  - Unraid
---
<!-- wp:paragraph -->
<p>Interestingly, after my previous post describing <a href="https://whitematter.tech/2021/how-to-route-any-docker-container-through-vpn-in-unraid/" target="_blank" rel="noreferrer noopener">how to route Docker containers through VPN on Unraid, </a>I received a substantial lot of questions via email about my hints at accessing Twitter <span class="has-inline-color has-vivid-green-cyan-color">anonymously</span>. This post is my response to those questions, and I will describe my workflow to access Twitter feeds <span class="has-inline-color has-vivid-green-cyan-color">anonymously</span>, without an account. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This post will assume you have read my post on <a href="https://whitematter.tech/2021/how-to-route-any-docker-container-through-vpn-in-unraid/" target="_blank" rel="noreferrer noopener">how to route Docker containers through VPN on Unraid</a> or that you already know how to accomplish this. If you do not, start <a href="https://whitematter.tech/2021/how-to-route-any-docker-container-through-vpn-in-unraid/" target="_blank" rel="noreferrer noopener" title="https://whitematter.tech/2021/how-to-route-any-docker-container-through-vpn-in-unraid/">here</a>. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>I will be using <span class="has-inline-color has-vivid-cyan-blue-color"><strong>Unraid</strong></span> in this tutorial, but you could accomplish the same functionality with Docker on another host OS.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Nitter</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Docker container used to access Twitter is a wonderful third-party tool known as <em><span class="has-inline-color has-vivid-purple-color">Nitter</span></em> (<strong><em><span class="has-inline-color has-vivid-purple-color">zedeus/nitter</span></em></strong>). This container is relatively self-explanatory, but the purpose of the container is to be able to search for your favorite Twitter users and see their feeds. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>All requests go through the backend, and your client never talks to Twitter, which is how <span class="has-inline-color has-vivid-purple-color">Nitter</span> prevents Twitter from tracking your IP or JavaScript fingerprint, thus enhancing <span class="has-inline-color has-vivid-green-cyan-color">privacy</span>. Behind a VPN, you have yourself a self-hosted, <span class="has-inline-color has-vivid-green-cyan-color">anonymous</span> Twitter reader that does not require an account or track you. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>There are also public <span class="has-inline-color has-vivid-purple-color">Nitter </span>instances you could use if your prefer not to host your own instance: <a href="https://github.com/zedeus/nitter/wiki/Instances" target="_blank" rel="noreferrer noopener">https://github.com/zedeus/nitter/wiki/Instances</a>. But don't you want to <a href="https://whitematter.tech/2021/run-a-reverse-proxy-using-docker/" target="_blank" rel="noreferrer noopener">use your reverse proxy</a> to route twitter.your-domain.com to your <span class="has-inline-color has-vivid-purple-color">Nitter</span> instance and have your own Twitter?</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":335,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/11/Screen-Shot-2021-11-19-at-11.25.38-AM-1024x644.png" alt="" class="wp-image-335"/><figcaption>Example Nitter Search for "Apple"</figcaption></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>Search for your favorite user(s), select their profile, and click the <em>RSS icon</em> in the top right corner of the screen. Copy the URL of the RSS page for use in the next steps.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":337,"sizeSlug":"full","linkDestination":"none"} -->
<figure class="wp-block-image size-full"><img src="https://whitematter.tech/wp-content/uploads/2021/11/Screen-Shot-2021-11-19-at-11.41.37-AM.png" alt="" class="wp-image-337"/><figcaption>Click the RSS Icon</figcaption></figure>
<!-- /wp:image -->

<!-- wp:image {"id":336,"sizeSlug":"full","linkDestination":"none"} -->
<figure class="wp-block-image size-full"><img src="https://whitematter.tech/wp-content/uploads/2021/11/Screen-Shot-2021-11-19-at-11.41.29-AM.png" alt="" class="wp-image-336"/><figcaption>Example User Account on Nitter, of your favorite Elon Musk</figcaption></figure>
<!-- /wp:image -->

<!-- wp:heading -->
<h2>FreshRSS</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Now, in conjunction with your <span class="has-inline-color has-vivid-purple-color">Nitter</span> container behind a VPN <em>(or simply a public <span class="has-inline-color has-vivid-purple-color">Nitter</span> instance like mentioned above)</em>, add <span class="has-inline-color has-vivid-purple-color">FreshRSS </span>(<strong><em><span class="has-inline-color has-vivid-purple-color">linuxserver/freshrss</span></em></strong>). This container will allow you to maintain the records of the feeds you want to follow in the form of RSS.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Even if you choose to only use this container to access a locally hosted <span class="has-inline-color has-vivid-purple-color">Nitter </span>instance, I still recommend routing it through a VPN. There may come a day where you open your <span class="has-inline-color has-vivid-purple-color">Nitter</span> container publically or where you decide to grab RSS feeds from elsewhere. In either case, a VPN will help provide <span class="has-inline-color has-vivid-green-cyan-color">anonymity</span> and <span class="has-inline-color has-vivid-green-cyan-color">security</span>, making it even harder for trackers to store your data.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Once the container is launched, select "<strong><em>Add a feed or category</em></strong>" on the left navigation panel. Under "<strong><em>Add a category</em></strong>," you can create your own categories to keep your feeds organized (e.g., Tech, Politics, etc.). Under "<strong><em>Add a feed</em></strong>," you can begin adding the feeds from <span class="has-inline-color has-vivid-purple-color">Nitter</span> that you want to follow. In my screenshot below, you can see I am using a public <span class="has-inline-color has-vivid-purple-color">Nitter</span> instance and attempting to follow Elon Musk (<a href="https://nitter.fdn.fr/elonmusk/rss" target="_blank" rel="noreferrer noopener">https://nitter.fdn.fr/elonmusk/rss</a>). Add the URL in the "<em><strong>Feed URL</strong></em>" section, select a category that you have made previously, and click "<strong><em>Add</em></strong>" to confirm. If you want to add even ANOTHER layer of <span class="has-inline-color has-vivid-green-cyan-color">privacy</span>, you can also set up a SOCKS5 proxy connection as shown in the screenshot. If using <strong><span class="has-inline-color has-pale-cyan-blue-color">Unraid</span></strong> to host your SOCKS5 proxy server, it would look something like the screenshot below.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":340,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/11/Screen-Shot-2021-11-19-at-12.04.52-PM-1024x551.png" alt="" class="wp-image-340"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>Even with <span class="has-inline-color has-vivid-purple-color">FreshRSS</span>, you can consider <meta charset="utf-8"><a href="https://whitematter.tech/2021/run-a-reverse-proxy-using-docker/" target="_blank" rel="noreferrer noopener">using your reverse proxy</a> to route something like rss.your-domain.com to your container. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>I would <strong>highly recommend</strong> setting up HTTP auth via your reverse proxy if you plan to open either of these containers to the public. Strong authentication will be invaluable in such a case. As always, I recommend the use of a password manager in order to generate, store, and access strong credentials (<em>I use <a href="https://1password.com/" title="https://1password.com/" target="_blank" rel="noreferrer noopener">1Password</a> currently)</em>.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Conclusion</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><strong>Congratulations </strong>if you made it this far and everything is working! I hope this tutorial aids you in your endeavors to <span class="has-inline-color has-vivid-green-cyan-color">anonymize</span> your access to Twitter while substantially enhancing the <span class="has-inline-color has-vivid-green-cyan-color">privacy</span> and preventing tracking of your personal data. If you have any questions or need assistance, please let me know in the comments or email me at <a href="mailto:robert@whitematter.tech" target="_blank" rel="noreferrer noopener">robert@whitematter.tech</a> !</p>
<!-- /wp:paragraph -->
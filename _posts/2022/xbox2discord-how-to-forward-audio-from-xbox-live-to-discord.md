---
ID: 382
post_title: 'Xbox2Discord: How to Forward Audio from Xbox Live to Discord'
post_name: >
  xbox2discord-how-to-forward-audio-from-xbox-live-to-discord
author: Robert White
post_date: 2022-01-07 12:20:24
layout: post
link: >
  https://whitematter.tech/2022/xbox2discord-how-to-forward-audio-from-xbox-live-to-discord/
published: true
tags:
  - gaming
categories:
  - Tutorials
  - Windows
---
<!-- wp:paragraph -->
<p>If you game on PC, you probably have Discord installed to chat with your friends as you game. Discord has relatively decent audio, and it far surpasses the in-game chat capabilities built into most games. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>When gaming cross-platform, however, you're stuck either using in-game chat or the tedious Xbox Companion app with limited controls and annoying party configs. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"dropCap":true} -->
<p class="has-drop-cap">This post will show you how to configure a setup to forward audio from an Xbox party directly to Discord, and <em>visa versa</em>. This way, you can game with your Xbox friends and still use the far superior Discord.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>I am running this setup on a Windows 10 VM on Unraid. I recommend using a VM on another PC or server that you are not gaming on for this setup.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>The Virtual Audio Cable</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The <a href="https://vac.muzychenko.net/en/" target="_blank" rel="noreferrer noopener">Virtual Audio Cable</a> (VAC) is the magic sauce for this setup. The biggest bummer with the VAC is that a home license is a $30 one time purchase. I went ahead and purchased the VAC because it is super useful in other applications too.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The VAC has a trial, but after 30 minutes, a voice talks in the background reminding you it is a trial.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Should you try the trial or purchase the software, please continue reading!</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The setup is straightforward. You need to create two cables and click "Set" in the top left corner of the software. See the image below for how it should look. Basically, this will create two audio interfaces that can be used to route audio to different places in your OS.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":388,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2022/01/Screen-Shot-2022-01-06-at-12.05.54-PM-1024x505.png" alt="" class="wp-image-388"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>Once you have the two cables created, you're done with this part!</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>The XBox Console Companion App</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Currently, I am using the <a href="https://www.microsoft.com/en-us/p/xbox-console-companion/9wzdncrfjbd8?activetab=pivot:overviewtab" target="_blank" rel="noreferrer noopener">Xbox Console Companion App</a>. I believe at this time that Microsoft is attempting to push this application by the wayside for their newer Xbox PC app, but I still prefer the <meta charset="utf-8"><a href="https://www.microsoft.com/en-us/p/xbox-console-companion/9wzdncrfjbd8?activetab=pivot:overviewtab" target="_blank" rel="noreferrer noopener">Xbox Console Companion</a> at this time.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Basically, you will want to create a new Xbox Live user that can be used to host Xbox parties with your Xbox friends. For example, you could create a user Xbox2Discord. Add all your friends who will want to cross-platform play with you.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>In the app settings, select the Speaker source as "Line 1 (Virtual Audio Cable)". For microphone, select "Line 2 (Virtual Audio Cable)." See the image below.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":386,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2022/01/Screen-Shot-2022-01-06-at-12.05.37-PM-1024x676.png" alt="" class="wp-image-386"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>The Xbox setup is simple too. Once the above is completed, you are ready to move over to Discord.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Discord</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>For the Discord setup, I likewise recommend creating a new user, Xbox2Discord or something of the like, for this setup. Add this user to whatever server you would like the functionality to exist.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>In Voice &amp; Video settings in the Discord app, change the Input device to Line 1 (Virtual Audio Cable) and select Line 2 (Virtual Audio Cable). See the image below for the example.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":385,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2022/01/Screen-Shot-2022-01-06-at-12.06.05-PM-1024x540.png" alt="" class="wp-image-385"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>Once the above is completed, you can use your new user to join your chat in your Discord server. Once your friends join the Xbox Live party of your Xbox user, you should now be able to hear and talk to your Xbox friends via Discord! See the image below.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":387,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2022/01/Screen-Shot-2022-01-06-at-12.06.44-PM-368x1024.png" alt="" class="wp-image-387"/></figure>
<!-- /wp:image -->

<!-- wp:heading -->
<h2>Conclusion<meta charset="utf-8"></h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><strong>Congratulations&nbsp;</strong>if you made it this far and everything is working! I hope this tutorial aids you in your endeavors to&nbsp;improve your social gaming experience. If you have any questions or need assistance, please let me know in the comments or email me at&nbsp;<a href="mailto:robert@whitematter.tech" target="_blank" rel="noreferrer noopener">robert@whitematter.tech</a>&nbsp;!</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Special thanks to Samuel Wallace for dreaming with me and making the ins-and-outs of this project work.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->

## Contribute {#contribute}

<!-- /wp:heading -->

<!-- wp:paragraph -->

Do you notice any issues or want to add information to this post? Visit the link below to submit a PR on GitHub with your modifications in Markdown.
<!-- /wp:paragraph -->
[giw_edit_link]

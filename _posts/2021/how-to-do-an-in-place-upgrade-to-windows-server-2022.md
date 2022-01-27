---
ID: 281
post_title: >
  How To Do An In-Place Upgrade To Windows
  Server 2022
post_name: >
  how-to-do-an-in-place-upgrade-to-windows-server-2022
author: Robert White
post_date: 2021-11-19 00:35:35
layout: post
link: >
  https://whitematter.tech/2021/how-to-do-an-in-place-upgrade-to-windows-server-2022/
published: true
tags:
  - server
  - upgrade
  - windows
categories:
  - Business
  - Tips
  - Tutorials
  - Windows
---
<!-- wp:paragraph {"dropCap":true} -->
<p class="has-drop-cap">I recently had to upgrade two domain controllers to <span class="has-inline-color has-vivid-purple-color">Windows Server 2022</span>. The main controller was still on <span class="has-inline-color has-vivid-purple-color">Windows Server 2016</span> while the secondary was <span class="has-inline-color has-vivid-purple-color">Windows Server 2019</span>. Both <span class="has-inline-color has-vivid-red-color">in-place upgrades</span> went without issue. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Both servers were running <em>Hyper-V, Bitlocker, and AD Controller</em>. The <span class="has-inline-color has-vivid-purple-color">2019</span> server had an <em>SMTP server</em> that it was running, but Microsoft has deprecated the SMTP stack and associated management tools, including the IIS tools. There very well may be other deprecated software or tools, and I highly recommend searching for specific functionality you utilize on your Win Servers before attempting the upgrade.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong><em>Reach out to my <span class="has-inline-color has-vivid-cyan-blue-color">Microsoft Partner</span> consulting company for the best prices on your <span class="has-inline-color has-vivid-purple-color">Windows Server 2022</span> licenses and volume licenses. Otherwise, if you need a  <strong><em><span class="has-inline-color has-vivid-cyan-blue-color">Microsoft Partner</span></em></strong>, hit us up.</em></strong> <strong><em>Visit <a href="https://wallaceandwhite.com" target="_blank" rel="noreferrer noopener">wallaceandwhite.com</a> or email us at <a href="mailto:info@wallaceandwhite.com" target="_blank" rel="noreferrer noopener">info@wallaceandwhite.com</a></em></strong></p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":1} -->
<h1>Instructions</h1>
<!-- /wp:heading -->

<!-- wp:list {"ordered":true} -->
<ol><li><strong>Backup your server</strong>. I used <span class="has-inline-color has-vivid-green-cyan-color">Veeam</span>.</li><li>Locate the <span class="has-inline-color has-vivid-purple-color">Windows Server Setup</span> media of the <span class="has-inline-color has-vivid-purple-color">Win Server</span> upgrade image, and then run&nbsp;setup.exe.&nbsp;</li><li>Select<strong><em> Yes</em></strong> to start the setup process. For internet-connected devices, select the <strong><em>Download updates, drivers and optional features [recommended]</em></strong> option, and then, select <strong><em>Next</em></strong>.</li><li>Wait for the setup to check your device configuration, and then select <em><strong>Next</strong></em>.</li><li>Depending on the distribution channel from where you received your <span class="has-inline-color has-vivid-purple-color">Windows Server</span> media <em>(e.g., Retail, Volume License, OEM, ODM, etc.)</em>, you may be prompted to enter a licensing key to continue.</li><li>Select the <span class="has-inline-color has-vivid-purple-color">Windows Server</span> edition you want to install&nbsp;and&nbsp;select Next.</li><li>Select Accept to accept the terms of your licensing agreement, based on your distribution channel<em> (e.g., Retail, Volume License, OEM, ODM, etc).</em></li><li>Select <em><strong>Keep personal files and apps</strong></em> in order to do an <span class="has-inline-color has-vivid-red-color">in-place upgrade</span>&nbsp;and then select <strong><em>Next</em></strong>.</li></ol>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>After Setup analyzes your device, a prompt will appear to proceed with the upgrade by selecting <strong><em>Install</em></strong>.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The<span class="has-inline-color has-vivid-red-color"> in-place upgrade</span> starts and presents the <em>Upgrading Windows</em> screen showing its progress. After the upgrade finishes, the server will restart.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":1} -->
<h1>Conclusion</h1>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>It can certainly be intimidating to make these upgrades on production machines that your teams or business rely on daily, but Microsoft made this particular upgrade path pretty straightforward. As always, be sure you have a backup of your server before attempting such an upgrade. Nonetheless, you likely will not need it.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Congratulations </strong>if you made it this far and everything is working! I hope this tutorial aids you in your endeavors to upgrade your servers to <span class="has-inline-color has-vivid-purple-color">Windows Server 2022</span>. If you have any questions or need assistance, please let me know in the comments or email me at <a href="mailto:robert@whitematter.tech" target="_blank" rel="noreferrer noopener">robert@whitematter.tech</a> !</p>
<!-- /wp:paragraph -->
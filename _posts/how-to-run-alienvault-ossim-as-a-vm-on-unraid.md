---
ID: 259
post_title: >
  How to Run AlienVault OSSIM as a VM on
  Unraid
post_name: >
  how-to-run-alienvault-ossim-as-a-vm-on-unraid
author: Robert White
post_date: 2021-10-01 14:39:06
layout: post
link: >
  https://whitematter.tech/2021/how-to-run-alienvault-ossim-as-a-vm-on-unraid/
published: true
tags:
  - ossim
  - security
  - siem
  - unraid
  - vm
categories:
  - Networking
  - Security
  - Tutorials
  - Unraid
  - VM
---
<!-- wp:heading -->
<h2>Introduction</h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"dropCap":true} -->
<p class="has-drop-cap">For this post, I will show you how to setup <a href="https://www.unraid.net/" target="_blank" rel="noreferrer noopener">Unraid</a> to run <a href="https://cybersecurity.att.com/products/ossim" target="_blank" rel="noreferrer noopener">AlienVault OSSIM</a> as a VM. OSSIM is a powerful open-source SIEM that you can leverage on your network for free. I use OSSIM for network-wide vulnerability scanning and endpoint host intrusion detection. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>OSSIM's integrated HIDS is a fork from OSSEC. Additionally, OSSIM integrates with <a href="https://otx.alienvault.com/" target="_blank" rel="noreferrer noopener">Open Threat Exchange (OTX)</a>, which can be installed on Windows, Mac, and Linux endpoints and servers for an up-to-date, open-source vulnerability scanning tool. I deploy the OTX installer via my free <a href="https://mybusiness.mosyle.com/" target="_blank" rel="noreferrer noopener">Mosyle</a> account <em>(MDM for MacOS)</em> and <a href="https://endpoint.microsoft.com/">Intune</a> (<em>MDM for Windows</em>). </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>My main server, I suppose, is a custom-built Unraid server. For a long time, I have hoped to run OSSIM on Unraid, but I was never quite able to figure out how to get the OSSIM VM to boot. I usually could get through the GUI installer, but once the post-install reboot occurred, I would always be met with a screen that would freeze and say  "<em>Booting from device...</em>" for the rest of eternity. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>I accidentally recently botched my OSSIM bare-metal install that was running on an old Dell workstation. It did a great job since resource requirements are relatively minimal for OSSIM. When I attempted to modify some install files on OSSIM via APT, however, I made a crucial mistake and decided to rebuild OSSIM from scratch. Revisiting the VM on Unraid configuration made sense again.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This time, I was able to find the correct combination of settings in the Unraid VM options to successfully load, install, and post-install boot the OSSIM OS. Maybe, overall, it was a lot easier than I made it originally, but I thought that documenting it would be beneficial, as I was unable to find any walkthroughs or tutorials for this specific setup. </p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2><strong>Download OSSIM</strong></h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>OSSIM is available for download for free at the following link: <a href="https://cybersecurity.att.com/products/ossim/download" target="_blank" rel="noreferrer noopener">https://cybersecurity.att.com/products/ossim/download</a>. OSSIM is free and open-source. If you download from the link, you will get an ISO that you can use to install your VM.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Alternatively, you can SSH into your Unraid or you can use Unraid's built-in Terminal to run the following command to download the ISO (be sure to <strong><em>cd</em></strong> into a share directory prior to downloading, for example, <em>/mnt/user/iso</em>): </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"align":"center"} -->
<p class="has-text-align-center"><code>wget https://dlcdn.alienvault.com/AlienVault_OSSIM_64bits.iso</code></p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Prepare Unraid</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>If you downloaded the ISO to your computer, connect to a file share on your Unraid and transfer the ISO to Unraid. If you used <strong><em>wget</em></strong>, the ISO is already on Unraid ready to go.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2><strong>Create a New VM</strong></h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The biggest trick to get OSSIM to work on Unraid is specifically choosing <strong>Debian</strong> as the VM host. Under the <strong>VMs</strong> tab on Unraid, select<strong> ADD VM</strong>.  On this screen under <strong>Linux</strong>, select <strong>Debian</strong>.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Configure the VM</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>To configure the VM, be sure to leave CPU mode as the default "Host Passthrough." You can select the number of cores/threads you would like for your OSSIM VM. My CPU is a Ryzen 9 3950x with 16 cores / 32 threads. I currently have 8 cores assigned to my VM. I run 8192MB for both Initial and Max Memory. For the <strong>Machine, </strong>select <strong><em>Q35-6.0</em></strong>. For <strong>BIOS, </strong>select <strong><em>SeaBIOS</em></strong>. For <strong>USB Controller, </strong>select <strong><em>3.0 (nec XHCI). </em></strong>For <strong>OS Install ISO, </strong>select the ISO you uploaded / downloaded earlier (e.g., <em>/mnt/user/iso/AlienVault_OSSIM_64bits.iso</em>). </p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":263,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/10/Screen-Shot-2021-10-01-at-1.50.01-PM-1024x857.png" alt="" class="wp-image-263"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p><meta charset="utf-8">Next, select <strong><em>SATA</em></strong> as the <strong>OS Install CDRom Bus</strong>. Select where you would like the OSSIM VM virtual disk to be located and how large it should be under <strong>Primary vDisk Location</strong> (e.g., mine is located on a specific VM pool I made on an SSD). Select <strong><em>SATA</em></strong> again for <strong>Primary vDisk Bus. </strong>Leave everything else down to <strong>Network MAC </strong>as is. In the bottom left of the network pane, click the "+" to add another virtual network interface. For the new <strong>2nd Network MAC</strong>, I recommend copy+pasting the original MAC and changing the last number/letter to be different. Leave the rest of the settings as is.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Start the VM</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Save the configuration page and load the VM. From here, you should be able to follow the OSSIM install as you would in any other environment. The vDisk will be selected for install automatically unless you happen to add another disk above for your own configuration needs. When it comes time for the install to install the GRUB bootloader, it will fail. Continue with the install WITHOUT a bootloader when the install asks. Once the install completes and the VM restarts, you should be able to configure your OSSIM admin credentials!</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Wrapping Up</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>OSSIM is extremely powerful and can be complicated to use. If you are not already familiar with OSSIM, I recommend doing some intense Google searching about SIEM tools in general and specifically about configuration recommendations for OSSIM. It may be a little overkill for your Home Lab, but it is a valuable tool to be comfortable with for any security practitioner.</p>
<!-- /wp:paragraph -->

<!-- wp:pullquote -->
<figure class="wp-block-pullquote"><blockquote><p>As always, if you have any questions, feel free to post below or reach out to me at&nbsp;<a href="mailto:robert@whitematter.tech" target="_blank" rel="noreferrer noopener">robert@whitematter.tech</a>.</p><p>Thanks for reading!</p><cite>Robert</cite></blockquote></figure>
<!-- /wp:pullquote -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->
---
ID: 438
post_title: >
  Tails OS with Encrypted Persistence on
  Unraid as a VM
post_name: >
  tails-os-with-encrypted-persistence-on-unraid-as-a-vm
author: Robert White
post_date: 2022-01-24 00:10:36
layout: post
link: >
  https://whitematter.tech/2022/tails-os-with-encrypted-persistence-on-unraid-as-a-vm/
published: true
tags:
  - anonymous
  - encrypt
  - tails
  - unraid
  - vm
categories:
  - Tutorials
  - Unraid
  - VM
---
<!-- wp:paragraph {"dropCap":true} -->
<p class="has-drop-cap">This post will show you how to run Tails OS as a VM with the Persistence feature enabled.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Running Tails as a VM is not recommended generally as it defeats many of the security features in Tails. For example, virtualization requires that you trust the hypervisor host, as the hypervisor has extra privileges over a VM that can reduce security and privacy of the VM. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>I recommend reading Tails's official documentation about virtualization considerations before continuing: <a href="https://tails.boum.org/doc/advanced_topics/virtualization/" target="_blank" rel="noreferrer noopener">https://tails.boum.org/doc/advanced_topics/virtualization/</a> </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>However, there may be many great reasons this VM setup would be beneficial to you. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>I recommend this setup for tasks that call for extra anonymity. One fun reason to run Tails as a VM with Persistence would be to store and access your crypto wallets.  You could also use Tails simply to reduce your digital footprint around the web more generally. </p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 id="write-tails-live-to-a-usb-stick">Write Tails Live to a USB Stick</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The first step to running Tails on Unraid (with Persistence) is to write the Live OS to a USB stick. You will need a USB stick that can stay attached to your Unraid server anytime you want to access the Tails VM (I leave mine in all the time).</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If you simply want to run Tails with no Persistence, you can certainly skip this step. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>You can find documentation about writing the OS to a USB stick from Tails's official site: <a href="https://tails.boum.org/install/index.en.html" target="_blank" rel="noreferrer noopener">https://tails.boum.org/install/index.en.html</a></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>I am using <a href="https://amzn.to/3tQsAtl" target="_blank" rel="noreferrer noopener" title="this Sony USB stick from Amazon">this Sony USB stick from Amazon</a>. I am also using this USB stick for my Unraid OS because it is <a href="https://wiki.unraid.net/USB_Flash_Drive_Preparation" target="_blank" rel="noreferrer noopener" title="on the recommended USB stick list by the Unraid develope">on the recommended USB stick list by the Unraid develope</a><a href="https://wiki.unraid.net/USB_Flash_Drive_Preparation" target="_blank" rel="noreferrer noopener" title="rs.">rs.</a></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong><em><span class="has-inline-color has-vivid-cyan-blue-color">At the time of the writing of the post, I am using Tails 4.26.</span></em></strong></p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 id="attach-the-usb-stick-to-unraid">Attach the USB Stick to Unraid</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Attach the USB stick to Unraid. Open an SSH connection to Unraid or open the Terminal in the Unraid GUI. Run the command below.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><code>ls -lha /dev/disk/by-id/</code></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Copy the full location of your USB stick. It should look similar to the one below. Do not copy the ID that contains "-PART", etc. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><code>/dev/disk/by-id/usb-_USB_DISK_3.0_xxxxxxxxxxxxxxxxxx-0:0</code></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><em><span class="has-inline-color has-vivid-purple-color">(Note: If you have two or more USB sticks attached to Unraid, and the chances are that you do given Unraid is supposed to run off of a USB stick, you may need to use deductive reasoning or the brand name to differentiate which USB stick you have. If you have trouble identifying the correct USB stick, you could unplug the Tails USB and run the command again in order to isolate your USB.) </span></em></p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 id="create-the-vm">Create the VM</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>In Unraid's VM manager, select "<strong>ADD VM</strong>." From there, select "<strong>Linux</strong>." Select the core distribution and RAM allotment that makes sense for your purposes. For <strong><em>Machine,</em></strong> select "i440fx-6.1." For <strong><em>Bios</em></strong>, select "<strong>SeaBIOS.</strong>" For <strong><em>USB Controller</em></strong>, select "<strong>2.0 (EHCI).</strong>" For <strong><em>Primary vDisk Location</em></strong>, select "<strong>Manual</strong>" and paste the location of your USB from earlier (e.g.,  <code><strong>/dev/disk/by-id/usb-_USB_DISK_3.0_xxxxxxxxxxxxxxxxxx-0:0</strong></code>). For <strong><em>2nd vDisk Location</em></strong>, select Auto or define your vDisk as needed (this will be the Persistence storage disk), and select the <strong><em>2nd vDisk BUS</em></strong> to be "<strong>VirtIO</strong>". See the image below.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":442,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2022/01/image-1024x485.png" alt="" class="wp-image-442"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>Finally, select a Network Bridge to use. <strong><span style="color:#03b55c" class="has-inline-color"><em>Bonus points if you route an Unraid Network Bridge through a VLAN tagged subnet routed through a VPN</em></span><span class="has-inline-color has-vivid-cyan-blue-color"> (<a href="https://whitematter.tech/2021/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/" target="_blank" rel="noreferrer noopener" title="see an older post here for ideas, especially if you use Unifi">see an older post here for ideas, especially if you use Unifi</a>).</span></strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Save the VM, but <em>do not</em> start it upon saving!</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 id="launch-the-vm">Launch the VM</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Back on Unraid's VM Manager page, click your VM, click <strong>Start</strong>, and very quickly select <strong>VNC Remote</strong> as soon as it is available. Once the VM loads, quickly press "<strong><em>Tab</em></strong>" on your keyboard to modify boot options. You will be presented with the following screen. </p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":443,"width":840,"height":632,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large is-resized"><img src="https://whitematter.tech/wp-content/uploads/2022/01/image-1-1024x771.png" alt="" class="wp-image-443" width="840" height="632"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>Modify the boot options by using your arrow keys, and use Backspace or Delete to remove the "<strong>live-media=removable</strong>" and "<strong>nopersistence</strong>" options. <em><span class="has-inline-color has-vivid-purple-color">Note: You will need to do this every time you restart the VM. There is probably a way to make this permanent, but I have yet to explore that.</span></em></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Once finished, click <strong>Enter</strong> twice, and Tails will begin to boot.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 id="setup-persistence">Setup Persistence</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>When presented with the "<strong>Welcome to Tails!</strong>" screen, select "<strong><em>Start Tails</em></strong>." Then, choose "<strong><em>Applications</em></strong>" in the top left, select "<strong><em>Configure persistent volume</em></strong>" and follow the steps presented. The <strong>2nd vDisk</strong> you created earlier will likely be pre-selected as mine was. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Follow the steps to set up the volume, make a strong encryption key, and save. <strong>Restart </strong>Tails. Follow the same procedural steps to launch the VM as above while being sure to remove the boot options specified.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Once Tails has booted again, you will be presented with the same wlecome screen from earlier with the addition of an "<strong><em>Encrypted Persistent Storage</em></strong>" box as shown in the image below. Type in your strong encryption key, and click "<strong><em>Unlock</em></strong>." From there, you have a fully functioning Tails VM with encrypted Persistent storage on Unraid!</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":444,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2022/01/image-2-1024x762.png" alt="" class="wp-image-444"/></figure>
<!-- /wp:image -->

<!-- wp:heading -->
<h2 id="wrapping-up">Wrapping Up</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><strong>Congratulations</strong> if you made it this far and everything is working! I hope this tutorial aids you in your endeavors to use Tails as a VM. If you have any questions or need assistance, please let me know in the comments!</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 id="contribute">Contribute</h2>
<!-- /wp:heading -->

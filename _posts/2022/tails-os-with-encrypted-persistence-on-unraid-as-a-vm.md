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

<p class="has-drop-cap">
  This post will show you how to run Tails OS as a VM with the Persistence feature enabled.
</p>

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

Running Tails as a VM is not recommended generally as it defeats many of the security features in Tails. For example, virtualization requires that you trust the hypervisor host, as the hypervisor has extra privileges over a VM that can reduce security and privacy of the VM.

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

I recommend reading Tails's official documentation about virtualization considerations before continuing: <a href="https://tails.boum.org/doc/advanced_topics/virtualization/" target="_blank" rel="noreferrer noopener"></a><https://tails.boum.org/doc/advanced_topics/virtualization/>

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

However, there may be many great reasons this VM setup would be beneficial to you.

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

I recommend this setup for tasks that call for extra anonymity. One fun reason to run Tails as a VM with Persistence would be to store and access your crypto wallets. You could also use Tails simply to reduce your digital footprint around the web more generally.

<!-- /wp:paragraph -->

<!-- wp:heading -->

## Write Tails Live to a USB Stick {#write-tails-live-to-a-usb-stick}

<!-- /wp:heading -->

<!-- wp:paragraph -->

The first step to running Tails on Unraid (with Persistence) is to write the Live OS to a USB stick. You will need a USB stick that can stay attached to your Unraid server anytime you want to access the Tails VM (I leave mine in all the time).

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

If you simply want to run Tails with no Persistence, you can certainly skip this step.

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

You can find documentation about writing the OS to a USB stick from Tails's official site: <a href="https://tails.boum.org/install/index.en.html" target="_blank" rel="noreferrer noopener"></a><https://tails.boum.org/install/index.en.html>

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

I am using <a href="https://amzn.to/3tQsAtl" target="_blank" rel="noreferrer noopener" title="this Sony USB stick from Amazon">this Sony USB stick from Amazon</a>. I am also using this USB stick for my Unraid OS because it is <a href="https://wiki.unraid.net/USB_Flash_Drive_Preparation" target="_blank" rel="noreferrer noopener" title="on the recommended USB stick list by the Unraid develope">on the recommended USB stick list by the Unraid develope</a><a href="https://wiki.unraid.net/USB_Flash_Drive_Preparation" target="_blank" rel="noreferrer noopener" title="rs.">rs.</a>

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

***<span class="has-inline-color has-vivid-cyan-blue-color">At the time of the writing of the post, I am using Tails 4.26.</span>***

<!-- /wp:paragraph -->

<!-- wp:heading -->

## Attach the USB Stick to Unraid {#attach-the-usb-stick-to-unraid}

<!-- /wp:heading -->

<!-- wp:paragraph -->

Attach the USB stick to Unraid. Open an SSH connection to Unraid or open the Terminal in the Unraid GUI. Run the command below.

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

`ls -lha /dev/disk/by-id/`

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

Copy the full location of your USB stick. It should look similar to the one below. Do not copy the ID that contains "-PART", etc.

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

`/dev/disk/by-id/usb-_USB_DISK_3.0_xxxxxxxxxxxxxxxxxx-0:0`

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

*<span class="has-inline-color has-vivid-purple-color">(Note: If you have two or more USB sticks attached to Unraid, and the chances are that you do given Unraid is supposed to run off of a USB stick, you may need to use deductive reasoning or the brand name to differentiate which USB stick you have. If you have trouble identifying the correct USB stick, you could unplug the Tails USB and run the command again in order to isolate your USB.) </span>*

<!-- /wp:paragraph -->

<!-- wp:heading -->

## Create the VM {#create-the-vm}

<!-- /wp:heading -->

<!-- wp:paragraph -->

In Unraid's VM manager, select "**ADD VM**." From there, select "**Linux**." Select the core distribution and RAM allotment that makes sense for your purposes. For ***Machine,*** select "i440fx-6.1." For ***Bios***, select "**SeaBIOS.**" For ***USB Controller***, select "**2\.0 (EHCI).**" For ***Primary vDisk Location***, select "**Manual**" and paste the location of your USB from earlier (e.g., `<strong>/dev/disk/by-id/usb-_USB_DISK_3.0_xxxxxxxxxxxxxxxxxx-0:0</strong>`). For ***2nd vDisk Location***, select Auto or define your vDisk as needed (this will be the Persistence storage disk), and select the ***2nd vDisk BUS*** to be "**VirtIO**". See the image below.

<!-- /wp:paragraph -->

<!-- wp:image {"id":442,"sizeSlug":"large","linkDestination":"none"} --><figure class="wp-block-image size-large"> 

<img src="https://whitematter.tech/wp-content/uploads/2022/01/image-1024x485.png" alt="" class="wp-image-442" /></figure> <!-- /wp:image -->

<!-- wp:paragraph -->

Finally, select a Network Bridge to use. **<span style="color:#03b55c" class="has-inline-color"><em>Bonus points if you route an Unraid Network Bridge through a VLAN tagged subnet routed through a VPN</em></span><span class="has-inline-color has-vivid-cyan-blue-color"> (<a href="https://whitematter.tech/2021/how-to-use-pfsense-and-unifi-to-anonymize-and-encrypt-vlan-tagged-traffic/" target="_blank" rel="noreferrer noopener" title="see an older post here for ideas, especially if you use Unifi">see an older post here for ideas, especially if you use Unifi</a>).</span>**

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

Save the VM, but *do not* start it upon saving!

<!-- /wp:paragraph -->

<!-- wp:heading -->

## Launch the VM {#launch-the-vm}

<!-- /wp:heading -->

<!-- wp:paragraph -->

Back on Unraid's VM Manager page, click your VM, click **Start**, and very quickly select **VNC Remote** as soon as it is available. Once the VM loads, quickly press "***Tab***" on your keyboard to modify boot options. You will be presented with the following screen.

<!-- /wp:paragraph -->

<!-- wp:image {"id":443,"width":840,"height":632,"sizeSlug":"large","linkDestination":"none"} --><figure class="wp-block-image size-large is-resized"> 

<img src="https://whitematter.tech/wp-content/uploads/2022/01/image-1-1024x771.png" alt="" class="wp-image-443" width="840" height="632" /></figure> <!-- /wp:image -->

<!-- wp:paragraph -->

Modify the boot options by using your arrow keys, and use Backspace or Delete to remove the "**live-media=removable**" and "**nopersistence**" options. *<span class="has-inline-color has-vivid-purple-color">Note: You will need to do this every time you restart the VM. There is probably a way to make this permanent, but I have yet to explore that.</span>*

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

Once finished, click **Enter** twice, and Tails will begin to boot.

<!-- /wp:paragraph -->

<!-- wp:heading -->

## Setup Persistence {#setup-persistence}

<!-- /wp:heading -->

<!-- wp:paragraph -->

When presented with the "**Welcome to Tails!**" screen, select "***Start Tails***." Then, choose "***Applications***" in the top left, select "***Configure persistent volume***" and follow the steps presented. The **2nd vDisk** you created earlier will likely be pre-selected as mine was.

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

Follow the steps to set up the volume, make a strong encryption key, and save. **Restart **Tails. Follow the same procedural steps to launch the VM as above while being sure to remove the boot options specified.

<!-- /wp:paragraph -->

<!-- wp:paragraph -->

Once Tails has booted again, you will be presented with the same wlecome screen from earlier with the addition of an "***Encrypted Persistent Storage***" box as shown in the image below. Type in your strong encryption key, and click "***Unlock***." From there, you have a fully functioning Tails VM with encrypted Persistent storage on Unraid!

<!-- /wp:paragraph -->

<!-- wp:image {"id":444,"sizeSlug":"large","linkDestination":"none"} --><figure class="wp-block-image size-large"> 

<img src="https://whitematter.tech/wp-content/uploads/2022/01/image-2-1024x762.png" alt="" class="wp-image-444" /></figure> <!-- /wp:image -->

<!-- wp:heading -->

## Wrapping Up {#wrapping-up}

<!-- /wp:heading -->

<!-- wp:paragraph -->

**Congratulations** if you made it this far and everything is working! I hope this tutorial aids you in your endeavors to use Tails as a VM. If you have any questions or need assistance, please let me know in the comments!

<!-- /wp:paragraph -->

<!-- wp:heading -->

## Contribute {#contribute}

<!-- /wp:heading -->

<!-- wp:paragraph -->

Do you notice any issues or want to add information to this post? Visit the link below to submit a PR on GitHub with your modifications in Markdown.

<!-- /wp:paragraph -->
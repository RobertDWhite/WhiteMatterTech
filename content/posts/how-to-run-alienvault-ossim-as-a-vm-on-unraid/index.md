---
title: "How to Run AlienVault OSSIM as a VM on Unraid"
date: "2021-10-01"
categories:
  - "networking"
  - "security"
  - "tutorials"
  - "unraid"
  - "vm"
tags:
  - "ossim"
  - "security"
  - "siem"
  - "unraid"
  - "vm"
cover:
    image: "/posts/how-to-run-alienvault-ossim-as-a-vm-on-unraid/ossimunraid.png"
    alt: "OSSIM + Unraid Graphic"
    caption: "<text>"
    relative: true'
aliases:
    - /posts/how-to-run-alienvault-ossim-as-a-vm-on-unraid/how-to-run-alienvault-ossim-as-a-vm-on-unraid/
    - /2021/how-to-run-alienvault-ossim-as-a-vm-on-unraid/
---

## Introduction

For this post, I will show you how to setup [Unraid](https://www.unraid.net/) to run [AlienVault OSSIM](https://cybersecurity.att.com/products/ossim) as a VM. OSSIM is a powerful open-source SIEM that you can leverage on your network for free. I use OSSIM for network-wide vulnerability scanning and endpoint host intrusion detection.

OSSIM's integrated HIDS is a fork from OSSEC. Additionally, OSSIM integrates with [Open Threat Exchange (OTX)](https://otx.alienvault.com/), which can be installed on Windows, Mac, and Linux endpoints and servers for an up-to-date, open-source vulnerability scanning tool. I deploy the OTX installer via my free [Mosyle](https://mybusiness.mosyle.com/) account _(MDM for MacOS)_ and [Intune](https://endpoint.microsoft.com/) (_MDM for Windows_).

My main server, I suppose, is a custom-built Unraid server. For a long time, I have hoped to run OSSIM on Unraid, but I was never quite able to figure out how to get the OSSIM VM to boot. I usually could get through the GUI installer, but once the post-install reboot occurred, I would always be met with a screen that would freeze and say "_Booting from device..._" for the rest of eternity.

I accidentally recently botched my OSSIM bare-metal install that was running on an old Dell workstation. It did a great job since resource requirements are relatively minimal for OSSIM. When I attempted to modify some install files on OSSIM via APT, however, I made a crucial mistake and decided to rebuild OSSIM from scratch. Revisiting the VM on Unraid configuration made sense again.

This time, I was able to find the correct combination of settings in the Unraid VM options to successfully load, install, and post-install boot the OSSIM OS. Maybe, overall, it was a lot easier than I made it originally, but I thought that documenting it would be beneficial, as I was unable to find any walkthroughs or tutorials for this specific setup.

## **Download OSSIM**

OSSIM is available for download for free at the following link: [https://cybersecurity.att.com/products/ossim/download](https://cybersecurity.att.com/products/ossim/download). OSSIM is free and open-source. If you download from the link, you will get an ISO that you can use to install your VM.

Alternatively, you can SSH into your Unraid or you can use Unraid's built-in Terminal to run the following command to download the ISO (be sure to **_cd_** into a share directory prior to downloading, for example, _/mnt/user/iso_):

```
wget https://dlcdn.alienvault.com/AlienVault_OSSIM_64bits.iso
```


## Prepare Unraid

If you downloaded the ISO to your computer, connect to a file share on your Unraid and transfer the ISO to Unraid. If you used **_wget_**, the ISO is already on Unraid ready to go.

## **Create a New VM**

The biggest trick to get OSSIM to work on Unraid is specifically choosing **Debian** as the VM host. Under the **VMs** tab on Unraid, select **ADD VM**. On this screen under **Linux**, select **Debian**.

## Configure the VM

To configure the VM, be sure to leave CPU mode as the default "Host Passthrough." You can select the number of cores/threads you would like for your OSSIM VM. My CPU is a Ryzen 9 3950x with 16 cores / 32 threads. I currently have 8 cores assigned to my VM. I run 8192MB for both Initial and Max Memory. For the **Machine,** select **_Q35-6.0_**. For **BIOS,** select **_SeaBIOS_**. For **USB Controller,** select **_3.0 (nec XHCI)._** For **OS Install ISO,** select the ISO you uploaded / downloaded earlier (e.g., _/mnt/user/iso/AlienVault\_OSSIM\_64bits.iso_).

![](/posts/how-to-run-alienvault-ossim-as-a-vm-on-unraid/Screen-Shot-2021-10-01-at-1.50.01-PM-1024x857.png)

Next, select **_SATA_** as the **OS Install CDRom Bus**. Select where you would like the OSSIM VM virtual disk to be located and how large it should be under **Primary vDisk Location** (e.g., mine is located on a specific VM pool I made on an SSD). Select **_SATA_** again for **Primary vDisk Bus.** Leave everything else down to **Network MAC** as is. In the bottom left of the network pane, click the "+" to add another virtual network interface. For the new **2nd Network MAC**, I recommend copy+pasting the original MAC and changing the last number/letter to be different. Leave the rest of the settings as is.

## Start the VM

Save the configuration page and load the VM. From here, you should be able to follow the OSSIM install as you would in any other environment. The vDisk will be selected for install automatically unless you happen to add another disk above for your own configuration needs. When it comes time for the install to install the GRUB bootloader, it will fail. Continue with the install WITHOUT a bootloader when the install asks. Once the install completes and the VM restarts, you should be able to configure your OSSIM admin credentials!

## Wrapping Up

OSSIM is extremely powerful and can be complicated to use. If you are not already familiar with OSSIM, I recommend doing some intense Google searching about SIEM tools in general and specifically about configuration recommendations for OSSIM. It may be a little overkill for your Home Lab, but it is a valuable tool to be comfortable with for any security practitioner.

> As always, if you have any questions, feel free to post below or reach out to me at [robert@whitematter.tech](mailto:robert@whitematter.tech).
>
> Thanks for reading!
>
> Robert

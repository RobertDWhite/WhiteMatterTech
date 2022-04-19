---
title: "Xbox2Discord: How to Forward Audio from Xbox Live to Discord"
date: "2022-01-07"
categories:
  - "tutorials"
  - "windows"
tags:
  - "gaming"
cover:
    image: "/posts/xbox2discord-how-to-forward-audio-from-xbox-live-to-discord/xbox2discord-how-to-forward-audio-from-xbox-live-to-discord.jpg"
    alt: "XBOX + Discord Logo"
    caption: "<text>"
    relative: true
aliases:
    - /posts/xbox2discord-how-to-forward-audio-from-xbox-live-to-discord
    - /2022/xbox2discord-how-to-forward-audio-from-xbox-live-to-discord
    - /posts/Xbox2Discord
    - /2022/Xbox2Discord
---

If you game on PC, you probably have Discord installed to chat with your friends as you game. Discord has relatively decent audio, and it far surpasses the in-game chat capabilities built into most games.

When gaming cross-platform, however, you're stuck either using in-game chat or the tedious Xbox Companion app with limited controls and annoying party configs.

This post will show you how to configure a setup to forward audio from an Xbox party directly to Discord, and _visa versa_. This way, you can game with your Xbox friends and still use the far superior Discord.

I am running this setup on a Windows 10 VM on Unraid. I recommend using a VM on another PC or server that you are not gaming on for this setup.

## The Virtual Audio Cable

The [Virtual Audio Cable](https://vac.muzychenko.net/en/) (VAC) is the magic sauce for this setup. The biggest bummer with the VAC is that a home license is a $30 one time purchase. I went ahead and purchased the VAC because it is super useful in other applications too.

The VAC has a trial, but after 30 minutes, a voice talks in the background reminding you it is a trial.

Should you try the trial or purchase the software, please continue reading!

The setup is straightforward. You need to create two cables and click "Set" in the top left corner of the software. See the image below for how it should look. Basically, this will create two audio interfaces that can be used to route audio to different places in your OS.

![](/posts/xbox2discord-how-to-forward-audio-from-xbox-live-to-discord/images/Screen-Shot-2022-01-06-at-12.05.54-PM-1024x505.png)

Once you have the two cables created, you're done with this part!

## The XBox Console Companion App

Currently, I am using the [Xbox Console Companion App](https://www.microsoft.com/en-us/p/xbox-console-companion/9wzdncrfjbd8?activetab=pivot:overviewtab). I believe at this time that Microsoft is attempting to push this application by the wayside for their newer Xbox PC app, but I still prefer the [Xbox Console Companion](https://www.microsoft.com/en-us/p/xbox-console-companion/9wzdncrfjbd8?activetab=pivot:overviewtab) at this time.

Basically, you will want to create a new Xbox Live user that can be used to host Xbox parties with your Xbox friends. For example, you could create a user Xbox2Discord. Add all your friends who will want to cross-platform play with you.

In the app settings, select the Speaker source as "Line 1 (Virtual Audio Cable)". For microphone, select "Line 2 (Virtual Audio Cable)." See the image below.

![](/posts/xbox2discord-how-to-forward-audio-from-xbox-live-to-discord/images/Screen-Shot-2022-01-06-at-12.05.37-PM-1024x676.png)

The Xbox setup is simple too. Once the above is completed, you are ready to move over to Discord.

## Discord

For the Discord setup, I likewise recommend creating a new user, Xbox2Discord or something of the like, for this setup. Add this user to whatever server you would like the functionality to exist.

In Voice & Video settings in the Discord app, change the Input device to Line 1 (Virtual Audio Cable) and select Line 2 (Virtual Audio Cable). See the image below for the example.

![](/posts/xbox2discord-how-to-forward-audio-from-xbox-live-to-discord/images/Screen-Shot-2022-01-06-at-12.06.05-PM-1024x540.png)

Once the above is completed, you can use your new user to join your chat in your Discord server. Once your friends join the Xbox Live party of your Xbox user, you should now be able to hear and talk to your Xbox friends via Discord! See the image below.

![](/posts/xbox2discord-how-to-forward-audio-from-xbox-live-to-discord/images/Screen-Shot-2022-01-06-at-12.06.44-PM-368x1024.png)

## Conclusion

**Congratulations** if you made it this far and everything is working! I hope this tutorial aids you in your endeavors to improve your social gaming experience.

Special thanks to [Samuel Wallace](https://wallacelabs.tech) for dreaming with me and making the ins-and-outs of this project work.

> As always, if you have any questions, feel free to start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a GitHub](https://github.com/RobertDWhite/WhiteMatterTech/pulls) PR to recommend changes/fixes in the article, or reach out to me directly at [robert@whitematter.tech](mailto:robert@whitematter.tech).
>
> Thanks for reading!
>
> Robert

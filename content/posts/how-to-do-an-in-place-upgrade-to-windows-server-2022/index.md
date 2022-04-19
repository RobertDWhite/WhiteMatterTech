---
title: "How To Do An In-Place Upgrade To Windows Server 2022"
date: "2021-11-19"
categories:
  - "business"
  - "tips"
  - "tutorials"
  - "windows"
tags:
  - "server"
  - "upgrade"
  - "windows"
cover:
    image: "/posts/how-to-do-an-in-place-upgrade-to-windows-server-2022/how-to-do-an-in-place-upgrade-to-windows-server-2022.jpg"
    alt: "Windows Server 2022 Logo"
    caption: "<text>"
    relative: true
aliases:
    - /posts/how-to-do-an-in-place-upgrade-to-windows-server-2022/how-to-do-an-in-place-upgrade-to-windows-server-2022/
    - /2021/how-to-do-an-in-place-upgrade-to-windows-server-2022/
---

I recently had to upgrade two domain controllers to Windows Server 2022. The main controller was still on Windows Server 2016 while the secondary was Windows Server 2019. Both in-place upgrades went without issue.

Both servers were running _Hyper-V, Bitlocker, and AD Controller_. The 2019 server had an _SMTP server_ that it was running, but Microsoft has deprecated the SMTP stack and associated management tools, including the IIS tools. There very well may be other deprecated software or tools, and I highly recommend searching for specific functionality you utilize on your Win Servers before attempting the upgrade.

**_Reach out to my Microsoft Partner consulting company for the best prices on your Windows Server 2022 licenses and volume licenses. Otherwise, if you need a **_Microsoft Partner_**, hit us up._** **_Visit [wallaceandwhite.com](https://wallaceandwhite.com) or email us at [info@wallaceandwhite.com](mailto:info@wallaceandwhite.com)_**

# Instructions

1. **Backup your server**. I used Veeam.
2. Locate the Windows Server Setup media of the Win Server upgrade image, and then run setup.exe. 
3. Select **_Yes_** to start the setup process. For internet-connected devices, select the **_Download updates, drivers and optional features \[recommended\]_** option, and then, select **_Next_**.
4. Wait for the setup to check your device configuration, and then select _**Next**_.
5. Depending on the distribution channel from where you received your Windows Server media _(e.g., Retail, Volume License, OEM, ODM, etc.)_, you may be prompted to enter a licensing key to continue.
6. Select the Windows Server edition you want to install and select Next.
7. Select Accept to accept the terms of your licensing agreement, based on your distribution channel _(e.g., Retail, Volume License, OEM, ODM, etc)._
8. Select _**Keep personal files and apps**_ in order to do an in-place upgrade and then select **_Next_**.

After Setup analyzes your device, a prompt will appear to proceed with the upgrade by selecting **_Install_**.

The in-place upgrade starts and presents the _Upgrading Windows_ screen showing its progress. After the upgrade finishes, the server will restart.

# Conclusion

It can certainly be intimidating to make these upgrades on production machines that your teams or business rely on daily, but Microsoft made this particular upgrade path pretty straightforward. As always, be sure you have a backup of your server before attempting such an upgrade. Nonetheless, you likely will not need it.

**Congratulations** if you made it this far and everything is working! I hope this tutorial aids you in your endeavors to upgrade your servers to Windows Server 2022.

> As always, if you have any questions, feel free to start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a GitHub](https://github.com/RobertDWhite/WhiteMatterTech/pulls) PR to recommend changes/fixes in the article, or reach out to me directly at [robert@whitematter.tech](mailto:robert@whitematter.tech).
>
> Thanks for reading!
>
> Robert

---
ID: 177
post_title: Live Better with Circadian Lighting
post_name: live-better-with-circadian-lighting
author: Robert White
post_date: 2021-05-24 23:16:48
layout: post
link: >
  https://whitematter.tech/2021/live-better-with-circadian-lighting/
published: true
tags:
  - health
  - home-automation
  - iot
  - open-source
categories:
  - Home Automation
  - Tutorials
---
<!-- wp:paragraph -->
<p><strong>A Little Background and Some Thoughts</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"dropCap":true} -->
<p class="has-drop-cap">With today's technology, we are constantly bombarded with High Energy Visible (HEV) blue light from our screens as well as inconsistent lighting throughout the day within our homes and workplaces.  Like all mammalian species, we humans have our own circadian rhythms which occur naturally and are vitally important to our health and well-being. Rather than writing an essay on the importance of our natural circadian rhythms, check out the educational write-up from the <a href="https://www.nigms.nih.gov/education/fact-sheets/Pages/circadian-rhythms.aspx" title="https://www.nigms.nih.gov/education/fact-sheets/Pages/circadian-rhythms.aspx" target="_blank" rel="noreferrer noopener">NIH here</a>. Hopefully this will help explain the "why" of this particular post. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Use of Home Automation and open-source resources allows us to program our homes and lights to keep our natural rhythms aligned and consistent. This is an excellent use of technology to encourage a more natural environment, when technology often lends itself to the opposite effect (especially considering HEV blue light, etc.). </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>I whole-heartedly recommend this described home automation to better your health and your family's health, both mentally and physically. My wife and I are expecting our first child later this year. Evidence suggests that disruptions of the circadian rhythm of a prospective mother may have <a href="https://pubmed.ncbi.nlm.nih.gov/32210175/">negative implications for her offspring after birth.</a> Additionally, research suggests certain reasonable modifiable behaviors, <a href="https://www.nature.com/articles/s41398-020-0683-3" target="_blank" rel="noreferrer noopener">such as simply going to sleep earlier</a>, not only may positively impact a newborn child but also may protect against certain symptoms in the mother in the early postpartum period. There are hundreds of studies around circadian rhythms concerning the non-pregnant as well.  In my years of undergraduate/post-bacc work in psychology and neuroscience as well as my graduate training in medical school, we studied the positive impact of natural physical inclinations to one's overall physical and mental health. With the development and evolution of human life around a normal "sun-clock," we often reap benefit from tuning ourselves to our natural state and environment around us. Circadian Lighting can help your body stay in tune with the sun, even if you work third shift. Now, let's talk about how you can get this automation started for you and your family.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2><strong>Getting Started</strong></h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>This automation relies specifically on <a href="https://www.home-assistant.io/" target="_blank" rel="noreferrer noopener">Home Assistant</a>, a home automation platform designed to interact with your various smart-home devices from a single web-panel. You will need some smart lights <em>(I use and specifically recommend <a href="https://amzn.to/2QOnxs9" target="_blank" rel="noreferrer noopener" title="https://amzn.to/2QOnxs9">Philips Hue with a Hue Bridge</a>, though most other smart lights will probably work)</em>, a device to host Home Assistant <em>(like a <a href="https://amzn.to/34hK0kB" target="_blank" rel="noreferrer noopener">Raspberry Pi</a>, a Docker container, a NAS, or a PC of some sort)</em>, and finally, a little patience for the setup!</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><meta charset="utf-8"><em>As an Amazon Associate, I earn from qualifying purchases.</em> Thank you for<em> supporting the maintenance of this blog. The pricing will be the same for you regardless if you use my links or not! Thanks for your support!</em> </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Installing Home Assistant</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>There are many excellent tutorials on the web for installing/setting up Home Assistant. I will not cover this, but I will refer you instead to the official <a href="https://www.home-assistant.io/installation/" target="_blank" rel="noreferrer noopener" title="https://www.home-assistant.io/installation/">Home Assistant Documentation.</a></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Configuring Home Assistant and Installing Circadian Lighting</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>First, download Circadian Lighting. There are two options for this. <a href="https://github.com/robertomano24/circadian_lighting-hue" target="_blank" rel="noreferrer noopener" title="https://github.com/robertomano24/circadian_lighting-hue">Option 1</a> is recommended if you use Phillips Hue lights and have a Hue bridge. <a href="https://github.com/robertomano24/circadian_lighting" target="_blank" rel="noreferrer noopener" title="https://github.com/robertomano24/circadian_lighting">Option 2 </a>is recommended if you do not use Phillips Hue lights. For whichever option you choose, hit the link and click the green "Code" button near the top right of the screen. Choose to "Download Zip." Once the Zip is downloaded, use your favorite archive utility to extract the contents of the Zip.  </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>You then must make a folder within your Home Assistant config root folder called "<em>custom_components</em>" <em>(without the quotes)</em>. See the image below, as this folder should be in the same directory as the <em>configuration.yaml</em>. Inside the <em>custom_components</em> folder, make a folder called "<em>circadian_lighting</em>" <em>(without the quotes)</em>. Inside that folder, place the contents of the Zip (I.e., <em>___init___.py, manifest.json, sensor.py, services.yaml</em>, and <em>switch.py</em>). The structure should look like this: <em>config/custom_components/circadian_lighting/</em></p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":180,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/05/Screen-Shot-2021-05-24-at-10.14.06-PM-1-1024x272.png" alt="" class="wp-image-180"/><figcaption>Folder Structure Setup</figcaption></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>Next, we will need to modify the <em>configuration.yaml</em>. We need to add the following lines to the file:</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code># Example configuration.yaml entry
circadian_lighting:</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>Next, you will need to create a switch in Home Assistant, which will act as a controller to turn of Circadian Lighting if you want to use your color lights or change the brightness at some point. Here is an example:</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code># Example configuration.yaml entry
switch:
  - platform: circadian_lighting
    lights_ct:
      - light.desk
      - light.lamp</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>If you want, you can create multiple switches so you can turn Circadian Lighting off in one, two, or more rooms independently from the rest of your home. You must add your lights manually to each switch by adding the entity ID from Home Assistant. You can see my personal example of multiple switches on my <a href="https://github.com/robertomano24/home-assistant/blob/master/switch/circadian_lighting.yaml" target="_blank" rel="noreferrer noopener">Home Assistant GitHub repo</a>. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Hue Specific Setup (Option 1)</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The main difference between Option 1 and Option 2 mentioned above is that Option 1 allows you to have scenes set per room that can be assigned to a Hue switch, which lets you turn on your lights to the correct Circadian Lighting value. In each room where you would like to turn on the Circadian Light scene with a Hue switch/dimmer, you will need a scene in that room called "Circadian" without quotes. The "C" must be capitalized. I use the<a href="https://iconnecthue.com/" target="_blank" rel="noreferrer noopener"> iConnectHue app</a> on my iPhone to make these scenes. Different apps may not appropriately make the scenes, and I recommend iConnectHue anyway. In a room, like Kitchen, add a scene with the bulbs you would like to be turned on with your switch. The color/brightness values do not matter as this plugin will overwrite them. Create the Circadian scene and assign the scene to your switch (see the images below for screenshots of my iConnectHue app setup).</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":182,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/05/IMG_0311-473x1024.jpeg" alt="" class="wp-image-182"/><figcaption>Kitchen Lights Example</figcaption></figure>
<!-- /wp:image -->

<!-- wp:image {"id":183,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/05/IMG_0312-1-473x1024.jpeg" alt="" class="wp-image-183"/><figcaption>Created Scene Example</figcaption></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>There you have it! Once the scene is setup (for Option 1, only), your setup is complete! Option 2 will be complete too! The last thing to do is restart your Home Assistant instance, and your Circadian Lights will be keeping your rhythm in sync with nature! For advanced setup ideas, check out the "<a href="https://github.com/claytonjn/hass-circadian_lighting/issues" target="_blank" rel="noreferrer noopener">Issues</a>" on GitHub.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Wrapping Up</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>I hope this post was helpful getting your Circadian Lighting plugin working. I truly believe it will aid the physical and mental health of you and your family. If you have any issues, questions, or something was not clear in this post, please comment below, email me at <a href="mailto:robert@whitematter.tech" target="_blank" rel="noreferrer noopener" title="mailto:robert@whitematter.tech">robert@whitematter.tech,</a> or make an "Issue" on GitHub. Since you have IoT devices on your network, be sure to check out the <a href="https://whitematter.tech/2021/how-to-add-vlan-segmentation-for-homekit-iot-devices-with-unifi/" target="_blank" rel="noreferrer noopener">post on securing your network with VLANs</a> </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Thanks for reading!</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong><em>Note: For your first launch with the plugin installed, you may need to turn on the Switch(s) manually. On your Home Assistant Dashboard, you can add entities to your home page like the image below. Once added, you can flip the switch to enable Circadian Lighting for those lights!</em></strong></p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":184,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://whitematter.tech/wp-content/uploads/2021/05/Screen-Shot-2021-05-24-at-11.09.04-PM.png" alt="" class="wp-image-184"/><figcaption>CL Switches on Home Assistant Dashboard</figcaption></figure>
<!-- /wp:image -->
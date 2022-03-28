---
title: "Migrating from Wordpress to Hugo"
date: "2022-03-20"
categories:
  - "webhosting"
  - "tutorials"
tags:
  - "webhost"
  - "wordpress"
  - "hugo"
  - "tutorials"
cover:
    image: "/posts/migrating-from-wordpress-to-hugo/wordpress_to_hugo.png"
    alt: "WP->Hugo"
    caption: "<text>"
    relative: true
---
# Introduction
When I initially began posting publicly on this site, my goal was to be able to host my site fully with Docker for containerization. I hadn't experienced any other decent blogging platform besides WordPress at the time, and I was bent on getting WordPress self-hosted with Docker.

This goal was achieved, and [my first public post](https://whitematter.tech/posts/hosting-your-own-site-with-traefik-and-wordpress/hosting-your-own-site-with-traefik-and-wordpress/) details how I used docker-compose to deploy my blog using containers for WordPress and Traefik.

# My Reasons For Leaving WordPress
The WordPress container setup was successful and effective for the better part of a year, but as I gained readers, I also gained an exorbitant amount of spam inundating my WordPress Dashboard. This quickly became an unworkable solution, even with the copious number of spam blocker plugins enabled like Akismet.

My reasons for leaving are no different than the rest of the random posts you can find on the issue throughout the Internet. Specifically, I attribute my exodus to the following: **Speed, Security, and Spam.**

### Speed
The speed difference is mostly due to the differences in the way WordPress processes requests via PHP. Since WordPress is written in PHP, each request queries the WP Database to grab all the associated files with the request to render an HTML file. Only then is this HTML file returned to your browser. In Hugo, a site is built on pre-rendered HTML, which has no comparison in speed. Loading my old site one last time before the full cutover was painfully slow after testing the Hugo rendering.
### Security
WordPress is generally safe enough, and I never had any caught suspicious traffic beyond the usual bots blocked by my IPS. However, I was informed a few months before my switch that a plugin I was using, which was reputable and developed by a professional team, was susceptible to a cross-site scripting (XSS) attack. Though I promptly removed that plugin, I was still disturbed enough to Google "WordPress plugin vulnerabilities."
### Spam
This one I already mentioned above, but it was so irritating that I think it warrants its own section. No kidding, I would get upwards of 1000 spam messages a day, even with every reputable spam blocker plugin I could find enabled. I missed some valuable conversations with readers because they were lost in the sea of spam. I will truly not miss the spam.

# Converting from Wordpress Pages & Posts to Markdown
The first step requires you to export your WordPress site to XML. This process is straightforward. Check out [WordPress's official documentation about how exactly to do this](https://wordpress.org/support/article/tools-export-screen/). This will export your entire site. Be sure to select "All content" in order to include images and posts.

The tool I ultimately chose to convert WordPress content to Markdown was the appropriately named [wordpress-export-to-markdown](https://github.com/lonekorean/wordpress-export-to-markdown). You will need [NodeJS](https://nodejs.org/en/) and your [WordPress export](https://wordpress.org/support/article/tools-export-screen/) to use this tool. To use [wordpress-export-to-markdown](https://github.com/lonekorean/wordpress-export-to-markdown), check out the [GitHub repo](https://github.com/lonekorean/wordpress-export-to-markdown) for the project and follow the instructions on the repo.

# Install Hugo
There are many great official instructions on installing Hugo. Check out the [Hugo Install Guide](https://gohugo.io/getting-started/installing/). There are instructions for most major OSs, and you can even find instructions for running [Hugo in Docker](https://schoolofsoftware.com/Docker/Hugo).

# Generate Site Structure & Choose a Theme
Once installed, you will need to have your files ready to go in a working directory. I recommend making a folder **"hugo"**. In **hugo**, create a folder called **content**. Add your post MD files to **hugo/content**. Hugo will take your MD files from **hugo/content** and automatically generate them as posts/blog-posts/etc..

Here, I recommend going to my [GitHub repo for WhiteMatter.tech](https://github.com/RobertDWhite/WhiteMatterTech) and looking at how I have structured my Hugo site as an example. Check out [themes.gohugo.io](https://themes.gohugo.io/) for themes, and follow the instructions on the theme on how to setup your **config.toml** or, as in my case, **config.yml**. You can find [my theme files on GitHub](https://github.com/RobertDWhite/hugo-PaperMod-WhiteMatterMod), which are a customized fork of [PaperMod](https://github.com/adityatelange/hugo-PaperMod).

# Run a Dev Build of Your Site
Once your theme, content, and other files are in place, you can run
```
hugo server -D
```
This will generate a site accessible by going to [http://localhost:1313](http://localhost:1313) in your webbrowser on the same machine from which you ran that command.
# Build Your Static Public Folder
Once you are finished modifying your site and are happy with the outcome, you can finally run the command to build your site's **hugo/public** folder.
```
hugo
```
Yes, that is all! Just run that command and your public folder will be generated.

# Serve Your site
Nice work! If you have made it this far with a filled **hugo/public** folder, you are ready to serve your site. There are an unlimited number of ways to do this.
A popular method is [GitHub Pages](https://pages.github.com/), which allows you to host your static site directly from a GitHub repo.
I chose to host my site with a local Docker image since I already had the infrastructure in place from my previous [WordPress/Traefik setup](https://whitematter.tech/posts/hosting-your-own-site-with-traefik-and-wordpress/hosting-your-own-site-with-traefik-and-wordpress/).
Essentially, though, you just need to serve your **hugo/public** folder. Check out how I did that below.
# Optional: Serve Your Site With Docker

### Download the docker-compose.yml with curl
```
curl -LJO https://raw.githubusercontent.com/RobertDWhite/hugo-webserver-docker/main/docker-compose.yml
```

### Download the docker-compose.yml with wget
```
wget --no-check-certificate --content-disposition https://raw.githubusercontent.com/RobertDWhite/hugo-webserver-docker/main/docker-compose.yml
```

Or you can create your own docker-compose.yml and add the following:
```
version: "3"
services:
  nginx:
    image: nginx:latest
    ports:
      - 80:80
    volumes:
      - /path/to/hugo/public:/usr/share/nginx/html
```
Be sure you change the **/path/to/hugo/public** to your full path pointing to your **hugo/public** folder.
Once you have your docker-compose.yml, run the following:
```
docker-compose up -d
```
Once you have your port 80 forwarded to you host running Docker, your site should be live to the public!

If you choose to go this route, you might consider setting up a reverse proxy with Docker as well. You can see my post on how to accomplish this here: [How to Easily Run A Reverse Proxy using Docker](https://whitematter.tech/posts/run-a-reverse-proxy-using-docker/run-a-reverse-proxy-using-docker/)

Additionally, you should consider taking security measure to harden your network. See more about that below at [Self-Hosting Security](https://whitematter.tech/migrating-from-wordpress-to-hugo/#self-hosting-security).

I like this method the best because I am able to re-run the following:
```
hugo
```
to re-build my site any time I make changes that need published, and the Docker container updates in real-time automatically. That way, I do not have to re-configure my server with updated static site files anytime there is a change.

# Self-Hosting Security
If you choose to host your site from within your network, I recommend taking a look at a couple of my older posts. Specifically, check out [How to Harden Your Network Security for Your In-Home Web Hosting](https://whitematter.tech/posts/network-hardening-webhosting/)

# Wrapping Up

I hope this post was helpful getting WordPress migrated to Hugo. If you have any issues, questions, or something was not clear in this post, email me at [robert@whitematter.tech,](mailto:robert@whitematter.tech "mailto:robert@whitematter.tech") or make an ["Issue" on GitHub or start a "Discussion" on GitHub](https://github.com/RobertDWhite/WhiteMatterTech).

**Thanks for reading!**

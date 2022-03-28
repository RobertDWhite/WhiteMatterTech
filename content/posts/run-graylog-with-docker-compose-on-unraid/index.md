---
title: "Run Graylog with Docker Compose on Unraid"
date: "2022-03-28"
categories:
  - "docker"
  - "security"
  - "tutorials"
  - "unraid"
tags:
  - "docker"
  - "open-source"
  - "security"
  - "tutorials"
  - "unraid"
cover:
    image: "/posts/run-graylog-with-docker-compose-on-unraid/images/graylog-and-unraid.png"
    alt: "Graylog & Unraid Logo"
    caption: "<text>"
    relative: true
aliases:
    - /posts/run-graylog-with-docker-compose-on-unraid/run-graylog-with-docker-compose-on-unraid
    - /2022/run-graylog-with-docker-compose-on-unraid
    - /2022/03/run-graylog-with-docker-compose-on-unraid
---

--------------------------------------------------
# Introduction

Logging and traffic monitoring are of utmost importance in information security. Having searchable stored logs can allow visibility into a variety of critical activities related to a data breach.

For example, individual computer event logs can provide insight into an attacker's lateral movement within an environment. Active Directory authentication logs can provide more detail into this lateral movement and even help to establish a timeline of this movement. Firewall logs can provide insight into an attacker's first contact or the first time an attacker utilized a particular command or control domain. NetFlow logs allow visibility into how a user interacts with other devices internally.

While there are many more examples of logging techniques providing critical data, especially in the event of a breach, the aforementioned logging methods highlight the importance of logging and retaining these data.

My goal is not to provide a thesis concerning logging and monitoring. I highly recommend taking a closer look at some of the theoretical and pragmatic reasons for logging in a systems security environment.

--------------------------------------------------
# Graylog

Graylog provides a powerful open-source solution for log management that perfectly suits our needs for our homelab environment and beyond. I certainly do not want to diminish how powerful and capable Graylog is. Graylog is more than suitable for enterprise environments and has more [enterprise-friendly offerings](https://www.graylog.org/products/enterprise) available as well.
For our needs running on Unraid, however, the open-source version will be more than sufficient.

Graylog has been notoriously difficult to get running successfully on Unraid in the past. Docker Compose eliminates many of the issues that complicated the install in the past, and therefore, we will be using Docker Compose on Unraid to alleviate these issues and get a working Graylog instance.

--------------------------------------------------
# Prepping Unraid

In order to use this particular setup, you will first need to install **Docker Compose Manager**. You can install **Docker Compose Manager** on Unraid from the _Community Applications_ page. Simply search _"Docker Compose Manager"_ and install the package from _"dcflachs"_. Check out the [forum post for Docker Compose here](https://forums.unraid.net/topic/114415-plugin-docker-compose-manager/). See the image below.

_**Note:** At the time of this writing, Unraid's Docker Compose implementation is in beta, but I have been using it since it first launched. I have **NEVER** had any issues on my Unraid system due to Docker Compose. Nonetheless, it is a good idea to always have backups and parity in place before dealing with beta products specifically._
![](/posts/run-graylog-with-docker-compose-on-unraid/images/docker-compose-CA.png)

Once installed, we can move to the fun part.

--------------------------------------------------
# Configuring a Docker Compose Stack on Unraid

This step will require that you have Docker enabled on your Unraid host. If you have not yet done this, I highly recommend checking out [Unraid's Wiki](https://wiki.unraid.net/Manual/Docker_Management) for more information about how Docker is implemented in Unraid and how to enable it on your system.

Once enabled, go to **"Docker"** in your menu. Scroll to the bottom of the page, and you should see a **"Compose"** section if your install went correctly above.

Select **ADD NEW STACK** and name the stack something obvious like _"graylog"_, like shown in the image below.
![](/posts/run-graylog-with-docker-compose-on-unraid/images/add-new-stack.png)

Next, click the gear icon next to your _"graylog"_ stack, and select **EDIT STACK**. I new large text edit box should appear, and you will see something like **"Editing /boot/config/plugins/compose.manager/projects/graylog/compose.yml"**. Copy and paste the code below into the box:

```
version: "3.8"

services:
  mongodb:
    image: "mongo:5.0"
    volumes:
      - "/your/unraid/path/here:/data/db"
    restart: "on-failure"

  elasticsearch:
    environment:
      ES_JAVA_OPTS: "-Xms1g -Xmx1g -Dlog4j2.formatMsgNoLookups=true"
      bootstrap.memory_lock: "true"
      discovery.type: "single-node"
      http.host: "0.0.0.0"
      action.auto_create_index: "false"
    image: "docker.elastic.co/elasticsearch/elasticsearch-oss:7.10.2"
    ulimits:
      memlock:
        hard: -1
        soft: -1
    volumes:
       - "/your/unraid/path/here:/usr/share/elasticsearch/data"
    restart: "on-failure"

  graylog:
    image: "graylog/graylog:4.2"
    depends_on:
      elasticsearch:
        condition: "service_started"
      mongodb:
        condition: "service_started"
    entrypoint: "/usr/bin/tini -- wait-for-it elasticsearch:9200 --  /docker-entrypoint.sh"
    environment:
      GRAYLOG_TIMEZONE: "America/New_York"
      TZ: "America/New_York"
      GRAYLOG_NODE_ID_FILE: "/usr/share/graylog/data/config/node-id"
      GRAYLOG_PASSWORD_SECRET: "enter secret here"
      GRAYLOG_ROOT_PASSWORD_SHA2: "enter SHA2 of secret here"
      GRAYLOG_HTTP_BIND_ADDRESS: "0.0.0.0:9000"
      GRAYLOG_HTTP_EXTERNAL_URI: "http://localhost:9000/"
      GRAYLOG_ELASTICSEARCH_HOSTS: "http://elasticsearch:9200"
      GRAYLOG_MONGODB_URI: "mongodb://mongodb:27017/graylog"

    ports:
    - "5044:5044/tcp"   # Beats
    - "5140:5140/udp"   # Syslog
    - "5140:5140/tcp"   # Syslog
    - "5555:5555/tcp"   # RAW TCP
    - "5555:5555/udp"   # RAW TCP
    - "9000:9000/tcp"   # Server API
    - "12201:12201/tcp" # GELF TCP
    - "12201:12201/udp" # GELF UDP
    - "10000:10000/tcp" # Custom TCP port
    - "10000:10000/udp" # Custom UDP port
    - "13301:13301/tcp" # Forwarder data
    - "13302:13302/tcp" # Forwarder config
    volumes:
      - "/your/unraid/path/here:/usr/share/graylog/data/data"
      - "/your/unraid/path/here:/usr/share/graylog/data/journal"
    restart: "on-failure"
volumes:
  mongodb_data:
  es_data:
  graylog_data:
  graylog_journal:
```

--------------------------------------------------
**Your Unraid should look like the image below:**
![](/posts/run-graylog-with-docker-compose-on-unraid/images/edit-stack.png)

Before saving, you will need to edit _Lines 7, 23, 59, and 60_. Replace the entire _**/your/unraid/path/here**_ with the full path to where you would like to store Graylog files. For example, I used  _**/mnt/disk7/graylog/mongodb_data**_ for _Line 7_, _**/mnt/disk7/graylog/es_data**_ for _Line 23_, _**/mnt/disk7/graylog/graylog_data**_ for _Line 59_, and _**/mnt/disk7/graylog/graylog_journal**_ for _Line 60_.

Notice you do not change or modify the " **:** " or anything after it. For example, the full _Line 7_ would look like _**"/mnt/disk7/graylog/mongodb_data:/data/db"**_ in my example.

In my specific use case, I wanted Graylog to be stored on a particular disk outside of my cache drive for longer term storage. Additionally, I did not want to eat up Docker image storage or cache storage in general, and putting all the Graylog logs on a another disk made the most sense.

_**Important Note:** **DO NOT** put all of the folders in the same subdirectory. You can see I used **/mnt/disk7/graylog** as the root of the Graylog data, but each volume in the Docker Compose has its own subdirectory. Putting ALL of the Graylog volumes in the same subdirectory may have unintended detrimental consequences. I am not even sure it will run. Nonetheless, avoid it._

**Finally**, before saving, you must create a password and a SHA2 hash of the password. These values go on _Lines 38 and 39_ respectively. For this, I actually used another Docker container on Unraid called CyberChef _(mpepping/cyberchef)_. You also can use terminal on Unraid. Click the Terminal icon on Unraid in the top right of the menu. Copy and Paste the following:
```
echo -n "Enter Password: " && head -1 </dev/stdin | tr -d '\n' | sha256sum | cut -d" " -f1
```
Click **Enter**, and you will be prompted to enter the password you will use for Graylog (which should go on _Line 38_). One you enter your password, click **Enter** again, and Terminal should output the required SHA2 hash of your password. Copy that hash and paste it in _Line 39_ of the docker-compose.yml on Unraid. See the image below for an example of this step.
![](/posts/run-graylog-with-docker-compose-on-unraid/images/sha2-gen.png)

**FINALLY**, click **SAVE CHANGES** at the top.

--------------------------------------------------
# Start the Stack - Compose Up
Now, you can click **COMPOSE UP** under **Commands** associated with your _graylog_ stack. This is the equivalent of the traditional Docker Compose command:
```
docker-compose up -d
```
You should now see a new popup called **"Stack graylog Up"**, and you should observe Docker Compose looking for and pulling missing images. Once all the required files are obtained, the final ouput should be similar to the following:
```
Container graylog-mongodb-1 Running
Container graylog-elasticsearch-1 Running
Container graylog-graylog-1 Running
```
If you see this, you have successfully launched your Graylog containers including the required Docker networking and dependencies for your Unraid host.

You should now see your three containers at the top of your running containers list on Unraid in the Docker menu. See the image below for an example:
![](/posts/run-graylog-with-docker-compose-on-unraid/images/graylog-up.png)

You can now go to your Unraid's IP at port 9000 to access your Graylog instance _(e.g., 172.16.1.10:9000)_. Login with the username **admin** and the **yourpassword** you added to _Line 38_ _(e.g., NOT your SHA2 hash)_.
![](/posts/run-graylog-with-docker-compose-on-unraid/images/graylog-welcome.png)

--------------------------------------------------
# Bonus: Send Other Unraid Container Syslogs to Graylog
The first step required to send syslog to Graylog is to enable Syslog TCP incoming connections on Graylog. To do this, select **System / Inputs** on the Graylog interface, then choose **Inputs**. In the **Select input** dropdown box, scroll to _**Syslog TCP**_. Click **Launch new input**.

Give your input a nice title, and change the incoming port from _514_ to _5140_. You can leave everything else as default unless you know what you are doing. Scroll to the bottom and select **Save**.
![](/posts/run-graylog-with-docker-compose-on-unraid/images/graylog-tcp.png)

Now, back on Unraid, go to a running container and edit it or add a new container for whatever you would like.

Under **"Extra Parameters"**, customize the code below and paste it into the **Extra Parameters** box after any other parameters that are already there.
```
--log-driver=syslog --log-opt tag="varken" --log-opt syslog-address=tcp://YOUR_GRAYLOG_IP:5140
```
Change _**varken**_ to be the descriptive name of the container you are using. Change **YOUR_GRAYLOG_IP** to the IP you used to access your Graylog instance.

Scroll to the bottom of the container config and click **SAVE**. If all goes well and your network is allowing the communications to succeed, your container should be up, and the syslog for that container should be forwarding to your Graylog instance!
![](/posts/run-graylog-with-docker-compose-on-unraid/images/graylog-varken.png)


# Wrapping Up
I hope this post was helpful getting Graylog running on Unraid. If you have any issues, questions, or something was not clear in this post, please comment below, email me at [robert@whitematter.tech,](mailto:robert@whitematter.tech "mailto:robert@whitematter.tech") or make an "Issue" on [GitHub](https://github.com/RobertDWhite/WhiteMatterTech).

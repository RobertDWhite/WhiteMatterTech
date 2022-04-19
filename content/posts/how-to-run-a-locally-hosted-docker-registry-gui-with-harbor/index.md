---
title: "How to Run a Locally Hosted Docker Registry GUI with Harbor"
date: "2021-10-04"
categories:
  - "docker"
  - "tutorials"
tags:
  - "docker"
  - "docker-compose"
  - "harbor"
  - "registry"
cover:
    image: "/posts/how-to-run-a-locally-hosted-docker-registry-gui-with-harbor/harbor.png"
    alt: "Harbor Logo"
    caption: "<text>"
    relative: true
aliases:
    - /posts/how-to-run-a-locally-hosted-docker-registry-gui-with-harbor/how-to-run-a-locally-hosted-docker-registry-gui-with-harbor
    - /2021/how-to-run-a-locally-hosted-docker-registry-gui-with-harbor/
---

For this post, I will show you how to easily run a Docker Registry GUI with Harbor. I am running Docker on a Ubuntu VM. Therefore, my registry will be run through Docker, and the container will reside on a Ubuntu VM. This tutorial will use docker-compose to build the required containers.

## Download and Expand the Harbor Installer

```
wget https://github.com/goharbor/harbor/releases/download/v2.3.1/harbor-offline-installer-v2.3.1.tgz

tar -xzf harbor-offline-installer-v2.3.1.tgz

cd harbor/
```
## Generate SSL Certs - INTERNAL ONLY

These steps should only be taken if you plan to use your registry internally. If you plan to host your registry for external access, you should obtain certs from a trusted CA to use. With that said, these steps will work on a Linux host only (if you are using Windows, you could use [WSL](https://docs.microsoft.com/en-us/windows/wsl/install) to follow these steps).

Open up a Terminal and copy+paste the following commands. Be sure to replace all the red text with your own organization's name and information.

Additionally, pay specific attention to the **_cat_** command where **_\[alt\_names\]_** occurs. You will need to replace DNS.1, DNS.2, and DNS.3 to match the local IP or FQDN of the host machine. For example, if your machine's name is "_hostname_" and your network domain is "_.local_," you would want to use _hostname.local_ and _hostname_ as your DNS entries. If the machine's IP is static, you could also include the IP. If you do not need all three DNS entries, you can delete whichever are not needed. _Note:_ If you have trouble successfully generating the harbor/v3.txt file with the cat command for some reason, you can download a pre-created file at [GitHub](https://github.com/RobertDWhite/harbor-registry/blob/main/v3.ext).

Once the certs are created, save them so that you can add the certs as **_"trusted"_** on whatever machines you plan to use to access the registry.

{{< gist RobertDWhite 2bc7ca378480bd141a72f7f19993cc20 >}}

## Preparing for Install

To simplify your install, I have hosted the [docker-compose.yml](https://github.com/RobertDWhite/harbor-registry) I use to deploy my registry and harbor: [GitHub](https://github.com/RobertDWhite/harbor-registry). The [docker-compose.yml](https://github.com/RobertDWhite/harbor-registry) file should go in the harbor directory created above. If you followed my commands above, your Terminal should already be in the correct directory. You can easily pull this [docker-compose.yml](https://github.com/RobertDWhite/harbor-registry) with cURL or wget by running the commands below:

```
curl -LJO [https://raw.githubusercontent.com/RobertDWhite/harbor-registry/main/docker-compose.yml](http://curl -LJO https://raw.githubusercontent.com/RobertDWhite/harbor-registry/main/docker-compose.yml "https://raw.githubusercontent.com/robertomano24/nginx-proxy-manager/main/docker-compose.yml")
```

OR

```
wget --no-check-certificate --content-disposition [https://raw.githubusercontent.com/RobertDWhite/harbor-registry/main/docker-compose.yml](https://raw.githubusercontent.com/RobertDWhite/harbor-registry/main/docker-compose.yml)
```

If you prefer to create your [docker-compose.yml](https://github.com/RobertDWhite/harbor-registry "https://raw.githubusercontent.com/RobertDWhite/harbor-registry/main/docker-compose.yml") file yourself, make a file named “[docker-compose.yml](https://github.com/RobertDWhite/harbor-registry)” and add the contents of the [GitHub](https://github.com/RobertDWhite/harbor-registry) link to the file.

## Installing the Registry and Harbor

Now, everything should be in place to run docker-compose and build-out successfully. To do this, run the following:

```
docker-compose up -d
```

This may take a few minutes, but when you are finished, you should have successfully running containers for your Docker Registry and Harbor (the registry GUI). You should now be able to access the Harbor GUI from a web browser at https://hostname, https://hostname.local, or https://IP\_OF\_HOST if you have the SSL certs **_"trusted."_**

## Administrating Harbor

I will not go into detail about the administration of Harbor, but I will point you to Harbor's official documentation which contains a wealth of knowledge: [https://goharbor.io/docs/2.3.0/administration/](https://goharbor.io/docs/2.3.0/administration/)

## Wrapping-Up

If you were able to make it through all the steps above, you should be able to push to and pull from your registry. You will definitely want to look up information about how to tag images and containers in Docker.

> As always, if you have any questions, feel free to start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a GitHub](https://github.com/RobertDWhite/WhiteMatterTech/pulls) PR to recommend changes/fixes in the article, or reach out to me directly at [robert@whitematter.tech](mailto:robert@whitematter.tech).
>
> Thanks for reading!
>
> Robert

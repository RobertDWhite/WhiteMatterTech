---
ID: 229
post_title: >
  How to Run a Locally Hosted Docker
  Registry GUI with Harbor
post_name: >
  how-to-run-a-locally-hosted-docker-registry-gui-with-harbor
author: Robert White
post_date: 2021-10-04 01:41:50
layout: post
link: >
  https://whitematter.tech/2021/how-to-run-a-locally-hosted-docker-registry-gui-with-harbor/
published: true
tags:
  - docker
  - docker-compose
  - harbor
  - registry
categories:
  - Docker
  - Tutorials
---
<!-- wp:paragraph {"dropCap":true} -->
<p class="has-drop-cap">For this post, I will show you how to easily run a Docker Registry GUI with Harbor. I am running Docker on a Ubuntu VM. Therefore, my registry will be run through Docker, and the container will reside on a Ubuntu VM. This tutorial will use docker-compose to build the required containers. </p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Download and Expand the Harbor Installer</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><code>wget https://github.com/goharbor/harbor/releases/download/v2.3.1/harbor-offline-installer-v2.3.1.tgz</code> </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><code>tar -xzf harbor-offline-installer-v2.3.1.tgz</code>\</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><code>cd harbor/</code></p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Generate SSL Certs - INTERNAL ONLY</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>These steps should only be taken if you plan to use your registry internally. If you plan to host your registry for external access, you should obtain certs from a trusted CA to use. With that said, these steps will work on a Linux host only (if you are using Windows, you could use <a href="https://docs.microsoft.com/en-us/windows/wsl/install" target="_blank" rel="noreferrer noopener">WSL</a> to follow these steps). </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Open up a Terminal and copy+paste the following commands. Be sure to replace all the <span class="has-inline-color has-vivid-red-color">red</span> text with your own organization's name and information. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Additionally, pay specific attention to the <strong><em>cat</em></strong> command where <strong><em>[alt_names]</em></strong> occurs. You will need to replace DNS.1, DNS.2, and DNS.3 to match the local IP or FQDN of the host machine. For example, if your machine's name is "<em>hostname</em>" and your network domain is "<em>.local</em>," you would want to use <em>hostname.local </em>and <em>hostname</em> as your DNS entries. If the machine's IP is static, you could also include the IP. If you do not need all three DNS entries, you can delete whichever are not needed. <em>Note: </em>If you have trouble successfully generating the harbor/v3.txt file with the cat command for some reason, you can download a pre-created file at <a href="https://github.com/RobertDWhite/harbor-registry/blob/main/v3.ext" target="_blank" rel="noreferrer noopener">GitHub</a>. </p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Once the certs are created, save them so that you can add the certs as <strong><em>"trusted"</em></strong> on whatever machines you plan to use to access the registry. </p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>openssl genrsa -out ca.key 4096


openssl req -x509 -new -nodes -sha512 -days 3650 \
 -subj "C=<span class="has-inline-color has-vivid-red-color">US</span>/ST=<span class="has-inline-color has-vivid-red-color">STATE</span>/L=<span class="has-inline-color has-vivid-red-color">LOCATION</span>/O=<span class="has-inline-color has-vivid-red-color">ORGANIZATION</span>/OU=Dev/CN=registry" \
 -key ca.key \
 -out ca.crt


openssl genrsa -out <span class="has-inline-color has-vivid-red-color">ORGNAME</span>.com.key 4096


openssl req -sha512 -new \
 -subj "C=<span class="has-inline-color has-vivid-red-color">US</span>/ST=<span class="has-inline-color has-vivid-red-color">STATE</span>/L=<span class="has-inline-color has-vivid-red-color">LOCATION</span>/O=<span class="has-inline-color has-vivid-red-color">ORGANIZATION</span>/OU=Dev/CN=registry" \
 -key <span class="has-inline-color has-vivid-red-color">ORGNAME</span>.com.key \
 -out <span class="has-inline-color has-vivid-red-color">ORGNAME</span>.com.csr


cat &gt; v3.ext &lt;&lt;-EOF
     authorityKeyIdentifier=keyid,issuer
     basicConstraints=CA:FALSE
     keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
     extendedKeyUsage = serverAuth
     subjectAltName = @alt_names

     &#91;alt_names]
     DNS.1=<span class="has-inline-color has-vivid-red-color">hostname.ORGNAME.com</span>
     DNS.2=<span class="has-inline-color has-vivid-red-color">hostname.ORGNAME.local</span>
     DNS.3=<span class="has-inline-color has-vivid-red-color">hostname</span>
     EOF


openssl x509 -req -sha512 -days 3650 \
    -extfile v3.ext \
    -CA ca.crt -CAkey ca.key -CAcreateserial \
    -in <span class="has-inline-color has-vivid-red-color">ORGNAME</span>.com.csr \
    -out <span class="has-inline-color has-vivid-red-color">ORGNAME</span>.com.crt


sudo cp <span class="has-inline-color has-vivid-red-color">ORGNAME</span>.com.crt /data/cert/
sudo cp <span class="has-inline-color has-vivid-red-color">ORGNAME</span>.com.key /data/cert/


openssl x509 -inform PEM -in <span class="has-inline-color has-vivid-red-color">ORGNAME</span>.com.crt -out <span class="has-inline-color has-vivid-red-color">ORGNAME</span>.com.cert


sudo cp <span class="has-inline-color has-vivid-red-color">ORGNAME</span>.com.cert /etc/docker/certs.d/<span class="has-inline-color has-vivid-red-color">ORGNAME</span>.com/
sudo cp <span class="has-inline-color has-vivid-red-color">ORGNAME</span>.com.key /etc/docker/certs.d/<span class="has-inline-color has-vivid-red-color">ORGNAME</span>.com/
sudo cp ca.crt /etc/docker/certs.d/<span class="has-inline-color has-vivid-red-color">ORGNAME</span>.com/
</code></pre>
<!-- /wp:code -->

<!-- wp:heading -->
<h2>Preparing for Install</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>To simplify your install, I have hosted the&nbsp;<a href="https://github.com/RobertDWhite/harbor-registry">docker-compose.yml</a>&nbsp;I use to deploy my registry and harbor:&nbsp;<a href="https://github.com/RobertDWhite/harbor-registry" target="_blank" rel="noreferrer noopener">GitHub</a>. The <a href="https://github.com/RobertDWhite/harbor-registry" target="_blank" rel="noreferrer noopener">docker-compose.yml </a>file should go in the harbor directory created above. If you followed my commands above, your Terminal should already be in the correct directory. You can easily pull this&nbsp;<a href="https://github.com/RobertDWhite/harbor-registry">docker-compose.yml</a>&nbsp;with cURL or wget by running the commands below:</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><code>curl -LJO&nbsp;<a href="http://curl -LJO&nbsp;https://raw.githubusercontent.com/RobertDWhite/harbor-registry/main/docker-compose.yml" title="https://raw.githubusercontent.com/robertomano24/nginx-proxy-manager/main/docker-compose.yml">https://raw.githubusercontent.com/RobertDWhite/harbor-registry/main/docker-compose.yml</a></code></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>OR</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><code>wget --no-check-certificate --content-disposition&nbsp;<a href="https://raw.githubusercontent.com/RobertDWhite/harbor-registry/main/docker-compose.yml">https://raw.githubusercontent.com/RobertDWhite/harbor-registry/main/docker-compose.yml</a></code></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If you prefer to create your&nbsp;<a href="https://github.com/RobertDWhite/harbor-registry" title="https://raw.githubusercontent.com/RobertDWhite/harbor-registry/main/docker-compose.yml">docker-compose.yml</a>&nbsp;file yourself, make a file named “<a href="https://github.com/RobertDWhite/harbor-registry">docker-compose.yml</a>” and add the contents of the <a href="https://github.com/RobertDWhite/harbor-registry" target="_blank" rel="noreferrer noopener">GitHub</a> link to the file.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Installing the Registry and Harbor </h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Now, everything should be in place to run docker-compose and build-out successfully. To do this, run the following:</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><code>docker-compose up -d</code></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>This may take a few minutes, but when you are finished, you should have successfully running containers for your Docker Registry and Harbor (the registry GUI). You should now be able to access the Harbor GUI from a web browser at https://hostname, https://hostname.local, or https://IP_OF_HOST if you have the SSL certs <strong><em>"trusted."</em></strong></p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Administrating Harbor</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>I will not go into detail about the administration of Harbor, but I will point you to Harbor's official documentation which contains a wealth of knowledge: <a href="https://goharbor.io/docs/2.3.0/administration/" target="_blank" rel="noreferrer noopener">https://goharbor.io/docs/2.3.0/administration/</a></p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Wrapping-Up</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>If you were able to make it through all the steps above, you should be able to push to and pull from your registry. You will definitely want to look up information about how to tag images and containers in Docker. </p>
<!-- /wp:paragraph -->

<!-- wp:pullquote {"customMainColor":"#0693e3","className":"is-style-default"} -->
<figure class="wp-block-pullquote is-style-default" style="border-color:#0693e3"><blockquote><p>As always, if you have any questions, feel free to post below and share your successes or frustrations! You can also reach out to me at&nbsp;<a href="mailto:robert@whitematter.tech" target="_blank" rel="noreferrer noopener">robert@whitematter.tech</a>.</p><p>Thanks for reading!</p></blockquote></figure>
<!-- /wp:pullquote -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->
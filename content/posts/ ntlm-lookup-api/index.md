---
title: "Using a New NTLM Hash Lookup Bulk Check API"
date: "2023-12-20"
categories:
  - "pentesting"
  - "security"
tags:
  - "pentesting"
  - "security"
  - "NTLM"
cover:
    image: "/posts/ntlm-lookup-api/pth.png"
    alt: "NTLM"
    caption: "<text>"
    relative: false
aliases:
    - /posts/ntlm-lookup-api/ntlm-lookup-api/
    - /2023/ntlm-lookup-api/
---


# Using a New NTLM Hash Lookup Bulk Check API

In today's cybersecurity landscape, organizations and security professionals are continually searching for efficient ways to detect and mitigate threats. One such method involves using NTLM hash lookup services. If you're looking to validate multiple NTLM hashes quickly, a bulk check API can be invaluable. In this post, we'll delve into the specifics of using a NTLM hash lookup bulk check API and guide you through the process.

## What is an NTLM Hash?

NTLM (NT LAN Manager) is a suite of Microsoft security protocols that provides authentication, integrity, and confidentiality to users. An NTLM hash represents the hashed version of a user's password. By comparing these hashes, security professionals can identify potential vulnerabilities or compromised credentials.

## How do you obtain NTLM hashes?

While this question is out of the scope of the blog post, some common ways pentesters may retrieve NTLM hashes are through local access and memory dumping, pass-the-hash attacks, phishing, credential harvesting, man-in-the-middle attacks, Active Directory enumeration, and other vulnerability exploits.

## Introduction to the NTLM Hash Lookup Bulk Check API

The NTLM hash lookup bulk check API we'll look at today is a new, specialized service designed to analyze multiple NTLM hashes simultaneously. The particular service I will show today comes from [this post on X](https://twitter.com/lkarlslund/status/1734483849361461259). By leveraging this API, you can streamline the process of converting hashes to plaintext, thereby enhancing your security posture or pentesting capabilities.

### Key Features:

- **Bulk Processing:** Submit up to 100 hashes in a single request.
- **Efficiency:** Quickly identify uncached or compromised hashes.
- **Integration:** Seamless integration with various programming languages and tools.

## Getting Started with the API

### 1. Preparing Your Hash List

Before initiating a bulk check, compile a list of NTLM hashes, with each hash on its line within a text file (e.g., `your-text-file-with-hashes.txt`).

### 2. Using PowerShell for API Request

Execute the following PowerShell command to submit your hash list for analysis:

\```powershell
Invoke-WebRequest -Method Post -Infile [your-text-file-with-hashes.txt] https://ntlm.pw/api/bulklookup | Select-Object -Expand Content
\```

### 3. Utilizing Curl for API Request

Alternatively, if you prefer using `curl`, execute the following command:

\```bash
curl -X POST -H "Content-Type: text/plain" --data-binary "@[your-text-file-with-hashes.txt]" https://ntlm.pw/api/bulklookup
\```

## Interpreting API Responses

Upon submitting your request, the API will process the provided hashes and return a corresponding response. It's crucial to monitor the HTTP status codes and content to determine the outcome of your query.

- **Successful Lookup:** Receive a list of identified hashes and their corresponding details.
- **Insufficient Points:** If you encounter a 429 error, it indicates a lack of points to fulfill the request, assuming all hashes were uncached. Wait about 15 minutes, and you should have more points to fulfil your requests.

## Conclusion

Incorporating an NTLM hash lookup bulk check API into your cybersecurity toolkit can significantly enhance your threat detection and pentesting capabilities. By efficiently converting multiple hashes to plaintext, you can proactively identify vulnerabilities, prevent unauthorized access, and safeguard critical assets.

--------------------------------------------------------
# Wrapping Up
Congrats! I hope that, if you made it this far, you have a working setup. If not, please reach out via the methods below. I am generally responsive to email, but posting a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions) might be helpful to others in the future. I highly prefer this option if possible.

> As always, if you have any questions, feel free to start a [Discussion on GitHub](https://github.com/RobertDWhite/WhiteMatterTech/discussions), [submit a GitHub PR](https://github.com/RobertDWhite/WhiteMatterTech/pulls) to recommend changes/fixes in the article, or reach out to me directly at [robert@whitematter.tech](mailto:robert@whitematter.tech).
>
> Thanks for reading!
>
> Robert

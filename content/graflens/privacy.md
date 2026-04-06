---
title: "GrafLens Privacy Policy"
date: "2026-04-06"
description: "Privacy policy for the GrafLens iOS app"
---

<h1>Privacy Policy for GrafLens</h1>

<p><em>Last updated: April 6, 2026</em></p>

<p>This Privacy Policy describes how the GrafLens iOS application ("GrafLens", "the app", "we") handles your information. GrafLens is developed and maintained by WhiteMatterTech.</p>

<h2>Summary</h2>

<p><strong>GrafLens does not collect, transmit, or store any personal information on remote servers.</strong> All data the app handles stays on your device or is sent only to the Grafana instance you choose to connect to.</p>

<h2>What Information GrafLens Handles</h2>

<h3>Grafana Connection Information</h3>

<p>To function, GrafLens requires you to provide:</p>

<ul>
    <li>The URL of your Grafana instance</li>
    <li>A Grafana service account token (API key) you generate yourself</li>
    <li>An optional connection name for your reference</li>
</ul>

<p>This information is stored locally on your device using Apple's standard storage mechanisms (UserDefaults). It is never transmitted to WhiteMatterTech or any third party. It is used only to authenticate requests directly from your device to your Grafana instance.</p>

<h3>Browser Session Cookies</h3>

<p>If your Grafana instance uses OIDC/OAuth authentication (e.g., Authentik, Okta, Google), GrafLens uses Apple's WKWebView to allow you to sign in. The resulting session cookies are stored in the system's standard WebKit data store on your device. You may clear these at any time from the app's Settings screen.</p>

<h3>App Preferences</h3>

<p>GrafLens stores the following preferences locally on your device:</p>

<ul>
    <li>Your appearance preference (system, light, or dark mode)</li>
    <li>Your favorite dashboards (a list of dashboard identifiers)</li>
    <li>Your recently viewed dashboards (last 15)</li>
    <li>Your saved Grafana connections</li>
    <li>Cached panel images for offline viewing</li>
</ul>

<h3>Spotlight Index</h3>

<p>To enable iOS Spotlight search of your dashboards, GrafLens indexes dashboard titles and tags using Apple's Core Spotlight framework. This index is stored locally on your device and is not transmitted anywhere. You can clear it at any time from the app's Settings screen.</p>

<h2>What GrafLens Does NOT Do</h2>

<ul>
    <li>GrafLens does not collect any analytics, telemetry, or usage data</li>
    <li>GrafLens does not contain any advertising or third-party tracking SDKs</li>
    <li>GrafLens does not communicate with any servers operated by WhiteMatterTech</li>
    <li>GrafLens does not transmit your Grafana credentials, dashboard data, or any other information to any party other than the Grafana instance you explicitly configure</li>
    <li>GrafLens does not access your contacts, photos, location, microphone, or camera</li>
</ul>

<h2>Network Communication</h2>

<p>The app communicates only with:</p>

<ul>
    <li><strong>The Grafana instance(s) you configure.</strong> All API requests, panel rendering, and authentication flows are sent directly from your device to your Grafana server.</li>
    <li><strong>Apple App Store servers.</strong> If you choose to leave a tip via the optional in-app tip jar, this transaction is processed entirely by Apple's StoreKit framework. WhiteMatterTech does not receive your payment information.</li>
</ul>

<h2>Data Sharing</h2>

<p>WhiteMatterTech does not share, sell, rent, or trade any information because we do not collect any. The only entity that receives data from your use of GrafLens is the Grafana instance you choose to connect to, which is governed by that instance's own privacy practices.</p>

<h2>Children's Privacy</h2>

<p>GrafLens is not directed at children under 13. We do not knowingly collect any information from anyone, including children.</p>

<h2>Open Source</h2>

<p>GrafLens is open source software. You can review the complete source code at <a href="https://github.com/whitematter-tech/graflens">https://github.com/whitematter-tech/graflens</a> to verify the privacy claims in this policy.</p>

<h2>Changes to This Policy</h2>

<p>If we make changes to this privacy policy, we will update the "Last updated" date at the top. Material changes will be announced via the app's GitHub repository.</p>

<h2>Contact</h2>

<p>If you have questions about this privacy policy, please contact:</p>

<p>
    <strong>WhiteMatterTech</strong><br>
    Email: <a href="mailto:robert@whitematter.tech">robert@whitematter.tech</a><br>
    GitHub: <a href="https://github.com/whitematter-tech/graflens">github.com/whitematter-tech/graflens</a>
</p>

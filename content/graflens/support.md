---
title: "GrafLens Support"
date: "2026-04-06"
description: "Support and documentation for the GrafLens iOS app"
---

<h1>GrafLens Support</h1>

<h2>Getting Started</h2>

<h3>1. Generate a Grafana Service Account Token</h3>

<ol>
    <li>Sign in to your Grafana instance as an administrator</li>
    <li>Navigate to <strong>Administration → Service Accounts</strong></li>
    <li>Click <strong>Add service account</strong></li>
    <li>Give it a name (e.g., "GrafLens iOS") and assign the <strong>Viewer</strong> role (or <strong>Editor</strong> if you want to use editing features like annotations and silences)</li>
    <li>Click <strong>Create</strong>, then click <strong>Add service account token</strong></li>
    <li>Copy the generated token — you will only see it once</li>
</ol>

<h3>2. Connect GrafLens</h3>

<ol>
    <li>Open GrafLens on your iPhone or iPad</li>
    <li>Enter your Grafana server URL (e.g., <code>https://grafana.example.com</code>)</li>
    <li>Paste your service account token</li>
    <li>Optionally, give the connection a friendly name</li>
    <li>Tap <strong>Connect</strong></li>
</ol>

<h3>3. Sign in for Panel Rendering (Optional)</h3>

<p>Panels are rendered via Grafana's embedded panel feature, which uses standard web authentication. If your Grafana instance uses OIDC/OAuth (e.g., Authentik, Okta, Google), you will need to sign in once via the in-app browser. This is separate from the API token authentication.</p>

<p>To sign in: open <strong>Settings</strong> in the app and tap <strong>Sign In for Panel Viewing</strong>.</p>

<h2>Common Questions</h2>

<h3>Why do I see "Sign in to view panels" on dashboards?</h3>

<p>Grafana's embedded panel rendering requires a browser session, not just an API token. If your Grafana instance uses OIDC/OAuth, you need to complete the web sign-in once. After that, panels will render normally.</p>

<h3>Can I use GrafLens with Grafana Cloud?</h3>

<p>Yes. Use your Grafana Cloud instance URL and a service account token generated from Grafana Cloud's admin panel.</p>

<h3>Does GrafLens work offline?</h3>

<p>Partially. Recently viewed panels can be cached for offline viewing. Live data, however, requires a network connection to your Grafana instance.</p>

<h3>How do I add a panel widget to my home screen?</h3>

<ol>
    <li>Long-press your home screen and tap the <strong>+</strong> button</li>
    <li>Search for "GrafLens"</li>
    <li>Select a widget size and tap <strong>Add Widget</strong></li>
    <li>Tap the widget to configure it: choose a dashboard and a specific panel</li>
</ol>

<h3>Is my data sent anywhere?</h3>

<p>No. GrafLens communicates only with the Grafana instance you configure. We do not collect analytics, telemetry, or any user data. See the <a href="/graflens/privacy/">Privacy Policy</a> for full details.</p>

<h2>Reporting Bugs and Feature Requests</h2>

<p>GrafLens is open source. Please file bug reports and feature requests on GitHub:</p>

<p><a href="https://github.com/whitematter-tech/graflens/issues">https://github.com/whitematter-tech/graflens/issues</a></p>

<p>For private support inquiries, email <a href="mailto:robert@whitematter.tech">robert@whitematter.tech</a>.</p>

<h2>Source Code</h2>

<p>The complete source code is available at <a href="https://github.com/whitematter-tech/graflens">https://github.com/whitematter-tech/graflens</a> under the MIT license.</p>

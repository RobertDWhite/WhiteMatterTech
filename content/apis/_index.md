---
title: "APIs"
date: "2026-08-29"
description: "Machine-readable endpoints published by whitematter.tech, discoverable via RFC 9727"
---

<h1>APIs</h1>

<p>This site publishes a small number of read-only HTTP endpoints for search clients, feed readers, and automated agents. They are static documents regenerated whenever the site is rebuilt. There is no authentication, no rate limiting, and no pagination.</p>

<p>All of them are advertised for automated discovery at <a href="/.well-known/api-catalog">/.well-known/api-catalog</a>, a link set served per <a href="https://www.rfc-editor.org/rfc/rfc9727" rel="noopener noreferrer">RFC 9727</a>.</p>

<hr>

<h2>Content Index API</h2>

<p><strong>Every published post as a single JSON array.</strong></p>

<p>Each entry carries the post's <code>title</code>, absolute <code>permalink</code>, an HTML <code>summary</code> fragment, and the full <code>content</code> as plain text. The whole index is returned in one response, so clients that want the site's full text can fetch it without crawling individual pages.</p>

<ul>
    <li>Endpoint: <a href="/index.json"><code>GET /index.json</code></a></li>
    <li>Response type: <code>application/json</code></li>
    <li>Description: <a href="/apis/content-index/openapi.json">OpenAPI 3.1</a></li>
</ul>

<hr>

<h2>Feed API</h2>

<p><strong>Recent posts as an RSS 2.0 feed.</strong></p>

<p>The standard syndication feed, for feed readers and agents that poll for new posts.</p>

<ul>
    <li>Endpoint: <a href="/index.xml"><code>GET /index.xml</code></a></li>
    <li>Response type: <code>application/xml</code></li>
    <li>Description: <a href="/apis/feed/openapi.json">OpenAPI 3.1</a></li>
</ul>

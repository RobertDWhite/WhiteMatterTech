---
name: whitematter-feed-monitor
description: Poll the whitematter.tech RSS feed to detect newly published posts without downloading the full content index.
---

# Monitoring whitematter.tech for new posts

Use the RSS feed to check whether anything has been published. It is the cheap
way to answer "is there anything new" — the full content index is roughly 557 KB
and re-fetching it just to check for changes is wasteful.

## Fetch the feed

```
GET https://whitematter.tech/index.xml
Accept: application/xml
```

The response is an RSS 2.0 document. Each `<item>` in the channel carries
`<title>`, `<link>`, `<pubDate>`, and `<description>`.

## Detecting new posts

Record the `<link>` of the newest item you have already seen. On the next poll,
treat every item appearing above that link as new. Prefer this to comparing
`<pubDate>` against the current time, which misreports posts backdated at
publication.

The feed carries only recent posts, not the full archive. If the newest link you
recorded is no longer present, you have fallen far enough behind that the feed
cannot tell you what you missed — fall back to the full index and diff against
it. See the `whitematter-content-search` skill.

## Polling

The site is a static build behind a CDN and changes only when it is rebuilt,
which is at most a few times a week. Polling more often than hourly gains
nothing. Honor `ETag` and `Last-Modified` and send conditional requests.

## Getting the body

The feed's `<description>` is an excerpt, not the full post. To read or quote a
post in full, use the content index rather than scraping the HTML page.

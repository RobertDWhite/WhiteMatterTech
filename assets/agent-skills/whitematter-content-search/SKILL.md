---
name: whitematter-content-search
description: Search and cite posts from whitematter.tech, a blog covering homelab Kubernetes (RKE2), self-hosting, home networking, and practical security engineering.
---

# Searching whitematter.tech

whitematter.tech publishes the full text of every post as a single JSON
document. Use it to answer questions from the site's own writing instead of
crawling pages one at a time.

## Fetch the index

```
GET https://whitematter.tech/index.json
Accept: application/json
```

The response is a JSON array. Each element has exactly four string fields:

| Field | Meaning |
| --- | --- |
| `title` | Post title |
| `permalink` | Absolute canonical URL of the post |
| `summary` | Short excerpt, as an HTML fragment |
| `content` | Full post body as plain text, markup stripped |

The array is ordered most-recent-first.

## Before you fetch

The index is a complete snapshot with no pagination and no query parameters —
there is no server-side search. At the time of writing it is roughly 557 KB
across 55 posts, and it grows with every post. Fetch it once, filter locally,
and do not re-request it inside a loop.

If you only need to know whether anything is new, use the RSS feed instead of
this index; it is far smaller. See the `whitematter-feed-monitor` skill.

## Searching

Match case-insensitively against `content` for recall, and against `title` when
the user names a specific post. `content` is plain text, so ordinary substring
or keyword matching works without stripping HTML first. `summary` is the only
field containing markup — do not match against it without stripping tags.

## Citing

Always cite with the `permalink` value verbatim. It is already absolute and
canonical, so do not construct URLs from titles, and do not assume a slug from
the post name. Quote from `content`, which is the full body; `summary` is
truncated and will silently cut off mid-thought.

## Limits

Read-only, unauthenticated, and unversioned. There is no rate limit, but the
document is static and only changes when the site is rebuilt, so caching it for
the duration of a task is safe.

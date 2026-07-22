# n8n-nodes-metricool-social

n8n community node for [Metricool](https://metricool.com/) — schedule social posts, pull analytics, manage inbox/reviews, and automate agency workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Metricool API documentation

Official Metricool references:

| Resource | Link |
|---|---|
| **API overview (auth, base URL, Swagger)** | [app.metricool.com/resources/apidocs](https://app.metricool.com/resources/apidocs/index.html) |
| **Help Center — API & integrations** | [help.metricool.com — API & Integrations](https://help.metricool.com/api-integrations-wf9nn) |
| **Basic API integration guide** | [Basic Guide for API Integration](https://help.metricool.com/basic-guide-for-api-integration-r97af) |
| **Common API questions / errors** | [Common questions and errors](https://help.metricool.com/common-questions-and-errors-when-using-the-api-8x9nq) |
| **OpenAPI definition** | [swagger.json](https://app.metricool.com/resources/apidocs/swagger.json) / [swagger.yaml](https://app.metricool.com/resources/apidocs/swagger.yaml) |

**Base URL:** `https://app.metricool.com/api`

API access requires a Metricool plan that includes the API (typically **Advanced** or **Custom**). If you do not see an **API** tab in Account Settings, your plan does not include it yet.

## Credentials

This node uses **Metricool API** credentials. Metricool authenticates with:

1. **User Token** → sent as header `X-Mc-Auth`
2. **User ID** → sent as query parameter `userId` on every request

Most operations also need a **Brand** (`blogId`) selected on the node (not stored in credentials).

### 1. Find your User Token

1. Sign in to [app.metricool.com](https://app.metricool.com/).
2. Open **Account Settings** (profile / account menu).
3. Open the **API** tab.
4. Copy the **User Token** (unique authorization code for your account).

> You can also open the official API docs from the info icon next to the token field in Metricool.

> **Screenshot placeholder:** `docs/images/api-token.png` — Account Settings → API tab (blur the token).
>
> ```md
> ![Metricool Account Settings – API token](docs/images/api-token.png)
> ```

### 2. Find your User ID

Your `userId` is in the browser URL whenever a brand is open:

```text
https://app.metricool.com/...?blogId=123456&userId=7890123
```

- Copy the number after `userId=` → **User ID** (credential)
- Copy the number after `blogId=` → **Brand** id (per-node field; also available via Brand → Get Many / the Brand resource locator)

> **Screenshot placeholder:** `docs/images/userid-url.png` — address bar with `userId=` and `blogId=` highlighted.
>
> ```md
> ![Metricool URL showing userId and blogId](docs/images/userid-url.png)
> ```

Metricool’s help center also covers IDs under [Common questions and errors when using the API](https://help.metricool.com/common-questions-and-errors-when-using-the-api-8x9nq) (see *How do I get my blogId?* / user ID walkthrough).

### 3. Create credentials in n8n

1. In n8n, open **Credentials** → **Add credential** → **Metricool API**.
2. Paste:
   - **User Token** — from Account Settings → API
   - **User ID** — from the URL `userId=` value
3. Save and use **Test** (the node calls `GET /v2/settings/brands`).

> **Screenshot placeholder:** `docs/images/n8n-credentials.png` — n8n Metricool API credential modal.
>
> ```md
> ![n8n Metricool API credentials](docs/images/n8n-credentials.png)
> ```

| Field | Where it comes from | How this node sends it |
|---|---|---|
| **User Token** | Account Settings → API | Header `X-Mc-Auth` |
| **User ID** | URL `userId=` | Query `userId` |
| **Brand** (`blogId`) | URL `blogId=` or Brand → Get Many | Query `blogId` (per operation) |

### Brand selection tip

Prefer the **Brand** resource locator (**From List**) so you do not have to copy IDs by hand. You can still paste a numeric id in **ID** mode.

> **Screenshot placeholder:** `docs/images/brand-locator.png` — Brand resource locator (From List).
>
> ```md
> ![Brand resource locator in the Metricool node](docs/images/brand-locator.png)
> ```

## Usage examples

These are starter patterns you can rebuild in n8n. Replace dates, networks, and brand as needed.

### Example 1 — List brands

1. **Metricool** → Resource: **Brand** → Operation: **Get Many**
2. Optionally enable **Simplify** for a shorter field set
3. Use the output `id` values as Brand ids in later nodes

### Example 2 — Best time → schedule a post

1. **Metricool** → **Best Time** → **Get** (pick Brand + network, e.g. Instagram)
2. Output is **one item** with `days` (full heatmap) and `bestSlot` (`dayOfWeek`, `hourOfDay`, `value`)
3. **Set** (or expression) builds `publicationDate` from `bestSlot` — e.g. next matching weekday at that hour
4. **Metricool** → **Scheduled Post** → **Create** once (same Brand / Networks)

> **Screenshot placeholder:** `docs/images/workflow-schedule-post.png` — Best Time → Scheduled Post Create.
>
> ```md
> ![Example workflow – best time to scheduled post](docs/images/workflow-schedule-post.png)
> ```

### Example 3 — Upload media → schedule a post

1. Previous node provides binary data (e.g. HTTP Request download, form upload, or Read Binary File)
2. **Metricool** → **Media** → **Upload**
   - Brand: target brand
   - Binary Property: name of the binary field (default `data`)
3. Pass the returned media URL into **Scheduled Post** → **Create** → **Media URLs**

> **Screenshot placeholder:** `docs/images/workflow-media-upload.png` — Media Upload → Scheduled Post Create.
>
> ```md
> ![Example workflow – media upload to scheduled post](docs/images/workflow-media-upload.png)
> ```

### Example 4 — Pull analytics for a date range

1. **Metricool** → **Analytics** → **Get Available Metrics** (optional) to see codes for a network
2. **Metricool** → **Analytics** → **Get Aggregation** (or Timeline / Distribution)
3. Set Brand, Network, **Subject** (e.g. account / posts), Metric (from the list), From / To, and Timezone
4. Optionally chain **Get Network Posts** for post-level rows on the same range

> **Screenshot placeholder:** `docs/images/workflow-analytics.png` — Analytics Get Aggregation workflow.
>
> ```md
> ![Example workflow – analytics aggregation](docs/images/workflow-analytics.png)
> ```

### Example 5 — Inbox snapshot

1. **Metricool** → **Inbox** → **Get Conversations**
2. Set Brand + network (provider)
3. Route unread / open items to Slack, email, or a CRM with IF / Switch nodes

### Example workflow shapes (overview)

```text
Schedule on a good slot
  Best Time:Get → Scheduled Post:Create

Post with uploaded media
  (binary source) → Media:Upload → Scheduled Post:Create

Weekly reporting
  Schedule Trigger → Analytics:Get Aggregation → (Sheets / Slack / email)

Multi-brand fan-out
  Brand:Get Many → Split In Batches → Analytics / Scheduled Post / Inbox
```

## Operations

Resources are grouped by product area:

### Tier 1 — core

- **Brand** — get many, get, update, delete
- **Scheduled Post** — get many, get, create, update, update partial, delete, get deleted, restore
- **Analytics** — aggregation, timeline, distribution, brand summary posts, JSON network posts/reels/stories (CSV-only Facebook/TikTok post & Facebook story downloads are not exposed)
- **Best Time** — best times to post by network
- **Media** — upload binary via Metricool S3 transaction flow (returns a media URL for Scheduled Post)

Scheduled Post supports **Fields** or **JSON** body modes. Network-specific options (Instagram, TikTok, YouTube, Pinterest, etc.) appear when those networks are selected. Character limits for X (280) and Bluesky (300) are enforced in the node.

### Tier 2 — engagement

- **Inbox** — conversations, messages, comments, status, notes
- **Review** — list, reply, delete reply, GBP reviews
- **Competitor** — list/add/remove/favorite, competitor posts
- **Library Post** — CRUD + events
- **Smart Link** — CRUD + analytics
- **Approval** — send to review, approve/reject, tasks
- **Post Note** — notes on scheduled posts + events

### Tier 3 — agency & depth

- **Agency** — team members & end-clients (Agency plans)
- **Collaborator** — brand roles & collaborators
- **Ad** — advertising lists + Google/TikTok campaign analytics (Meta campaign CSV download omitted)
- **Link in Bio** — Instagram bio link catalog helpers

## Usage notes

- Prefer public media URLs in Scheduled Post, or use **Media → Upload** then pass the returned URL into **Media URLs**.
- Analytics needs **Network + Subject + Metric**. Use **Get Available Metrics** or the Subject/Metric dropdowns. Invalid combinations often return HTTP 403. Looker Studio `/datastudio/dynamic-fields` uses different field IDs and is not interchangeable with these codes.
- Analytics range dates use the **brand timezone** by default (same as the Metricool web app), e.g. `from=2026-03-01T00:00:00-06:00&timezone=America/Mexico_City`. Leave Timezone empty or UTC to auto-use the brand; set an explicit IANA zone only to override.
- Delete operations return `{ "deleted": true }` so the next node always receives a clear confirmation item.
- **Simplify** (Brand / Scheduled Post Get & Get Many) returns a shorter field set; turn it off for the full API payload.

## Compatibility

Built with `@n8n/node-cli` / n8n Nodes API v1. Test against a current n8n release when developing with `npm run dev`.

## Development

```bash
npm install
npm run build
npm run lint
npm run dev
```

## Screenshots

Drop PNG/WebP files into [`docs/images/`](docs/images/), then replace each **Screenshot placeholder** block above with the ready-to-paste `![…](…)` snippet under it. Suggested captures are listed in [`docs/images/README.md`](docs/images/README.md).

## Resources

- [Metricool](https://metricool.com/)
- [Metricool API docs](https://app.metricool.com/resources/apidocs/index.html)
- [Metricool Help Center — API & Integrations](https://help.metricool.com/api-integrations-wf9nn)
- [n8n community nodes docs](https://docs.n8n.io/integrations/#community-nodes)
- [Programmatic-style nodes](https://docs.n8n.io/integrations/creating-nodes/build/programmatic-style-node/)

## Version history

See [CHANGELOG.md](CHANGELOG.md).

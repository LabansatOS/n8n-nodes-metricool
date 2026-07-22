# Changelog

## 0.3.1

### Added
- Analytics **Get Available Metrics** with Subject/Metric dropdowns from Metricool’s catalog
- Network/Provider dropdowns limited to networks connected on the selected brand
- Ads **Get Meta Ads Campaigns**; optional fields for Post Note, Smart Link, Collaborator, and Agency

### Fixed
- Swagger alignment across Scheduled Post, Inbox, Review, Competitor, Collaborator, Agency, Link in Bio, Ads, and Media (providers, bodies, query params, loadOptions)
- Analytics/Best Time dates use brand timezone + ISO-8601 offsets; query encoding preserves `+` in offsets
- Best Time **Get** returns a single item (stops Scheduled Post Create from firing once per weekday)
- Auth/error handling: trim credentials, map 401 vs 403 correctly, richer API error details, avoid circular `NodeApiError` objects
- Media SIMPLE uploads via `presignedUrl`; abort/multipart complete send required params

### Changed
- Empty/UTC timezone resolves to the brand timezone (Analytics, Best Time, Ads, Competitor, Smart Link, Review GBP, Scheduled Post Get Many)
- UX polish for verified-node guidelines (delete responses, Simplify, copy, booleans, placeholders)

### Removed
- Dashboard, Flow, and Hashtag Tracker resources
- CSV-only Analytics/Ads endpoints (Facebook/TikTok network posts, Facebook stories, Facebook Ads campaigns)

## 0.3.0

### Added
- Tier 3 resources: Agency, Collaborator, Flow, Ad, Hashtag Tracker, Dashboard (read), Link in Bio

## 0.2.0

### Added
- Tier 2 resources: Inbox, Review, Competitor, Library Post, Smart Link, Approval, Post Note

## 0.1.0

### Added
- Initial Metricool programmatic community node
- Credentials: `X-Mc-Auth` user token + `userId`
- Tier 1 resources: Brand, Scheduled Post, Analytics, Best Time, Media upload

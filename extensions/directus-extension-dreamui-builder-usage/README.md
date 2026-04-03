# DreamUI Builder Usage

Directus interface extension that shows which pages use the current block through a Builder many-to-any relation.

## Setup

1. Create an `alias` field on the block collection, for example `used_on_pages`.
2. Select the `DreamUI Builder Usage` interface for that field.
3. Configure the interface options to match your Builder junction schema.

## Typical M2A config

- `Junction Collection`: `pages_builder`
- `Page Collection`: `pages`
- `Junction Page Field`: `pages_id`
- `Junction Item Field`: `item`
- `Junction Item Collection Field`: `collection`
- `Page Title Field`: `title`
- `Page Slug Field`: `slug`
- `Page Status Field`: `status`

If your project uses different names like `pages_blocks`, `page`, or `item_collection`, just set those values in the interface options.

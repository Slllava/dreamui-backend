# DreamUI Icon Field

Directus interface extension that lets a string field store icon selections from:

- Lucide
- Remix Icon

For Lucide icons, the interface also stores `strokeWidth`.

## Stored value

The field value is saved as a JSON string:

```json
{"library":"lucide","name":"AlarmClock","strokeWidth":1.75}
```

or

```json
{"library":"remix","name":"RiHomeLine"}
```

The interface can also read legacy plain-string values like `AlarmClock` or `RiHomeLine`.

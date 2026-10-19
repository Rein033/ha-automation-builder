# HA Automation Builder

[![Buy me a coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-rein033-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/rein033)

Build Home Assistant automations with simple forms: pick triggers, conditions and actions, start from ready-made examples, and copy clean automation YAML. Paste existing YAML to edit it.

**Use it:** [uselesssite.nl/ha-automation-builder](https://uselesssite.nl/ha-automation-builder/)

- Triggers: state, time, sun, numeric value, zone, time pattern, Home Assistant start, event and webhook
- Conditions: state, time and weekdays, sun, numeric value, zone and template
- Actions: lights, switches, scenes, scripts, notifications, delays, wait, any action call with data
- Ready-made examples: lights at sunset, motion light, washing machine done, leave home, and more
- New syntax (2024.10+) or classic syntax for older versions
- Paste existing automation YAML to load and edit it; unknown parts are kept as raw YAML

Everything runs in your browser, nothing is sent anywhere.

Part of the free, open-source tools at [uselesssite.nl/tools](https://uselesssite.nl/tools/).

## Development

Plain HTML, CSS and JavaScript, no build step. Open `index.html` through any static web server.
`base.css` and `base.js` are shared with the other tools; the tool itself lives in `app.js` and `style.css`.

## Support

Everything here is free. If it saves you time, you can [buy me a coffee](https://buymeacoffee.com/rein033) ☕

## License

[MIT](LICENSE). Not affiliated with Home Assistant, ESPHome or the Open Home Foundation.

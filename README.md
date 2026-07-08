# openimis-fe-communications_js

openIMIS frontend module for TASAF/CoreMIS communications management.

## Developer Guide

Package: `@openimis/fe-communications`.

Main entry point: `src/index.js`. It registers translations, the
`communications` reducer, routes, picker refs and module menu entries.

Routes:

- `/communications/activities` - activity list/search.
- `/communications/activities/activity/:activity_uuid?` - activity create/edit.
- `/communications/feed` - internal communications feed.
- `/communications/calendar` - activity calendar.
- `/communications/dashboard` - dashboard.
- `/communications/library` - templates, stakeholder lists and assets.

Important files:

- `src/actions.js` - GraphQL and REST upload/download operations.
- `src/constants.js` - rights, route refs, status/action enums.
- `src/pages/*` - top-level screens.
- `src/components/*` - activity panels, dashboard and shared calendar UI.
- `src/pickers/*` - reusable picker refs for categories, channels and stakeholders.
- `src/translations/en.json` - module text.

Backend dependency: `openimis-be-communications_py`. Keep frontend rights in sync
with the backend `22xxxx` rights.

Development:

```bash
npm install
npm run build
```

Register the built package in the openIMIS frontend bundle the same way as other
`@openimis/fe-*` modules.

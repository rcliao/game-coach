# Overlay Settings Refactor Tasks

These tasks cover the work for simplifying the settings panel by integrating all overlay testing controls into the `Overlay` tab and removing the separate `Testing` tab.

## Refactor
- [ ] Remove the `Testing` tab from `SettingsModal`.
- [ ] Embed `OverlayTestSuite` directly under the overlay configuration options.
- [ ] Ensure position, style and duration testers work when accessed from the `Overlay` tab.
- [ ] Persist overlay testing values immediately when updated.

## Testing
- [ ] Update unit tests for `SettingsModal` to check that `OverlayTestSuite` renders when the overlay tab is active.
- [ ] Update e2e test to open the `Overlay` tab and verify the presence of testing controls.

## Verification
- [ ] Run `npm run lint`.
- [ ] Run `npm run type-check`.
- [ ] Run `npm test`.
- [ ] Run `npm run test:e2e`.


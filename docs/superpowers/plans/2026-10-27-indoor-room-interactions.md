# Indoor room interaction repair

**Requirement:** Make every visible room on 1F–5F directly selectable with a mouse or touch in the existing default 3D view. Preserve all geometry, paint, camera transforms, navigation, QR behavior, and map gestures.

- [x] Reproduce coordinate-based failures on all floors and trace actual browser targets/gesture state.
- [x] Write regression coverage using real mouse/touch coordinates, not programmatically dispatched selection events.
- [x] Repair the shared interaction layer based on the reproduced cause. Avoid enlarged overlapping world-space hitboxes or changes to visual layout/camera.
- [x] Verify visible room faces/edges, small rooms, adjacent-room accuracy, drag/pinch/rotation, highlighting, floor switching, and navigation.
- [x] Run existing tests and room QR regressions; build, sync Android, assemble/install the debug APK, test packaged WebView interactions, and compare APK/web assets.

Baseline: HEAD `10ff2bbe`; working tree clean. No branch/commit changes requested. Any programmatic click used by tests is only to reset selection before a coordinate-based action, never the interaction being verified.

## Results so far

- Reproduced far-side input interception by a containing DIV across all floors. Disabling the wrapper's pointer events restored every room-center target.
- Edge probes then reproduced transparent hitbox overlap. Removing that overlay restored visible face input and touch-end gesture cleanup.
- Touch probes demonstrated browser-adjusted compatibility clicks selecting larger neighbors despite the finger point being on the intended room. Actual coordinate-based touch resolution plus compatibility-click prevention fixes that path.
- Full browser verification passed 970 coordinate probes across 76 rooms using mouse and touch in the default orientation. Pan, rotation, pinch, tap completion, and navigation controls passed. The existing Node suite passes 19/19.
- Independent review found no blocking interaction issue. Partial-run native coverage reporting was made dynamic rather than hardcoding 76 rooms.
- Concurrent external filter-control and Assistance-screen edits appeared during execution. They were preserved and are not part of this interaction repair. No claim is made that these unrelated layout edits were authored here.
- Android passed 485 WebView face/edge taps and 76 OS-level ADB room-center taps, covering all 76 rooms on all five floors. Gesture/navigation checks passed and original native/web auth, location pin, and URL were restored.
- Room QR browser regressions passed. Production build, Android sync, debug assembly, and exact parity of all 55 production web files with synced assets and APK passed.
- Complete SVG room face/label/symbol rendering, floor data, and default camera constants remain identical to HEAD. The pre-existing `originX` map type error remains outside this fix. Physical device behavior was not tested.

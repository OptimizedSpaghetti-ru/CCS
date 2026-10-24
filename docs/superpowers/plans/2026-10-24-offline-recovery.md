# Offline recovery implementation plan

**Goal:** Implement the user's No Internet Connection specification in the shared web/Android app.

**Architecture:** A singleton connectivity monitor combines browser/native events and uncached reachability probes. A Supabase fetch adapter bounds transport requests, holds interrupted safe reads until connectivity returns, and never replays mutations. An overlay leaves the router and forms mounted. A production service worker caches only public app assets for offline web reloads.

**Constraints:** Preserve auth storage, input, native configuration, and unrelated screens. HTTP errors and slow probes alone are not evidence of offline connectivity. No reload-based recovery or mutation replay.

- [x] Add transport tests covering offline reads, mutations, timeouts, aborts, and HTTP errors; verify failure before implementation.
- [x] Implement monitor, fetch adapter, accessible burgundy overlay, startup/auth recovery, and native Network lifecycle cleanup.
- [x] Cache the production public web shell, excluding API/auth requests and connectivity probes.
- [x] Run transport/browser checks, production build, Capacitor Android sync, and Android debug build. Record runtime limits explicitly.

Validation details: [offline recovery](../../offline-recovery.md).

**Review focus:** Offline startup with expired auth; server 500 while online; native Wi-Fi/data handoff; preserving mounted drafts; service-worker updates and deep-link reloads.

**Execution:** Inline in the existing clean workspace, as authorized by the implementation request; no commits or publishing.

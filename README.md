# Orca Clock

Shows the current local hours and minutes in Orca's bottom status bar, using
Node's default locale and the local time zone. Requires
Orca 1.4.248 or newer. No dependencies or build step.

In Orca Settings, under the Orca Clock plugin, set **Hour format** to **Locale
default**, **12-hour**, or **24-hour**. Changes apply immediately. Locale default
preserves the original behavior; it may not reflect a macOS clock-format override.

The worker updates immediately on activation and every second thereafter, so a
minute change appears within about a second while Orca is awake. It reads the
current time on each tick, including after sleep or a system clock change, and
clears the timer and settings subscription on deactivation. Failed updates go to the plugin log and the next
tick retries.

## Check

```sh
orca plugin test . --json
orca plugin validate . --json
orca plugin check . --json
orca plugin inspect . --json
```

The tests use Node's built-in mocked timers (Node 20.11+), with no real wait. They
check immediate display, rollover at midnight, cleanup, reactivation, and recovery
after a refused host update, plus all three formats and live setting changes.
`plugin check` validates this worker-only plugin;
there is no panel to render.

## Install

```sh
orca plugin install alexesprit/orca-clock@v0.1.0 --json
```

Orca returns `approval_required` and an exact command with `--approve <fingerprint>`.
Review its grants, then run that command. This installs and enables `alexesprit.clock`.
It runs a trusted Node worker and requests `settings:own` to read its hour-format
setting and react to changes.

```sh
orca plugin list --json
orca plugin logs alexesprit.clock --json
orca plugin shot alexesprit.clock --status-bar --json
orca plugin disable alexesprit.clock --json
orca plugin enable alexesprit.clock --json
orca plugin uninstall alexesprit.clock --json
```

## Local development

From a clone of this repository:

```sh
orca plugin install . --json
```

Follow the same fingerprint approval flow. Folder installs use `local.clock`, so
use that identity in the management commands above. Local installation copies
the files; repeat installation after editing them. No build step is needed.

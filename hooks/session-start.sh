#!/bin/sh
# gmstack SessionStart hook: prints routing guidance, which Claude Code adds to the
# session context. On by default.
#
# Turn it off (first match wins):
#   - env:     GMSTACK_ROUTING=off
#   - project: a file .gmstack/routing containing "off" at the repo root
#   - user:    a file ~/.config/gmstack/routing containing "off"
# Any other value, or no setting, leaves routing on.
#
# Always exits 0 so a problem here never blocks a session.

is_off() { [ -f "$1" ] && [ "$(tr -d ' \t\r\n' <"$1" | tr 'A-Z' 'a-z')" = "off" ]; }

[ "$(printf '%s' "${GMSTACK_ROUTING:-}" | tr 'A-Z' 'a-z')" = "off" ] && exit 0

root=${CLAUDE_PROJECT_DIR:-$(pwd)}
top=$(git -C "$root" rev-parse --show-toplevel 2>/dev/null) && root=$top

is_off "$root/.gmstack/routing" && exit 0
is_off "${XDG_CONFIG_HOME:-$HOME/.config}/gmstack/routing" && exit 0

cat "$(dirname "$0")/routing.md" 2>/dev/null || exit 0

if [ -f "$root/CHECKLIST.md" ]; then
  printf '\nThis repository is managed by gmstack: CHECKLIST.md at the repo root tracks checklist items and their evidence. Keep it current through the gmstack checklist skill when work changes an item.\n'
fi
exit 0

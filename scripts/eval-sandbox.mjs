// Sandbox for the eval scripts' headless Claude Code runs.
//
// The agent under test gets Bash, so without this it can do anything you can: an early flow run
// installed gitleaks with brew. These settings turn on Claude Code's own sandbox (Seatbelt on
// macOS, bubblewrap on Linux): Bash may write only to the run's working directory and a per-user
// temp dir, may reach only the npm registry, can't retry outside the sandbox, and the run fails
// at startup if the sandbox can't start instead of silently running unsandboxed. The deny rules
// are a second, coarser layer for commands that should never run at all.
export const sandboxSettings = ({ autoAllowBash, allowWrite }) => ({
  sandbox: {
    enabled: true,
    failIfUnavailable: true,
    allowUnsandboxedCommands: false,
    // The flow eval allows all Bash anyway; the routing eval keeps its narrow allow list.
    autoAllowBashIfSandboxed: autoAllowBash,
    // Extra writable paths, e.g. a per-eval npm cache, since ~/.npm is outside the sandbox.
    filesystem: { allowWrite },
    network: { allowedDomains: ["registry.npmjs.org"], strictAllowlist: true },
  },
  permissions: {
    deny: ["Bash(sudo *)", "Bash(brew *)", "Bash(apt *)", "Bash(apt-get *)", "Bash(npm install -g *)", "Bash(npm i -g *)", "Bash(pip install *)", "Bash(git push *)"],
  },
});

// Extra `claude` arguments: the sandbox settings, unless the caller opted out with --unsandboxed.
export const sandboxArgs = (unsandboxed, { autoAllowBash = false, allowWrite = [] } = {}) =>
  unsandboxed ? [] : ["--settings", JSON.stringify(sandboxSettings({ autoAllowBash, allowWrite }))];

// Tools the flow eval pre-approves. scripts/probe-sandbox.mjs runs with the same list, so what it
// measures is what the flow eval's agent can do. Write and Edit are left out on purpose: listing
// them approves every path, including $HOME (the sandbox only covers Bash). Without them,
// --permission-mode acceptEdits approves edits inside the working directory only.
export const FLOW_TOOLS = "Bash Read Glob Grep Skill Agent Task ToolSearch TaskCreate TaskUpdate TaskList TaskGet TodoWrite";

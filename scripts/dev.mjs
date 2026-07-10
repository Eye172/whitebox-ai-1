// Dev launcher that trusts the OS certificate store (--use-system-ca) so the
// server-side OAuth token exchange succeeds on TLS-inspecting corporate
// networks. Falls back cleanly everywhere else.
import { spawn } from "node:child_process";

const NODE_OPTIONS = `${process.env.NODE_OPTIONS ?? ""} --use-system-ca`.trim();

const child = spawn("next dev -p 4311", {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NODE_OPTIONS },
});

child.on("exit", (code) => process.exit(code ?? 0));

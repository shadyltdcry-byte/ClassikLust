/**
 * DebugAssist.js
 * 
 * Acts as an **extension handler** for DebuggerCore.
 * - Lets you inject new plugins dynamically
 * - Provides debugging utilities (logs, tracing, profiling, etc.)
 * 
 * What it does:
 *   ✅ Add/Remove plugins on the fly
 *   ✅ Provide developer tools (debug logs, timers, warnings)
 *   ❌ Does not initialize or orchestrate (that’s Core’s job)
 */

class DebugAssist {
  static inject(core, plugin) {
    core.modules.push(plugin);
    console.log(`[Assist] Injected new plugin: ${plugin.name}`);
  }

  static logState(core) {
    console.log("[Assist] Current Context:", core.context);
  }
}

export default DebugAssist;
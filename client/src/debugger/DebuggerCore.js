/**
 * DebuggerCore.js
 * 
 * The main orchestrator (bootstrapper). 
 * - Loads all modules/plugins.
 * - Provides a shared lifecycle (init, start, stop).
 * - Keeps global context (shared state).
 * 
 * What it does:
 *   ✅ Acts as entry point
 *   ✅ Registers and initializes plugins in correct order
 *   ✅ Provides error handling fallback
 *   ❌ Does not care about actual feature logic (that belongs to plugins)
 * 
 *
 *debugger
 *  ├── DebuggerCore.js          # The main orchestrator	(bootstrap everything)
 *  ├── DebugAssist.js           # Handles extending core with extra features
 *  ├── DebugPlugin.js              # Defines plugin contracts/rules
 *  └── modules/               # Every plugin lives here
 *       ├── characters.js
 *       ├── database.js
 *       ├── aichat.js
 *       └── gameplay.js
 *=====================================================
*/


/**
 * DebuggerCore.js
 * Main orchestrator for the debugger system
 */

class DebuggerCore {
  constructor() {
    this.modules = [];
    this.context = {};
    this.isInitialized = false;
  }

  register(module) {
    if (!module.name) {
      console.error('[DebuggerCore] Module must have a name property');
      return;
    }
    this.modules.push(module);
    console.log(`✅ [DebuggerCore] Registered: ${module.name}`);
  }

  async initAll() {
    if (this.isInitialized) {
      console.log('[DebuggerCore] Already initialized');
      return;
    }

    console.log('[DebuggerCore] Initializing all modules...');

    for (const module of this.modules) {
      try {
        await module.init(this.context);
        console.log(`✅ [${module.name}] Initialized successfully`);
      } catch (error) {
        console.error(`❌ [${module.name}] Init failed:`, error);
      }
    }

    this.isInitialized = true;
    console.log('🚀 [DebuggerCore] All modules initialized');
  }

  async runCommand(command, data) {
    console.log(`🔧 [DebuggerCore] Running command: ${command}`);

    for (const module of this.modules) {
      try {
        if (module.run) {
          await module.run(command, data);
        }
      } catch (error) {
        console.error(`❌ [${module.name}] Command '${command}' failed:`, error);
      }
    }
  }

  async stopAll() {
    console.log('[DebuggerCore] Stopping all modules...');

    for (const module of this.modules) {
      try {
        if (module.stop) {
          await module.stop();
          console.log(`✅ [${module.name}] Stopped`);
        }
      } catch (error) {
        console.error(`❌ [${module.name}] Stop failed:`, error);
      }
    }

    this.isInitialized = false;
    console.log('🛑 [DebuggerCore] All modules stopped');
  }

  getContext() {
    return this.context;
  }

  setContext(key, value) {
    this.context[key] = value;
  }
}

export default DebuggerCore;
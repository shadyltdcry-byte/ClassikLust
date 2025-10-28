import DebuggerCore from './DebuggerCore.js';
import DebugAssist from './DebugAssist.js';

// Import all module plugins
import DatabasePlugin from './modules/database.js';
import CharacterPlugin from './modules/character.js';
import AIChatPlugin from './modules/aichat.js';
import GameplayPlugin from './modules/gameplay.js';

/**
 * Initialize the complete debugger system
 */
async function initializeDebugger() {
  console.log('🔧 Initializing Debugger System...');

  // Create core instance
  const core = new DebuggerCore();

  // Register all modules in dependency order
  core.register(new DatabasePlugin());
  core.register(new CharacterPlugin());
  core.register(new AIChatPlugin());
  core.register(new GameplayPlugin());

  // Initialize all modules
  await core.initAll();

  // Set up global error monitoring
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      console.error('🔴 [Debugger] Caught error:', event.error);
      core.runCommand('logError', {
        message: event.error?.message || 'Unknown error',
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('🔴 [Debugger] Unhandled promise rejection:', event.reason);
      core.runCommand('logError', {
        message: event.reason?.message || event.reason || 'Unhandled rejection',
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      });
    });
  }

  // Make core globally available for debugging
  if (typeof window !== 'undefined') {
    window.debuggerCore = core;
    console.log('✅ Debugger available globally as window.debuggerCore');
  }

  return core;
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  initializeDebugger().then(core => {
    console.log('🎉 Debugger System Ready!');
    console.log('💡 Try: window.debuggerCore.runCommand("status")');
  });
}

export { initializeDebugger, DebuggerCore, DebugAssist };
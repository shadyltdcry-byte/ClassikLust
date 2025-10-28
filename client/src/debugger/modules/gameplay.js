
import DebugPlugin from '../DebugPlugin.js';

class GameplayPlugin extends DebugPlugin {
  constructor() {
    super('Gameplay');
    this.gameState = { running: false };
  }

  async init(context) {
    console.log(`[${this.name}] Initializing gameplay systems...`);
    context.gameplay = this;
    return true;
  }

  async run(command, data) {
    switch(command) {
      case 'start':
        console.log(`[${this.name}] Starting game...`);
        this.gameState.running = true;
        break;
      case 'pause':
        console.log(`[${this.name}] Pausing game...`);
        this.gameState.running = false;
        break;
      case 'status':
        console.log(`[${this.name}] Game running:`, this.gameState.running);
        break;
      case 'clearCache':
        console.log(`[${this.name}] Clearing gameplay cache...`);
        this.gameState = { running: false };
        break;
      default:
        break;
    }
  }

  async stop() {
    console.log(`[${this.name}] Stopping gameplay...`);
    this.gameState.running = false;
  }
}

export default GameplayPlugin;

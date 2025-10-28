
import DebugPlugin from '../DebugPlugin.js';

class CharacterPlugin extends DebugPlugin {
  constructor() {
    super('Characters');
    this.characters = [];
  }

  async init(context) {
    console.log(`[${this.name}] Loading characters...`);
    context.characters = this;
    return true;
  }

  async run(command, data) {
    switch(command) {
      case 'list':
        console.log(`[${this.name}] Characters:`, this.characters);
        break;
      case 'add':
        if (data?.name) {
          this.characters.push(data);
          console.log(`[${this.name}] Added character:`, data.name);
        }
        break;
      case 'clearCache':
        console.log(`[${this.name}] Clearing character cache...`);
        this.characters = [];
        break;
      default:
        break;
    }
  }

  async stop() {
    console.log(`[${this.name}] Saving characters...`);
  }
}

export default CharacterPlugin;

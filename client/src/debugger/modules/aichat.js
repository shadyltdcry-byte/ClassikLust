
import DebugPlugin from '../DebugPlugin.js';

class AIChatPlugin extends DebugPlugin {
  constructor() {
    super('AIChat');
    this.chatHistory = [];
  }

  async init(context) {
    console.log(`[${this.name}] Initializing AI chat system...`);
    context.aiChat = this;
    return true;
  }

  async run(command, data) {
    switch(command) {
      case 'chat':
        if (data?.message) {
          console.log(`[${this.name}] Processing:`, data.message);
          this.chatHistory.push({ user: data.message, timestamp: Date.now() });
        }
        break;
      case 'clearHistory':
        console.log(`[${this.name}] Clearing chat history...`);
        this.chatHistory = [];
        break;
      case 'status':
        console.log(`[${this.name}] Messages in history:`, this.chatHistory.length);
        break;
      default:
        break;
    }
  }

  async stop() {
    console.log(`[${this.name}] Saving chat history...`);
  }
}

export default AIChatPlugin;

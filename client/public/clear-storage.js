// Clear localStorage to fix stats showing 0
console.log('🎮 Character Tap Game - Clearing localStorage to reset stats...');

// Clear all game-related localStorage
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.includes('characterTapGame') || key.includes('gameState') || key.includes('playerData'))) {
    keysToRemove.push(key);
  }
}

keysToRemove.forEach(key => {
  console.log(`Removing: ${key}`);
  localStorage.removeItem(key);
});

console.log('✅ Stats reset complete! Please refresh the page.');
alert('Game stats have been reset! Please refresh the page to see updated values.');
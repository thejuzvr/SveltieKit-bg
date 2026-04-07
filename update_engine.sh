sed -i 's/export interface EngineServices {/export interface EngineServices {\n    getQuest?: any;\n    setTaskStatus?: any;\n    updateQuestProgress?: any;\n    completeQuest?: any;\n    applyRewardsToCharacter?: any;\n    selectQuestTemplatesForCharacter?: any;\n    createQuestFromTemplate?: any;\n    acceptQuest?: any;\n    getActiveQuest?: any;\n    setActiveQuest?: any;\n    listInProgressQuests?: any;\n    autoSelectNextQuest?: any;/g' src/lib/ai/game-engine.ts

# We also need to pass the services from processGameTick to processCharacterTurn.
# First, let's find where processCharacterTurn is called in src/lib/ai/game-engine.ts
# and add services to the arguments.

sed -i 's/const result = await processCharacterTurn(updatedChar, gameData);/const result = await processCharacterTurn(updatedChar, { ...gameData, services } as any);/g' src/lib/ai/game-engine.ts

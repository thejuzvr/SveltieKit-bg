sed -i 's/const { getQuest, setTaskStatus, updateQuestProgress, completeQuest, applyRewardsToCharacter } = svc as any;/const { getQuest, setTaskStatus, updateQuestProgress, completeQuest, applyRewardsToCharacter } = gameData.services as any;/g' src/lib/ai/brain.ts
sed -i 's/const { autoSelectNextQuest } = svc as any;/const { autoSelectNextQuest } = gameData.services as any;/g' src/lib/ai/brain.ts
sed -i 's/const svc = await import('\''@\/services\/questService'\'');/ /g' src/lib/ai/brain.ts
sed -i 's/const svc = await import('\''$lib\/services\/questService'\'');/ /g' src/lib/ai/brain.ts
sed -i 's/const { selectQuestTemplatesForCharacter, createQuestFromTemplate, acceptQuest, getActiveQuest, setActiveQuest, listInProgressQuests, autoSelectNextQuest } = svc as any;/const { selectQuestTemplatesForCharacter, createQuestFromTemplate, acceptQuest, getActiveQuest, setActiveQuest, listInProgressQuests, autoSelectNextQuest, setTaskStatus } = gameData.services as any;/g' src/lib/ai/brain.ts

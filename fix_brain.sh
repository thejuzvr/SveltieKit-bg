sed -i 's/gameData.services as any/services as any/g' src/lib/ai/brain.ts
sed -i 's/const { setTaskStatus } = svc as any;/const { setTaskStatus } = services as any;/g' src/lib/ai/brain.ts
sed -i 's/const { autoSelectNextQuest } = svc as any;/const { autoSelectNextQuest } = services as any;/g' src/lib/ai/brain.ts

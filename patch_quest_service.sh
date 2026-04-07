cat << 'INNER_EOF' >> src/lib/services/questService.ts

export const getActiveQuest = async (charId: string) => null;
export const setActiveQuest = async (charId: string, questId: string) => {};
export const listInProgressQuests = async (charId: string) => [];
export const selectQuestTemplatesForCharacter = async (char: any) => [];
export const createQuestFromTemplate = async (char: any, template: any, accept: boolean) => null;
export const acceptQuest = async (questId: string, setAsActive: boolean) => ({ ok: true });
export const updateQuestProgress = async (questId: string, progress: number) => {};
INNER_EOF

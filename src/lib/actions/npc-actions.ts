export interface ActionResult {
    success: boolean;
    message: string;
    relationshipChange?: number;
    error?: string;
}

export const interactWithNPC = async (characterId: string, npcId: string): Promise<ActionResult> => {
    return { success: true, message: "Вы пообщались с NPC", relationshipChange: 2 };
};

export const tradeWithNPC = async (
    characterId: string, 
    npcId: string, 
    action: 'buy' | 'sell', 
    itemId: string, 
    quantity: number
): Promise<ActionResult> => {
    return { success: true, message: `Вы ${action === 'buy' ? 'купили' : 'продали'} предмет` };
};

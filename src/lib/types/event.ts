
export type GameEventType = 'combat' | 'item' | 'npc' | 'narrative' | 'discovery' | 'hazard' | 'social';

export interface GameEvent {
    id: string;
    type: GameEventType;
    description: string; // "You meet a traveling merchant on the road."
    chance: number; // 0-1 chance to occur on a travel leg
    seasons?: ('Summer' | 'Autumn' | 'Winter' | 'Spring')[]; // Optional seasons when this can happen
    
    // Specific data based on type
    enemyId?: string;
    itemId?: string;
    itemQuantity?: number;
    npcId?: string;

    // Advanced triggers
    combatTrigger?: {
        enemyIds: string[];
        count: { min: number, max: number };
    };

    // Outcomes
    rewards?: {
        gold?: { min: number, max: number };
        items?: Array<{ pool: string[], chance: number }>;
    };
    
    effects?: Array<{
        type: 'buff' | 'debuff' | 'permanent';
        stat: string;
        amount: number;
        duration: number;
    }>;

    damage?: { min: number, max: number };
}

export interface CityEvent {
    id: string;
    description: string; // Narrative description of the event
    locationIds?: string[]; // If not provided, can happen in any city
}

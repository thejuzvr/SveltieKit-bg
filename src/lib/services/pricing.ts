import type { CharacterInventoryItem } from "$lib/types/character";

export const computeBaseValue = (item: CharacterInventoryItem): number => {
    // Basic value logic based on weight and type
    const baseValue = item.weight * 10;
    if (item.type === 'potion') return 50;
    if (item.type === 'weapon') return 100 + (item.damage || 0) * 10;
    if (item.type === 'armor') return 150 + (item.armor || 0) * 15;
    return Math.max(1, baseValue);
};

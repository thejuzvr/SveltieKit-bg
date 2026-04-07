import type { Character } from "$lib/types/character";

/**
 * Calculates and updates Prana (Intervention Power) based on elapsed time.
 * Formula: 100% recovery (from 0 to max) in 15 minutes (900,000 ms).
 * 
 * This ensures Prana is "fresh" even between game engine ticks.
 */
export function refreshInterventionPower(character: Character): Character {
    const now = Date.now();
    const maxPow = character.interventionPower.max || 100;
    const curPow = character.interventionPower.current || 0;
    const lastAt = character.interventionPower.lastRegenAt || now;

    // 15 minutes = 900,000 ms
    const msPassed = Math.max(0, now - lastAt);
    if (msPassed > 0 && curPow < maxPow) {
        const gain = (msPassed / 900000) * maxPow;
        character.interventionPower.current = Math.min(maxPow, curPow + gain);
        character.interventionPower.lastRegenAt = now;
    } else if (!character.interventionPower.lastRegenAt) {
        character.interventionPower.lastRegenAt = now;
    }

    return character;
}

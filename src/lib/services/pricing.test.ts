import { test } from 'node:test';
import assert from 'node:assert';
import { computeBaseValue } from './pricing.ts';
import type { CharacterInventoryItem } from '$lib/types/character';

const createItem = (overrides: Partial<CharacterInventoryItem>): CharacterInventoryItem => {
    return {
        id: 'test-item',
        name: 'Test Item',
        weight: 1,
        quantity: 1,
        type: 'misc',
        ...overrides
    } as CharacterInventoryItem;
};

test('computeBaseValue - potion', () => {
    const item = createItem({ type: 'potion', weight: 5 });
    // Potions have a flat value of 50, ignoring weight
    assert.strictEqual(computeBaseValue(item), 50);
});

test('computeBaseValue - weapon', () => {
    const itemWithDamage = createItem({ type: 'weapon', weight: 5, damage: 10 });
    // 100 + (10 * 10) = 200
    assert.strictEqual(computeBaseValue(itemWithDamage), 200);

    const itemNoDamage = createItem({ type: 'weapon', weight: 5 });
    // 100 + (0 * 10) = 100
    assert.strictEqual(computeBaseValue(itemNoDamage), 100);
});

test('computeBaseValue - armor', () => {
    const itemWithArmor = createItem({ type: 'armor', weight: 10, armor: 5 });
    // 150 + (5 * 15) = 225
    assert.strictEqual(computeBaseValue(itemWithArmor), 225);

    const itemNoArmor = createItem({ type: 'armor', weight: 10 });
    // 150 + (0 * 15) = 150
    assert.strictEqual(computeBaseValue(itemNoArmor), 150);
});

test('computeBaseValue - misc', () => {
    const item = createItem({ type: 'misc', weight: 2 });
    // weight * 10 = 20
    assert.strictEqual(computeBaseValue(item), 20);
});

test('computeBaseValue - food', () => {
    const item = createItem({ type: 'food', weight: 0.5 });
    // weight * 10 = 5
    assert.strictEqual(computeBaseValue(item), 5);
});

test('computeBaseValue - gold', () => {
    const item = createItem({ type: 'gold', weight: 0 });
    // Math.max(1, 0 * 10) = 1
    assert.strictEqual(computeBaseValue(item), 1);
});

test('computeBaseValue - spell_tome', () => {
    const item = createItem({ type: 'spell_tome', weight: 1 });
    // weight * 10 = 10
    assert.strictEqual(computeBaseValue(item), 10);
});

test('computeBaseValue - min value', () => {
    const item = createItem({ type: 'misc', weight: 0 });
    assert.strictEqual(computeBaseValue(item), 1);

    const lightItem = createItem({ type: 'misc', weight: 0.05 });
    // 0.05 * 10 = 0.5 -> max(1, 0.5) = 1
    assert.strictEqual(computeBaseValue(lightItem), 1);
});

test('computeBaseValue - heavy item', () => {
    const item = createItem({ type: 'misc', weight: 100 });
    assert.strictEqual(computeBaseValue(item), 1000);
});

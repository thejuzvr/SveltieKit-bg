export interface GameData {
	items: any[];
	enemies: any[];
	locations: any[];
	npcs: any[];
	quests: any[];
	events: any[];
	cityEvents: any[];
	sovngardeQuests: any[];
}

export const gameDataService = {
	async getAllThoughts() {
		return [];
	},
	async decreaseLocationDanger(locationId: string, amount: number) {
		return 0;
	}
};

export async function fetchGameData(): Promise<GameData> {
	return {
		items: [],
		enemies: [],
		locations: [],
		npcs: [],
		quests: [],
		events: [],
		cityEvents: [],
		sovngardeQuests: []
	}
}

export const listRecipes = async () => [];
export const performCraft = async (character: any, recipeId: string): Promise<any> => ({ character, log: 'Эффект крафта (заглушка)', error: null });
export const craftingService = { listRecipes, performCraft };

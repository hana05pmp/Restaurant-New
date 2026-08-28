const API_BASE_URL = "http://127.0.0.1:8000";
export type ApiMenuItem = {
  MenuItemName: string;
  MenuItemDescription: string;
  PLU: number;
  MenuItemId: number;
  RecipeId: number;
};

export async function getMenuItems(): Promise<ApiMenuItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/menu`);

  if (!response.ok) {
    throw new Error(`Failed to load menu: ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("Invalid menu data received from API");
  }

  return data;
}
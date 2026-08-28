import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Dish } from "@/lib/data";

export type CartItem = {
  dish: Dish;
  quantity: number;
};

type CartStore = {
  items: CartItem[];

  addItem: (dish: Dish) => void;
  removeItem: (dishId: string) => void;
  increase: (dishId: string) => void;
  decrease: (dishId: string) => void;
  clearCart: () => void;
};

export const useCart = create<CartStore>()(
  persist(
    (set) => ({
      items: [],

      addItem: (dish) =>
        set((state) => {
          const existing = state.items.find(
            (item) => item.dish.id === dish.id,
          );

          if (existing) {
            return {
              items: state.items.map((item) =>
                item.dish.id === dish.id
                  ? {
                      ...item,
                      quantity: item.quantity + 1,
                    }
                  : item,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                dish,
                quantity: 1,
              },
            ],
          };
        }),

      removeItem: (dishId) =>
        set((state) => ({
          items: state.items.filter(
            (item) => item.dish.id !== dishId,
          ),
        })),

      increase: (dishId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.dish.id === dishId
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                }
              : item,
          ),
        })),

      decrease: (dishId) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.dish.id === dishId
                ? {
                    ...item,
                    quantity: item.quantity - 1,
                  }
                : item,
            )
            .filter((item) => item.quantity > 0),
        })),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: "ember-oak-cart",
    },
  ),
);
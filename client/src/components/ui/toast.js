import { create } from "zustand";

export const useToastStore = create(() => ({ items: [] }));
export const dismiss = (id) => useToastStore.setState((state) => ({ items: state.items.filter((item) => item.id !== id) }));

export function toast(message, type = "info", duration = 3500) {
  const id = `${Date.now()}-${Math.random()}`;
  useToastStore.setState((state) => ({ items: [...state.items.slice(-3), { id, message, type }] }));
  if (duration) window.setTimeout(() => dismiss(id), duration);
  return id;
}

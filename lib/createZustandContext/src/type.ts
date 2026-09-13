import type { StoreApi } from "zustand";

export type StoreCreator<State, Props = void> = (
  initialState?: Props,
) => StoreApi<State>;

import { createContext, useContext, useRef } from "react";
import { type StoreApi, useStore } from "zustand";
import type { StoreCreator } from "./type";

export function createZustandContext<State, Props = void>(
  creator: StoreCreator<State, Props>,
) {
  const StoreContext = createContext<StoreApi<State> | null>(null);

  const StoreProvider = ({
    children,
    props,
  }: {
    children: React.ReactNode;
    props?: Props;
  }) => {
    const store = useRef<StoreApi<State> | null>(null);
    if (!store.current) {
      store.current = creator(props);
    }
    return (
      <StoreContext.Provider value={store.current}>
        {children}
      </StoreContext.Provider>
    );
  };

  function StoreSelector<SelectorReturnType>(
    selector: (state: State) => SelectorReturnType,
  ): SelectorReturnType {
    const store = useContext(StoreContext);
    if (!store) {
      throw new Error("Store not found");
    }
    return useStore(store, selector);
  }

  function Store(): StoreApi<State> {
    const store = useContext(StoreContext);
    if (!store) {
      throw new Error("Store not found");
    }
    return store;
  }

  return [StoreProvider, StoreSelector, Store] as const;
}

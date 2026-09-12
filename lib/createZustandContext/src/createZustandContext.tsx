import { StoreApi, useStore } from "zustand";
import { StoreCreator } from "./type";
import { createContext, useContext, useRef } from "react";

export function createZustandContext<State, Props = void>(creator: StoreCreator<State, Props>) {
    const StoreContext = createContext<StoreApi<State> | null>(null);

    const StoreProvider = ({ children, props }: { children: React.ReactNode, props?: Props }) => {
        const store = useRef<StoreApi<State> | null>(null);
        if (!store.current) {
            store.current = creator(props);
        }
        return <StoreContext.Provider value={store.current}>{children}</StoreContext.Provider>
    }

    function StoreSelector<SelectorReturnType>(selector: (state: State) => SelectorReturnType): SelectorReturnType{
        const store = useContext(StoreContext);
        if (!store) {
            throw new Error("Store not found");
        }
        return useStore(store, selector);
    }

    return [StoreProvider, StoreSelector] as const;
}
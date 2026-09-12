import { useRef } from "react";

export function usePersistentCallback<Args extends unknown[], R>(
    callback: (...args: Args) => R
): (...args: Args) => R {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;
    const persistentCallbackRef = useRef((...args: Args): R => {
        return callbackRef.current(...args);
    });
    return persistentCallbackRef.current;
}
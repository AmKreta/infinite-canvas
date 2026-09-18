import { useCallback, useRef } from "react";

export const useRAFThrottledFn = (fn: (...args: any[]) => void) => {
    const rafRef = useRef<number | null>(null);

    const cancel = useCallback(() => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    }, []);

    const cb = useCallback((...args: any[]) => {
        cancel();
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            fn(...args);
        });
    }, [fn, cancel]);

    return [cb, cancel] as const;
};
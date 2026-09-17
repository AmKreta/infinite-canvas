import { useCallback, useRef } from "react";

export const useRAFThrottledFn = (fn: (...args: any[]) => void) => {
    const rafRef = useRef<number | null>(null);

    const cancel = () => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    };

    const cb = useCallback((...args: any[]) => {
        cancel();
        rafRef.current = requestAnimationFrame(() => {
            fn(...args);
        });
    }, [fn]);

    return [cb, cancel];
};
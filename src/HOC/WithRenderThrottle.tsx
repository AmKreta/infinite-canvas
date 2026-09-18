

import React, { useEffect, useRef, useState } from "react";

export default function withRenderThrottle<T extends object>(Component: React.FunctionComponent<T>, interval = 200) {
    const Memoized = React.memo(Component);

    function Throttled(props: T) {
        const [throttledProps, setThrottledProps] = useState(props);
        const latestProps = useRef(props);
        const lastRenderTime = useRef(Date.now());
        const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

        useEffect(() => {
            latestProps.current = props;
            const elapsed = Date.now() - lastRenderTime.current;
            if (elapsed >= interval) {
                lastRenderTime.current = Date.now();
                setThrottledProps(props);
            } else if (timeoutId.current === null) {
                clearTimeout(timeoutId.current!);
                timeoutId.current = setTimeout(() => {
                    timeoutId.current = null;
                    lastRenderTime.current = Date.now();
                    setThrottledProps(latestProps.current);
                    clearTimeout(timeoutId.current!);
                }, interval - elapsed);
            }
        }, [props]);
        useEffect(() => () => clearTimeout(timeoutId.current!), []);
        return <Memoized {...throttledProps} />;
    }

    return Throttled;
}
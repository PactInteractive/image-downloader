import { useCallback, useEffect, useRef } from '../html.js';

export const useDebouncedCallback = (delayInMs, callback, dependencies) => {
  const timeoutIdRef = useRef(null);
  const argsRef = useRef(null);

  const debouncedCallback = useCallback(
    (...args) => {
      clearTimeout(timeoutIdRef.current);
      argsRef.current = args;

      timeoutIdRef.current = setTimeout(() => {
        timeoutIdRef.current = null;
        callback(...args);
      }, delayInMs);
    },
    [delayInMs, ...dependencies]
  );

  return debouncedCallback;
};

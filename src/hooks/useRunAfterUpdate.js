import { useLayoutEffect, useRef } from '../html.js';

export const useRunAfterUpdate = () => {
  const handlersRef = useRef([]);

  useLayoutEffect(() => {
    handlersRef.current.forEach((handler) => handler());
    handlersRef.current = [];
  });

  return (handler) => {
    handlersRef.current.push(handler);
  };
};

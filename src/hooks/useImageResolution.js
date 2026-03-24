import { useCallback, useState } from '../html.js';

export const useImageResolution = () => {
  const [resolution, setResolution] = useState({
    width: 0,
    height: 0,
    ready: false,
    error: false,
  });

  const onLoad = useCallback((event) => {
    const img = event.currentTarget;
    setResolution({
      width: img.naturalWidth,
      height: img.naturalHeight,
      ready: true,
      error: false,
    });
  }, []);

  const onError = useCallback(() => {
    setResolution({
      width: 0,
      height: 0,
      ready: true,
      error: true,
    });
  }, []);

  const resetResolution = useCallback(() => {
    setResolution({
      width: 0,
      height: 0,
      ready: false,
      error: false,
    });
  }, []);

  return {
    resolution,
    onLoad,
    onError,
    resetResolution,
  };
};

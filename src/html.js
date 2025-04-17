import htm from '../lib/htm.js';
import '../lib/react-18.3.1.min.js';
import '../lib/react-dom-18.3.1.min.js';

const html = htm.bind(React.createElement);
export default html;

// React hooks
export const useCallback = React.useCallback;
export const useEffect = React.useEffect;
export const useLayoutEffect = React.useLayoutEffect;
export const useMemo = React.useMemo;
export const useRef = React.useRef;
export const useState = React.useState;

// React DOM
export const render = ReactDOM.render;

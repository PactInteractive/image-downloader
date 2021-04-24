import htm from '../lib/htm.js';
import '../lib/react-17.0.2.min.js';
import '../lib/react-dom-17.0.2.min.js';

const html = htm.bind(React.createElement);
export default html;

// React hooks
export const useEffect = React.useEffect;
export const useState = React.useState;

// React DOM
export const render = ReactDOM.render;

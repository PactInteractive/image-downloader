// @ts-check
import htm from '../lib/htm.mjs';
import { h } from '../lib/preact.module.js';
export { useEffect, useLayoutEffect, useMemo, useRef } from '../lib/hooks.module.js';
export { render } from '../lib/preact.module.js';
export { For, Show, useLiveSignal, useSignalRef } from '../lib/utils.module.js';
export { action, computed, effect, signal, useComputed, useSignal, useSignalEffect } from '../lib/signals.module.js';

const html = htm.bind(h);
export default html;

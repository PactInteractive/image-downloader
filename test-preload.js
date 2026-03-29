require('@happy-dom/global-registrator').GlobalRegistrator.register();

const path = require('path');
const manifest = require('./manifest.json');

// Pre-populate require.cache so require("react") returns the custom build
// This is needed because react-dom's UMD wrapper calls require("react"),
// and node_modules/react lacks the bundled Scheduler that react-dom expects.
const customReactPath = path.resolve(__dirname, 'lib/react-18.3.1.min.js');
const customReact = require(customReactPath);
const reactResolved = require.resolve('react');
require.cache[reactResolved] = {
	id: reactResolved,
	filename: reactResolved,
	loaded: true,
	exports: customReact,
	path: path.dirname(reactResolved),
	children: [],
	parent: null,
	isPreloaded: false,
	require: require,
};
globalThis.React = customReact;

// Same for react-dom
const customReactDomPath = path.resolve(__dirname, 'lib/react-dom-18.3.1.min.js');
const customReactDom = require(customReactDomPath);
const reactDomResolved = require.resolve('react-dom');
require.cache[reactDomResolved] = {
	id: reactDomResolved,
	filename: reactDomResolved,
	loaded: true,
	exports: customReactDom,
	path: path.dirname(reactDomResolved),
	children: [],
	parent: null,
	isPreloaded: false,
	require: require,
};
globalThis.ReactDOM = customReactDom;

// Set up chrome API mock
globalThis.chrome = {
	runtime: {
		getManifest: () => manifest,
	},
};

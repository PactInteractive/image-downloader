/** @type {<T>(array: T[]) => (item: T) => boolean} */
export const isIncludedIn = (array) => (item) => array.includes(item);

/** @type {<T>(array: T[]) => (item: T) => boolean} */
export const isNotIncludedIn = (array) => (item) => !array.includes(item);

/** @type {<T>(value1: T) => (value2: T) => boolean} */
export const isStrictEqual = (value1) => (value2) => value1 === value2;

/** @type {<T>(value1: T) => (value2: T) => boolean} */
export const isNotStrictEqual = (value1) => (value2) => value1 !== value2;

/** @type {<T>(value: T) => value is NonNullable<T>} */
export const isTruthy = (value) => !!value;

/** @type {(value: string) => string} */
export const removeSpecialCharacters = (value) => value.replace(/[<>:"|?*]/g, '');

/** @type {(e: Event) => void} */
export const stopPropagation = (e) => e.stopPropagation();

/** @type {<T>(values: T[]) => T[]} */
export const unique = (values) => [...new Set(values)];

// Signals
export const increment = (/** @type {{ value: number }} */ signal) => () => signal.value++;

export const decrement = (/** @type {{ value: number }} */ signal) => () => signal.value--;

export const toggle = (/** @type {{ value: boolean }} */ signal) => () => (signal.value = !signal.value);

export const setToCheckboxValue = (/** @type {{ value: boolean }} */ signal) => (/** @type {Event} */ e) => {
	signal.value = /** @type {HTMLInputElement} */ (e.currentTarget).checked;
};

export const setToInvertedCheckboxValue = (/** @type {{ value: boolean }} */ signal) => (/** @type {Event} */ e) => {
	signal.value = !(/** @type {HTMLInputElement} */ (e.currentTarget).checked);
};

export const getReferralUrl = (/** @type {string} */ origin, /** @type {Object} */ params) => `${origin}/?${new URLSearchParams({
	utm_source: 'image_downloader',
	utm_medium: 'chrome_extension',
	utm_campaign: 'internal_referral',
	...params,
}).toString()}`;
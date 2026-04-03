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

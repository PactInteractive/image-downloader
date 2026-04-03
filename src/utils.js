export const add = (a) => (b) => a + b;

export const isIncludedIn = (array) => (item) => array.includes(item);
export const isNotIncludedIn = (array) => (item) => !array.includes(item);

export const isStrictEqual = (value1) => (value2) => value1 === value2;
export const isNotStrictEqual = (value1) => (value2) => value1 !== value2;

export const isTruthy = (value) => !!value;

export const removeSpecialCharacters = (value) => value.replace(/[<>:"|?*]/g, '');

export const stopPropagation = (e) => e.stopPropagation();

export const unique = (values) => [...new Set(values)];

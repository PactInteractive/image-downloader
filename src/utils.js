export const isStrictEqual = (value1) => (value2) => value1 === value2;
export const isNotStrictEqual = (value1) => (value2) => value1 !== value2;

export const isIncludedIn = (array) => (item) => array.includes(item);

export const stopPropagation = (e) => e.stopPropagation();

export const removeSpecialCharacters = (value) => {
  return value.replace(/[<>:"\/\\\|\?\*]/g, '');
};

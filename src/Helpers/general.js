export const removeFromArray = (list, value) => list.filter(element => element !== value);

export const addToArray = (list, value) => [...list, value];

export const updateArray = (list, value) => {
  if (list.includes(value)) {
    return removeFromArray(list, value);
  }
  return addToArray(list, value);
};

export const removeHtmlFromString = string => (string.replace(/<(?:.|\n)*?>/gm, ''));

const getSum = (array, key) => (array.reduce((sum, item) => sum + item[key], 0));

export const getAvrage = (array, key) => (
  (getSum(array, key) / array.length).toFixed(1)
);

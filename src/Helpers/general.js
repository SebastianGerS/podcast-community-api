export const removeFromArray = (list, value) => list.filter(element => element !== value);

export const addToArray = (list, value) => [...list, value];

export const updateArray = (list, value) => {
  if (list.includes(value)) {
    return removeFromArray(list, value);
  }
  return addToArray(list, value);
};

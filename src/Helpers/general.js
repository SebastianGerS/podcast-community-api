import R from 'ramda';

export const removeFromArray = (list, value) => (
  list.filter(element => element.toString() !== value.toString())
);

export const addToArray = (list, value) => [...list, value];

export const updateArray = (list, value) => {
  const stringifyedList = list.map(item => item.toString());
  if (stringifyedList.includes(value.toString())) {
    const removed = removeFromArray(list, value);
    return removed;
  }
  const added = addToArray(list, value);
  return added;
};

const getSum = (array, key) => (array.reduce((sum, item) => sum + item[key], 0));

export const getAvrage = (array, key) => (
  (getSum(array, key) / array.length).toFixed(1)
);

export const reduceToString = (array, separator) => {
  const stringifiedArray = array.reduce((acumulator, item, index) => {
    if (index === 0 && array.length > 1) {
      return `${item}${separator}`;
    } if (index === array.length - 1) {
      return `${acumulator}${separator}${item}`;
    }

    return `${acumulator}${separator}${item}`;
  });

  return stringifiedArray;
};


export const getSecondsFromTimeString = (string) => {
  const [h, m, s] = string.split(':');

  return +((+h * 60 * 60) + (+m * 60) + (+s));
};

export function UTCStringToTime(timeString) {
  return timeString.substr(17, 8);
}

export function getMillisecondsleft(currentTime, awaitedTime) {
  let timeLeft;
  if (currentTime < awaitedTime) {
    timeLeft = awaitedTime - currentTime;
  } else if (currentTime > awaitedTime) {
    timeLeft = 1000 * 60 * 60 * 24 - (currentTime - awaitedTime);
  } else {
    timeLeft = 0;
  }

  return timeLeft;
}

export const OrderByDate = R.sortWith([R.descend(R.prop('date'))]);

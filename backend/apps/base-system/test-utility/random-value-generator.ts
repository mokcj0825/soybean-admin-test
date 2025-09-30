type AcceptableInputTypes =
  | 'string'
  | 'number'
  | 'boolean'
  | 'stringArray'
  | 'date';

type ExpectedOutputTypes<T extends AcceptableInputTypes> = T extends 'string'
  ? string
  : T extends 'number'
    ? number
    : T extends 'boolean'
      ? boolean
      : T extends 'stringArray'
        ? string[]
        : T extends 'date'
          ? Date
          : never;

export const randomValueGenerator = <T extends AcceptableInputTypes>(
  type: T,
): ExpectedOutputTypes<T> => {
  switch (type) {
    case 'string':
      return Math.random().toString(36).substring(2, 12) as ExpectedOutputTypes<T>;
    case 'number':
      return Math.floor(Math.random() * 1000) as ExpectedOutputTypes<T>;
    case 'boolean':
      return (Math.random() < 0.5) as ExpectedOutputTypes<T>;
    case 'stringArray': {
      const arrayLength = Math.floor(Math.random() * (10 - 2 + 1)) + 2;
      return Array.from({ length: arrayLength }, () =>
        Math.random().toString(36).substring(2, 12),
      ) as ExpectedOutputTypes<T>;
    }
    case 'date': {
      const start = new Date(1975, 0, 1).getTime();
      const end = new Date().getTime(); // Now
      const randomTime = Math.floor(Math.random() * (end - start)) + start;
      return new Date(randomTime) as ExpectedOutputTypes<T>;
    }
    default:
      throw new Error('Unsupported value type');
  }
};

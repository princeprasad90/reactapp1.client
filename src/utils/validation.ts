export const validateRelatedFields = <T>(
  a: T,
  b: T,
  predicate: (a: T, b: T) => boolean,
  message: string
) => (predicate(a, b) ? null : message);

export const validateDateTime = (value: string, message: string) =>
  isNaN(Date.parse(value)) ? message : null;

export const validateRegex = (value: string, regex: RegExp, message: string) =>
  regex.test(value) ? null : message;

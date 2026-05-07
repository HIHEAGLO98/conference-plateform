export const truncateString = (str: string | null | undefined, num: number): string => {
  if (!str) return "";
  return str.length > num ? `${str.slice(0, num)}...` : str;
};
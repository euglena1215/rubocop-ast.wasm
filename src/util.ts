export const toJSLikeString = (str: string) => {
  return str.replaceAll("nil", "null");
};
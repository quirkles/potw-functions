/**
 * Generates a random string of uppercase letters.
 *
 * @param {number} length - The length of the string to generate. Defaults to 5 if not provided.
 * @return {string} A random string of the specified length.
 */
export function makeId(length: number = 5): string {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

export function mask(clear: string): string {
  return clear.split("").reduce((acc, char, index) => {
    if (index < 1) return acc + char;
    if (index > clear.length) return acc + char;
    return acc + "*";
  }, "");
}

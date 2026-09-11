import crypto from "crypto";

export const PASSWORD_GENERATOR_DEFAULTS = Object.freeze({
  length: 20,
  lowercase: true,
  uppercase: true,
  numbers: true,
  symbols: true,
});

// These printable ASCII sets avoid whitespace, quotes, backslashes, and visually
// confusing characters while remaining practical to copy and use.
const CHARACTER_SETS = Object.freeze({
  lowercase: "abcdefghijkmnopqrstuvwxyz",
  uppercase: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  numbers: "23456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?",
});

const secureCharacter = (characters) => characters[crypto.randomInt(characters.length)];

const secureShuffle = (characters) => {
  // Fisher-Yates with crypto.randomInt avoids modulo bias and weak PRNGs.
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = crypto.randomInt(index + 1);
    [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
  }
  return characters;
};

export const generatePassword = (options = PASSWORD_GENERATOR_DEFAULTS) => {
  const settings = { ...PASSWORD_GENERATOR_DEFAULTS, ...options };
  const enabledCategories = Object.keys(CHARACTER_SETS)
    .filter((category) => settings[category] === true);

  if (!Number.isInteger(settings.length) || settings.length < 1) {
    throw new Error("Password length must be a positive integer.");
  }
  if (enabledCategories.length === 0) {
    throw new Error("At least one character category must be enabled.");
  }
  if (settings.length < enabledCategories.length) {
    throw new Error("Password length is too short for the selected categories.");
  }

  const characters = enabledCategories.map((category) => secureCharacter(CHARACTER_SETS[category]));
  const allCharacters = enabledCategories.map((category) => CHARACTER_SETS[category]).join("");

  while (characters.length < settings.length) {
    characters.push(secureCharacter(allCharacters));
  }

  return secureShuffle(characters).join("");
};

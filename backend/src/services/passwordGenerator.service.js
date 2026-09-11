import { generatePassword } from "../utils/passwordGenerator.js";

class PasswordGeneratorService {
  generate(options) {
    // The generated value is returned directly and is never persisted or logged.
    const password = generatePassword(options);
    return {
      password,
      length: password.length,
    };
  }
}

export default new PasswordGeneratorService();

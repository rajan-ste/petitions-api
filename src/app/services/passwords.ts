import bcrypt from 'bcrypt'

/**
 * Hash a password
 * @async
 * @function hash
 * @param {string} password - The password to hash
 * @return {Promise<string>} The hashed password
 */
const hash = async (password: string): Promise<string> => {
    const saltRounds = 10;
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (err) {
        throw err;
    }
};

/**
 * compare two passwords
 * @async
 * @function compare
 * @param {string} password - The hashed password
 * @param {string} comp - The password to compare against the hash
 * @return {Promise<boolean>} True if passwords match
 */
const compare = async (password: string, comp: string): Promise<boolean> => {
    try {
        const result = await bcrypt.compare(comp, password);
        return result
    } catch (err) {
        throw err;
    }
}

export {hash, compare}
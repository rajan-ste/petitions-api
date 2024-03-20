import bcrypt from 'bcrypt'
import crypto from 'crypto'
import Logger from '../../config/logger';
import { getOne } from '../models/user.model';

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
 * Compare two passwords
 * @async
 * @function compare
 * @param {string} hashedPassword - The hashed password
 * @param {string} comp - The password to compare against the hash
 * @return {Promise<boolean>} True if passwords match
 */
const compare = async (hashedPassword: string, comp: string): Promise<boolean> => {
    try {
        const result = await bcrypt.compare(comp, hashedPassword);
        return result
    } catch (err) {
        throw err;
    }
};

/**
 * Generate an auth token for a user
 * @async
 * @function genToken
 * @return {Promise<string>} The auth token
 */
const genToken = async (): Promise<string> => {
    try {
        const buffer = crypto.randomBytes(48);
        return buffer.toString('hex');
    } catch (err) {
        Logger.error('Error generating token:', err);
        throw new Error('Failed to generate token');
    }
};

/**
 * Validate an incoming auth token
 * @param id user id
 * @param tokenToValidate the token to validate
 * @returns {Promise<boolean>} true if token is valid
 */
const validateToken = async (id: number, tokenToValidate: string): Promise<boolean> => {
    try {
        const result = await getOne(id);
        const user = result[0];
        return user.auth_token === tokenToValidate;
    } catch (err) {
        throw err;
    }
}

/**
 * Generate a filename for an image
 * @async
 * @function genFileName
 * @return {Promise<string>} The filename
 */
const genFileName = async (): Promise<string> => {
    try {
        const buffer = crypto.randomBytes(16);
        return buffer.toString('hex');
    } catch (err) {
        Logger.error('Error generating filename:', err);
        throw new Error('Failed to generate filename');
    }
};

export { hash, compare, genToken, validateToken, genFileName }
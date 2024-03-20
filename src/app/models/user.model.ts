import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2'


const insert = async (email: string, firstName: string, lastName: string, password: string): Promise<ResultSetHeader> => {
    Logger.info(`Adding user ${email} to the database`);
    const conn = await getPool().getConnection();
    const query = 'insert into `user` (email, first_name, last_name, password) values ( ?, ?, ?, ? )';
    const [ result ] = await conn.query( query, [ email, firstName, lastName, password ] );
    await conn.release();
    return result;
}

const getOne = async (id: number): Promise<User[]> => {
    Logger.info(`Getting user ${id} from the database`)
    const conn = await getPool().getConnection();
    const query = 'select * from `user` where id = ?';
    const [ rows ] = await conn.query( query, [ id ]);
    await conn.release();
    return rows;
}

const emailExists = async (email: string): Promise<boolean> => {
    Logger.info(`Validating email ${email}`)
    const conn = await getPool().getConnection();
    const query = 'select count(*) as count from user where email = ?';
    const [ rows ] = await conn.query( query, [ email ]);
    await conn.release();
    return rows[0].count > 0;
}

const getPass = async (email: string): Promise<User[]> => {
    Logger.info(`Validating user with email: ${email}`)
    const conn = await getPool().getConnection();
    const query = 'select password from `user` where email = ?';
    const [ rows ] = await conn.query( query, [ email ]);
    await conn.release();
    return rows;
}

const authUser = async (email: string, token: string): Promise<number> => {
    Logger.info(`Authenticating user with email: ${email}`)
    const conn = await getPool().getConnection();
    const selectQuery = 'SELECT id FROM `user` WHERE email = ?';
    const [users] = await conn.query(selectQuery, [email]);

    const userId = users[0].id;

    const updateQuery = 'UPDATE `user` SET auth_token = ? WHERE email = ?';
    await conn.query(updateQuery, [token, email]);

    await conn.release();
    return userId;
};

/**
 * return true if user was logged out else false
 */
const logOut = async (token: string): Promise<boolean> => {
    Logger.info(`Logging out user`)
    const conn = await getPool().getConnection();
    const query = 'select id from `user` where auth_token = ?';
    const [ users ] = await conn.query(query, [ token ]);

    // if no user was found for given auth_token
    if (users.length === 0) {
        await conn.release();
        return false;
    }

    const userId = users[0].id;
    const logoutQuery = 'update `user` set auth_token = NULL where id = ?';
    await conn.query(logoutQuery, [ userId ]);
    await conn.release();
    return true;
}

const updateUser = async (newData: Partial<User>, id: number): Promise<ResultSetHeader> => {
    Logger.info(`Updating users info`)
    let query = 'UPDATE `user` SET ';
    const values = [];
    const toUpdate = [];

    // Dynamically build the set part of the query based on newData fields
    for (const [key, value] of Object.entries(newData)) {
        toUpdate.push(`${key} = ?`);
        values.push(value);
    }
    query += toUpdate.join(', ') + ' WHERE id = ?';
    values.push(id);

    const conn = await getPool().getConnection();
    const [ result ] = await conn.query(query, values);
    await conn.release();
    return result;
}

/**
 * @async
 * @param id id of user to check
 * @returns true if user exists
 */
const userExists = async (id: number): Promise<boolean> => {
    Logger.info(`Validating user ${id}`)
    const conn = await getPool().getConnection();
    const query = 'select count(*) as count from user where id = ?';
    const [ rows ] = await conn.query( query, [ id ]);
    await conn.release();
    return rows[0].count > 0;
}

export { insert, getOne, emailExists, getPass, authUser, logOut, updateUser, userExists }
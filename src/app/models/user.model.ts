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
    const query = 'select first_name, last_name, email from `user` where id = ?';
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
    const conn = await getPool().getConnection();
    const selectQuery = 'SELECT id FROM `user` WHERE email = ?';
    const [users] = await conn.query(selectQuery, [email]);

    const userId = users[0].id;

    const updateQuery = 'UPDATE `user` SET auth_token = ? WHERE email = ?';
    await conn.query(updateQuery, [token, email]);

    await conn.release();
    return userId;
};

export { insert, getOne, emailExists, getPass, authUser }
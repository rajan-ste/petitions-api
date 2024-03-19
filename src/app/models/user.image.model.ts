import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2'

const getOne = async (id: number): Promise<string | null> => {
    Logger.info(`Getting image for user ${id} from the database`)
    const conn = await getPool().getConnection();
    const query = 'select image_filename from `user` where id = ?';
    const [ rows ] = await conn.query( query, [ id ]);
    await conn.release();
    return rows.length > 0 ? rows[0].image_filename : null;
}

export { getOne }
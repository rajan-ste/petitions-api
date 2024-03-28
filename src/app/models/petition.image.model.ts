import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';

const getOne = async (id: number): Promise<string> => {
    const conn = await getPool().getConnection();
    const query = `select image_filename from petition where id = ?`;
    const [ rows ] = await conn.query( query, [ id ] );
    await conn.release();
    return rows.length > 0 ? rows[0].image_filename : null;
}

/**
 *
 * @param id
 * @param imageFileName
 * @returns true if the user had no profile image before the update
 */
const updateOne = async (id: number, imageFileName: string): Promise<boolean> => {
    Logger.info(`Updating hero image for petition ${id}`)
    const conn = await getPool().getConnection();
    let hadImage = true;

    const selectQuery = 'SELECT image_filename FROM petition WHERE id = ?';
    const [users] = await conn.query(selectQuery, [id]);
    const userImage = users[0].image_filename;
    if (userImage === null) {
        hadImage = false;
    }

    const query = 'update petition set image_filename = ? where id = ?';
    const [ result ] = await conn.query( query, [ imageFileName, id ] );
    await conn.release();
    return hadImage;
}

export { getOne, updateOne }
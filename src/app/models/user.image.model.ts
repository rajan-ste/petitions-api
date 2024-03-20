import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';

const getOne = async (id: number): Promise<string | null> => {
    Logger.info(`Getting image for user ${id} from the database`)
    const conn = await getPool().getConnection();
    const query = 'select image_filename from `user` where id = ?';
    const [ rows ] = await conn.query( query, [ id ]);
    await conn.release();
    return rows.length > 0 ? rows[0].image_filename : null;
}

/**
 *
 * @param id
 * @param imageFileName
 * @returns true if the user had no profile image before the update
 */
const updateImage = async (id: number, imageFileName: string): Promise<boolean> => {
    Logger.info(`Updating profile image for user ${id}`)
    const conn = await getPool().getConnection();
    let hadImage = true;

    const selectQuery = 'SELECT image_filename FROM `user` WHERE id = ?';
    const [users] = await conn.query(selectQuery, [id]);
    const userImage = users[0].image_filename;
    if (userImage === null) {
        hadImage = false;
    }

    const query = 'update `user` set image_filename = ? where id = ?';
    const [ result ] = await conn.query( query, [ imageFileName, id ] );
    await conn.release();
    return hadImage;
}

const deleteImage = async (id: number): Promise<ResultSetHeader> => {
    Logger.info(`Deleting profile image for user ${id}`)
    const conn = await getPool().getConnection();
    const query = 'update user set image_filename = ? where id = ?'
    const [ result ] = await conn.query( query, [ null, id ])
    await conn.release();
    return result;
}

export { getOne, updateImage, deleteImage }
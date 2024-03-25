import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';

const addOne = async (id: number, newData: Partial<supportTier>): Promise<boolean> => {
    const conn = await getPool().getConnection();
    const numTiersQuery = `select count(*) as count from support_tier where petition_id = ?`
    const [ rows ] = await conn.query( numTiersQuery, [ id ] );
    if (rows[0].count === 3) {
        return false;
    }
    const query = `insert into support_tier (petition_id, title, description, cost)
                                            values (?, ?, ?, ?)`;
    conn.query( query, [ id, newData.title, newData.description, newData.cost ] );
    await conn.release();
    return true;
}

export { addOne }
import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';

const getAll = async (id: number): Promise<supporter[]> => {
    const conn = await getPool().getConnection();
    const query = ` SELECT sp.id as supportId, sp.support_tier_id as supportTierId,
                    sp.message as message, sp.user_id as supporterId,
                    u.first_name as supporterFirstName, u.last_name as supporterLastName,
                    sp.timestamp as timestamp
                    FROM supporter sp JOIN user u ON sp.user_id = u.id
                    WHERE sp.petition_id = ?
                    ORDER BY timestamp DESC`;
    const [ rows ] = await conn.query( query, [ id ] );
    await conn.release();
    return rows;
}

const addOne = async ( petitionId: number, supportTierId: number,
                       userId: number, message: string, timestamp: string ): Promise<ResultSetHeader> => {
    const conn = await getPool().getConnection();
    const query = ` INSERT INTO supporter
                    (petition_id, support_tier_id, user_id, message, timestamp)
                    VALUES (?, ?, ?, ?, ?) `;
    const [ result ] = await conn.query(query, [ petitionId, supportTierId, userId, message, timestamp ]);
    await conn.release();
    return result;
}

// return true if user already supports petition support tier
const alreadySupports = async (petitionId: number, userId: number, supportTierId: number): Promise<boolean> => {
    const conn = await getPool().getConnection();
    const query = ` select count(*) as count from supporter where petition_id = ? and user_id = ? and support_tier_id = ?`;
    const [ result ] = await conn.query( query, [ petitionId, userId, supportTierId ] );
    await conn.release();
    return result[0].count > 0;
}

export { getAll, addOne, alreadySupports }
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

const editOne = async (petitionId: number, tierId: number, newData: Partial<supportTier>): Promise<ResultSetHeader> => {
    Logger.info(`Updating support tier info`)
    let query = 'UPDATE support_tier SET ';
    const values = [];
    const toUpdate = [];

    // Dynamically build the set part of the query based on newData fields
    if (newData.title) {
      toUpdate.push(`title = ?`);
      values.push(newData.title);
    }
    if (newData.description) {
      toUpdate.push(`description = ?`);
      values.push(newData.description);
    }
    if (newData.cost) {
      toUpdate.push(`cost = ?`);
      values.push(newData.cost);
    }
    query += toUpdate.join(', ') + ' WHERE id = ? and petition_id = ?';
    values.push(tierId, petitionId);

    const conn = await getPool().getConnection();
    const [ result ] = await conn.query(query, values);
    await conn.release();
    return result;
}

const deleteOne = async (petitionId: number, tierId: number): Promise<ResultSetHeader> => {
    Logger.info(`deleting support tier ${tierId}`);
    const conn = await getPool().getConnection();
    const query = `delete from support_tier where petition_id = ? and id = ?`;
    const [ result ] = await conn.query( query, [ petitionId, tierId ] );
    await conn.release();
    return result;
}

// true if supporters exist for a given petition support tier
const supportersExist = async (petitionId: number, tierId: number): Promise<boolean> => {
    Logger.info(`getting supporters for support tier ${tierId}`);
    const conn = await getPool().getConnection();
    const query = `select count(*) as count from supporter where petition_id = ? and support_tier_id = ?`;
    const [ rows ] = await conn.query( query, [ petitionId, tierId ] );
    return rows[0].count > 0;
}

export { addOne, editOne, deleteOne, supportersExist }
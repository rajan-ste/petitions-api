import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';

const getAll = async (  startIndex: number=0, count: number, q: string,
                        catergoryIds: string[], supportingCost: number,
                        ownerId: number, supporterId: number, sortBy: string  ): Promise<Petition[]> => {
    Logger.info(`Getting petitions from the database`)
    const conn = await getPool().getConnection();
    let query = 'SELECT * FROM petition WHERE 1=1';
    const queryParams: any[] = [];

    if (q) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      queryParams.push(`%${q}%`, `%${q}%`);
    }
    const [ rows ] = await conn.query( query, queryParams );
    const petitions = count ? rows.slice(startIndex, startIndex + count) : rows.slice(startIndex);
    await conn.release();
    return petitions;
}

export { getAll }
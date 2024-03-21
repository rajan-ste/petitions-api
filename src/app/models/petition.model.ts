import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';

const getAll = async (  q: string, categoryIds: number[], supportingCost: number,
                        ownerId: number, supporterId: number, sortBy: string  ):
                        Promise<getAllPetition[]> => {
    Logger.info(`Getting petitions from the database`)
    const conn = await getPool().getConnection();
    let query = ` SELECT p.id, p.title, p.category_id, p.owner_id, u.first_name, u.last_name,
                  COUNT(sp.petition_id) AS number_supporters, p.creation_date,
                  MIN(st.cost) AS support_cost
                  FROM petition p
                  JOIN user u ON p.owner_id = u.id
                  LEFT JOIN support_tier st ON p.id = st.petition_id
                  LEFT JOIN supporter sp ON p.id = sp.petition_id
                  WHERE 1=1 `;
    const queryParams = [];

    if (q) {
      query += ' AND (p.title LIKE ? OR p.description LIKE ?)';
      queryParams.push(`%${q}%`, `%${q}%`);
    }

    if (categoryIds) {
      const placeHolders = categoryIds.map(() => '?').join(', ');
      query += ` AND p.category_id IN (${placeHolders})`;
      categoryIds.forEach((id) => queryParams.push(id));
    }

    if (supportingCost) {
      query += ` AND st.cost <= ?`;
      queryParams.push(supportingCost);
    }

    if (ownerId) {
      query += ` AND p.owner_id = ?`;
      queryParams.push(ownerId);
    }

    if (supporterId) {
      Logger.info(`suppid ${supporterId}`)
      query += ` AND sp.user_id = ?`;
      queryParams.push(supporterId);
    }

    query += ` GROUP BY p.id, p.title, p.category_id, p.owner_id, u.first_name, u.last_name, p.creation_date`

    if (!sortBy) {query += ` ORDER BY p.creation_date ASC, p.id ASC`};
    if (sortBy === "ALPHABETICAL_ASC") { query += ` ORDER BY p.title ASC, p.id ASC`; }
    if (sortBy === "ALPHABETICAL_DESC") { query += ` ORDER BY p.title DESC, p.id ASC`; }
    if (sortBy === "COST_ASC") { query += ` ORDER BY MIN(st.cost) ASC, p.id ASC`; }
    if (sortBy === "COST_DESC") { query += ` ORDER BY MIN(st.cost) DESC, p.id ASC`; }
    if (sortBy === "CREATED_ASC") { query += ` ORDER BY p.creation_date ASC, p.id ASC`; }
    if (sortBy === "CREATED_DESC") { query += ` ORDER BY p.creation_date DESC, p.id ASC`; }

    const [ rows ] = await conn.query( query, queryParams );
    await conn.release();
    return rows;
}

const petitionExists = async (id: number) => {
  const conn = await getPool().getConnection();
  const query = `select count(*) as count from petition where id = ?`;
  const [ rows ] = await conn.query( query, [ id ] );
  await conn.release();
  return rows[0].count > 0;
}

export { getAll, petitionExists }
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

    if (categoryIds.length > 0) {
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

const getOne = async(id: number): Promise<{petition: getOnePetition[]; tiers: supportTier[]}> => {
  Logger.info(`Getting petition from the database`)
  const conn = await getPool().getConnection();
  const query = ` SELECT p.id, p.title, p.category_id, p.owner_id, u.first_name, u.last_name,
                  COUNT(DISTINCT sp.id) AS number_supporters, p.creation_date, p.description,
                  COALESCE(SUM(st.cost), 0) AS money_raised
                  FROM petition p
                  JOIN user u ON p.owner_id = u.id
                  LEFT JOIN supporter sp ON p.id = sp.petition_id
                  LEFT JOIN support_tier st ON sp.support_tier_id = st.id
                  WHERE p.id = ?
                  GROUP BY p.id, p.title, p.category_id, p.owner_id, u.first_name, u.last_name, p.creation_date, p.description  `;

  const supportTierQuery = ` SELECT title, description, cost, id
                             FROM support_tier
                             WHERE petition_id = ? `;

  const [ result ] = await conn.query( query, [ id ] );
  const [ tiers ] = await conn.query( supportTierQuery, [ id ] );
  await conn.release();

  return {
    petition: result,
    tiers
  };
}

const addOne = async ( title: string, description: string, creationDate: string, ownerId: number,
                       categoryId: number, supportTiers: supportTier[]): Promise<ResultSetHeader> => {
  Logger.info(`adding petition from the database`)
  const conn = await getPool().getConnection();

  const query = 'insert into petition (title, description, creation_date, owner_id, category_id) values (?, ?, ? , ? , ?)';
  const [ result ] = await conn.query(query, [ title, description, creationDate, ownerId, categoryId ]);
  const insertId = result.insertId;

  for (const tier of supportTiers) {
    const supportTierQuery = 'INSERT INTO support_tier (petition_id, title, description, cost) VALUES (?, ?, ?, ?)';
    await conn.query(supportTierQuery, [insertId, tier.title, tier.description, tier.cost]);
  }

  await conn.release();
  return result;
}


const petitionExists = async (id: number): Promise<boolean> => {
  const conn = await getPool().getConnection();
  const query = `select count(*) as count from petition where id = ?`;
  const [ rows ] = await conn.query( query, [ id ] );
  await conn.release();
  return rows[0].count > 0;
}

/**
 * return true if title exists already
 */
const titleExists = async (title: string): Promise<boolean> => {
  const conn = await getPool().getConnection();
  const query = `select count(*) as count from petition where title = ?`;
  const [ rows ] = await conn.query( query, [ title ] );
  await conn.release();
  return rows[0].count > 0;
}

/**
 * return true if catid exists
 */
const catIdExists = async (categoryId: number): Promise<boolean> => {
  const conn = await getPool().getConnection();
  const query = `select count(*) as count from category where id = ?`;
  const [ rows ] = await conn.query( query, [ categoryId ] );
  await conn.release();
  return rows[0].count > 0;
}

const getCategories = async (): Promise<category[]> => {
  const conn = await getPool().getConnection();
  const query = `select * from category`;
  const [ rows ] = await conn.query( query );
  await conn.release();
  return rows;
}

const deleteOne = async (id: number): Promise<boolean> => {
  const conn = await getPool().getConnection();
  const checkSupportersQuery = `select count(*) as count from supporter
                                where petition_id = ?`
  const [ rows ] = await conn.query( checkSupportersQuery, [ id ] );
  if (rows[0].count > 0) {
    return false
  }

  const queryDeleteSup = 'delete from support_tier where petition_id = ?'
  await conn.query( queryDeleteSup, [ id ] );
  const queryDeletePets = 'delete from petition where id = ?'
  const [ result ] = await conn.query( queryDeletePets, [ id ] );
  return true;
}

const updateOne = async (newData: Partial<Petition>, id: number): Promise<ResultSetHeader> => {
  Logger.info(`Updating petition info`)
  let query = 'UPDATE petition SET ';
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
  if (newData.category_id) {
    toUpdate.push(`category_id = ?`);
    values.push(newData.category_id);
  }
  query += toUpdate.join(', ') + ' WHERE id = ?';
  values.push(id);

  const conn = await getPool().getConnection();
  const [ result ] = await conn.query(query, values);
  await conn.release();
  return result;
}

export { getAll, getOne, addOne, petitionExists, titleExists, catIdExists, getCategories, deleteOne, updateOne }
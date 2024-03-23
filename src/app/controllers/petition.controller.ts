import {Request, Response} from "express";
import Logger from '../../config/logger';
import * as petitions from '../models/petition.model'
import {validate, validGetAllPetitionsParams} from '../utils/validate'
import * as schemas from '../resources/schemas.json'
import {getIdFromToken} from '../models/user.model'
import { validateToken } from "../services/passwords";

const getAllPetitions = async (req: Request, res: Response): Promise<void> => {

    const validation = await validate(schemas.petition_search, req.query);
    if (validation !== true) {
        res.statusMessage = `Bad Request. Invalid information`;
        res.status(400).send();
        return;
    }

    // check the params are valid
    const validParams = validGetAllPetitionsParams( req.query.startIndex as string, req.query.count as string,
                                                    req.query.supportingCost as string, req.query.ownerId as string,
                                                    req.query.supporterId as string  )

    if (!validParams) {
        res.status(400).send(`Bad Request. Invalid information`);
        return;
    }

    const startIndex = parseInt(req.query.startIndex as string, 10)
    const count = parseInt(req.query.count as string, 10);
    const q = req.query.q as string;
    const categoryIds = req.query.categoryIds ? (req.query.categoryIds as string[]).map(id => parseInt(id, 10)) : null;
    const supportingCost = parseInt(req.query.supportingCost as string, 10);
    const ownerId = parseInt(req.query.ownerId as string, 10);
    const supporterId = parseInt(req.query.supporterId as string, 10);
    const sortBy = req.query.sortBy as string;

    try {
        const petitionsArray = await petitions.getAll(  q, categoryIds, supportingCost,
                                                        ownerId, supporterId, sortBy  );
        const totalCount = petitionsArray.length;
        const petArraySliced = count ? petitionsArray.slice(startIndex, startIndex + count) : petitionsArray.slice(startIndex);
        const petitionsRes = {
            petitions: petArraySliced.map(row => ({
                petitionId: row.id,
                title: row.title,
                categoryId: row.category_id,
                ownerId: row.owner_id,
                ownerFirstName: row.first_name,
                ownerLastName: row.last_name,
                numberOfSupporters: row.number_supporters,
                creationDate: row.creation_date,
                supportingCost: row.support_cost
            })),
            count: totalCount
        };
        res.status(200).send(petitionsRes);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const getPetition = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`GET single petition id ${req.params.id}`);
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
        res.status(404).send('Not Found. No petition with id');
        return;
    }
    try {
        const petitionExistsBool = await petitions.petitionExists(id);
        if (!petitionExistsBool) {
            res.status(404).send('Not Found. No petition with id');
            return;
        }
        const onePetition = await petitions.getOne(id);
        Logger.info(`id: ${onePetition.petition[0].id} `);
        const petitionRes = {
            petitionId: onePetition.petition[0].id,
            title: onePetition.petition[0].title,
            categoryId: onePetition.petition[0].category_id,
            ownerId: onePetition.petition[0].owner_id,
            ownerFirstName: onePetition.petition[0].first_name,
            ownerLastName: onePetition.petition[0].last_name,
            numberOfSupporters: onePetition.petition[0].number_supporters,
            creationDate: onePetition.petition[0].creation_date,
            description: onePetition.petition[0].description,
            moneyRaised: onePetition.petition[0].money_raised,
            supportTiers: onePetition.tiers.map(tier => ({
                title: tier.title,
                description: tier.description,
                cost: tier.cost,
            }))
        };
        res.status(200).send(petitionRes);

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const addPetition = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`POST add petitition with title ${req.body.title}`)
    const validation = await validate(schemas.petition_post, req.body);
    if (validation !== true) {
        res.status(400).send(`Bad Request. Invalid information`);
        return;
    }

    const token = req.headers['x-authorization'] as string;
    if (!token) {
        res.status(401).send('Unauthorized');
        return;
    }
    try {
        const ownerId = await getIdFromToken(token);
        if (!ownerId) {
            res.status(401).send('Unauthorized');
            return;
        }
        Logger.info(`ownerid: ${ownerId}`)

        const title = req.body.title;
        const titleExists = await petitions.titleExists(title);
        if (titleExists) {
            res.status(403).send('Petition title already exists');
        }

        const categoryId = req.body.categoryId;
        const catIdExists = petitions.catIdExists(categoryId);
        if (!catIdExists) {
            res.status(400).send(`Bad Request. Invalid information`);
            return;
        }

        let validTitles = true;
        const titles: string[] = [];
        const supportTiers = req.body.supportTiers;
        for (const tier of supportTiers) {
            if (tier.title in titles) {
                validTitles = false;
            }
            titles.push(tier.title);
        }

        if (!validTitles) {
            res.status(400).send(`Bad Request. Invalid information`);
            return;
        }

        const date = new Date();
        const creationDate = date.toISOString().slice(0, 19).replace('T', ' ');
        const description = req.body.description;
        const result = await petitions.addOne(title, description, creationDate, ownerId, categoryId, supportTiers);
        res.status(201).send( {petitionId: result.insertId} )
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const editPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const deletePetition = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`POST delete petitition with id ${req.params.id}`)
    const token = req.headers['x-authorization'] as string;

    if (!token) {
        res.status(401).send('Unauthorized');
        return;
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.status(404).send("Not Found. No petition found with id");
        return;
    }

    try {
        const exists = await petitions.petitionExists(id);
        if (!exists) {
            res.status(404).send("Not Found. No petition found with id");
            return;
        }

        const onePetition = await petitions.getOne(id);
        const ownerId = onePetition.petition[0].owner_id;
        const validToken = await validateToken(ownerId, token)
        if (!validToken) {
            res.status(403).send("Only the owner of a petition may delete it");
            return;
        }

        const result = await petitions.deleteOne(id);
        if (!result) {
            res.status(403).send("Can not delete a petition with one or more supporters");
            return;
        }

        res.status(200).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const getCategories = async(req: Request, res: Response): Promise<void> => {
    try{
        const categories = await petitions.getCategories();
        res.status(200).send(categories);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getAllPetitions, getPetition, addPetition, editPetition, deletePetition, getCategories};
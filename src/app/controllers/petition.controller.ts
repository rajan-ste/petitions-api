import {Request, Response} from "express";
import Logger from '../../config/logger';
import * as petitions from '../models/petition.model'
import {validate, validGetAllPetitionsParams} from '../utils/validate'
import * as schemas from '../resources/schemas.json'

const getAllPetitions = async (req: Request, res: Response): Promise<void> => {

    const validation = await validate(schemas.petition_search, req.query);
    if (validation !== true) {
        res.statusMessage = `Bad Request. Invalid information`;
        res.status(400).send();
        return;
    }

    // check the params are valid
    const validateParams = [ req.query.startIndex, req.query.count, req.query.supportingCost,
                             req.query.ownerId, req.query.supporterId ];

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
    try {
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

const addPetition = async (req: Request, res: Response): Promise<void> => {
    try {
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

const getCategories = async(req: Request, res: Response): Promise<void> => {
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

export {getAllPetitions, getPetition, addPetition, editPetition, deletePetition, getCategories};
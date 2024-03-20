import {Request, Response} from "express";
import Logger from '../../config/logger';
import * as petitions from '../models/petition.model'
import {validate} from '../utils/validate'
import * as schemas from '../resources/schemas.json'

const getAllPetitions = async (req: Request, res: Response): Promise<void> => {
    const startIndex = parseInt(req.query.startIndex as string, 10)
    const count = parseInt(req.query.count as string, 10);
    const q = req.query.q as string;
    const categoryIds = req.query.categoryIds as string[]; // wrong type need to fix
    const supportingCost = parseInt(req.query.supportingCost as string, 10);
    const ownerId = parseInt(req.query.ownerId as string, 10);
    const supporterId = parseInt(req.query.supporterId as string, 10);
    const sortBy = req.query.sortBy as string;
    Logger.info(`catids: ${categoryIds}`)
    const validation = await validate(schemas.petition_search, req.query);
    if (validation !== true) {
        res.statusMessage = `Bad Request. Invalid information`;
        res.status(400).send();
        return;
    }

    try{
        const petitionsArray = await petitions.getAll(startIndex, count, q, categoryIds, supportingCost, ownerId, supporterId, sortBy);
        res.status(200).send(petitionsArray);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const getPetition = async (req: Request, res: Response): Promise<void> => {
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

const addPetition = async (req: Request, res: Response): Promise<void> => {
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
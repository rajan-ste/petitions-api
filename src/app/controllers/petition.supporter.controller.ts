import {Request, Response} from "express";
import Logger from "../../config/logger";
import { getOne, petitionExists } from '../models/petition.model'
import * as supporters from '../models/petition.supporter.model';
import * as schemas from '../resources/schemas.json'
import { validate } from '../utils/validate';
import { getIdFromToken } from '../models/user.model';

const getAllSupportersForPetition = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.status(404).send('Not Found. No petition with id');
        return;
    }

    try {
        const petExists = await petitionExists(id);
        if (!petExists) {
            res.status(404).send('Not Found. No petition with id');
            return;
        }

        const supportersArray = await supporters.getAll(id);
        const supportersMapped = supportersArray.map(row => ({
            supportId: row.supportId,
            supportTierId: row.supportTierId,
            message: row.message,
            supporterId: row.supporterId,
            supporterFirstName: row.supporterFirstName,
            supporterLastName: row.supporterLastName,
            timestamp: row.timestamp
        }));

        res.status(200).send(supportersMapped);
        return;

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const addSupporter = async (req: Request, res: Response): Promise<void> => {

    const validation = await validate(schemas.support_post, req.body);
    if (validation !== true) {
        res.statusMessage = `Bad Request. Invalid information`;
        res.status(400).send();
        return;
    }

    const token = req.headers['x-authorization'] as string;
    if (!token) {
        res.status(401).send('Unauthorized');
        return;
    }

    const petitionId = parseInt(req.params.id, 10);
    if (isNaN(petitionId)) {
        res.status(404).send("Not Found. No petition found with id");
        return;
    }
    try {
        const petExists = await petitionExists(petitionId);
        if (!petExists) {
            res.status(404).send('Not Found. No petition with id');
            return;
        }

        const userId = await getIdFromToken(token);
        const petition = await getOne(petitionId);
        const supportTierId = parseInt(req.body.supportTierId, 10);

        if (userId === petition.petition[0].owner_id) {
            res.status(403).send('Cannot support your own petition');
            return;
        }

        // check if user already supports petition
        const alreadySupports = await supporters.alreadySupports(petitionId, userId, supportTierId);
        if (alreadySupports) {
            res.status(403).send("Already supported at this tier");
            return;
        }

        let message = req.body.message;
        if (!message) {
            message = null
        }

        const date = new Date();
        const timestamp = date.toISOString().slice(0, 19).replace('T', ' ');
        const result = await supporters.addOne(petitionId, supportTierId, userId, message, timestamp);
        res.status(201).send('Created');

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getAllSupportersForPetition, addSupporter}
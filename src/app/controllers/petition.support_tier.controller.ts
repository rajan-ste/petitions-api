import { Request, Response } from "express";
import Logger from "../../config/logger";
import * as supportTiers from '../models/petition.support_tier.model';
import * as schemas from '../resources/schemas.json'
import { getIdFromToken } from '../models/user.model'
import { validateToken } from "../services/passwords";
import { validate } from '../utils/validate';
import { getOne, petitionExists } from '../models/petition.model';


const addSupportTier = async (req: Request, res: Response): Promise<void> => {
    const validation = await validate(schemas.support_tier_post, req.body);
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

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.status(404).send("Not Found. No petition found with id");
        return;
    }
    try {
        // check the petition exists
        const exists = await petitionExists(id);
        if (!exists) {
            res.status(404).send("Not Found. No petition found with id");
            return;
        }

        // make sure its the users petition
        const onePetition = await getOne(id);
        const ownerId = onePetition.petition[0].owner_id;
        const validToken = await validateToken(ownerId, token)
        if (!validToken) {
            res.status(403).send("Only the owner of a petition may modify it");
            return;
        }

        // check the new title is unique
        const title = req.body.title;
        const currTitles = onePetition.tiers;
        for (const currTitle of currTitles) {
            if (currTitle.title === title) {
                res.status(403).send('Support title not unique within petition');
                return;
            }
        }

        if (currTitles.length === 3) {
            res.status(403).send('Can not add a support tier if 3 already exist');
            return;
        }

        const addTier = supportTiers.addOne(id, req.body);
        if (!addTier) {
            res.status(403).send('Can not add a support tier if 3 already exist');
            return;
        }
        res.status(201).send('OK');
        return;

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const editSupportTier = async (req: Request, res: Response): Promise<void> => {
    const validation = await validate(schemas.support_tier_patch, req.body);
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

    const id = parseInt(req.params.id, 10);
    const tierId = parseInt(req.params.tierId, 10);
    if (isNaN(id) || isNaN(tierId)) {
        res.status(404).send("Not Found");
        return;
    }

    try {
        const petition = await getOne(id);
        if (!petition) {
            res.status(404).send("Not Found. No petition found with id");
            return;
        }

        // validate the tier id
        let validTierId = false;
        const tiers = petition.tiers;
        for (const tier of tiers) {
            if (tier.supportTierId === tierId) {
                validTierId = true;
                break;
            }
        }
        if (!validTierId) {
            res.status(404).send("Not Found");
            return;
        }

        // check title is unique
        const title = req.body.title;
        for (const tier of tiers) {
            if (tier.supportTierId === title) {
                res.status(403).send("Support title not unique within petition")
                return;
            }
        }

        // make sure its the users petition
        const ownerId = petition.petition[0].owner_id;
        const validToken = await validateToken(ownerId, token)
        if (!validToken) {
            res.status(403).send("Only the owner of a petition may modify it");
            return;
        }

        // check no supporters exist for tier
        const supportersExist = await supportTiers.supportersExist(id, tierId);
        if (supportersExist) {
            res.status(403).send('Cannot edit a support tier if a supporter already exists for it');
            return;
        }

        const newData = {
            ...(req.body.title && { title: req.body.title }),
            ...(req.body.description && { description: req.body.description }),
            ...(req.body.cost && { cost: req.body.cost })
        };

        const result = await supportTiers.editOne(id, tierId, newData);
        res.status(200).send('OK');
        return;

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const deleteSupportTier = async (req: Request, res: Response): Promise<void> => {

    const token = req.headers['x-authorization'] as string;
    if (!token) {
        res.status(401).send('Unauthorized');
        return;
    }

    const id = parseInt(req.params.id, 10);
    const tierId = parseInt(req.params.tierId, 10);
    if (isNaN(id) || isNaN(tierId)) {
        res.status(404).send("Not Found");
        return;
    }

    try {
        // check petition exists
        const petition = await getOne(id);
        if (!petition) {
            res.status(404).send("Not Found. No petition found with id");
            return;
        }

        // validate the tier id
        let validTierId = false;
        const tiers = petition.tiers;
        for (const tier of tiers) {
            if (tier.supportTierId === tierId) {
                validTierId = true;
                break;
            }
        }
        if (!validTierId) {
            res.status(404).send("Not Found");
            return;
        }

        // make sure its the users petition
        const ownerId = petition.petition[0].owner_id;
        const validToken = await validateToken(ownerId, token)
        if (!validToken) {
            res.status(403).send("Only the owner of a petition may delete it");
            return;
        }

        // check no supporters exist for tier
        const supportersExist = await supportTiers.supportersExist(id, tierId);
        if (supportersExist) {
            res.status(403).send('Cannot delete a support tier if a supporter already exists for it');
            return;
        }

        // check there is more than one support tier
        if (tiers.length === 1) {
            res.status(403).send('Can not remove a support tier if it is the only one for a petition');
            return;
        }

        const result = supportTiers.deleteOne(id, tierId);
        res.status(200).send('OK');
        return;

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {addSupportTier, editSupportTier, deleteSupportTier};
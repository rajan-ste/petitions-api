import {Request, Response} from "express";
import Logger from "../../config/logger";
import fs from 'mz/fs';
import path from "path";
import * as images from "../models/user.image.model";
const imageDirectory = '/storage/images/'; 

const getImage = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    try {
        const imageFileName = await images.getOne(id);
        if (!imageFileName) {
            res.status(404).send('Not Found. No user with specified ID, or user has no image');
            return;
        }

        const filePath = path.resolve(__dirname, "../../../") + imageDirectory + imageFileName;
        Logger.info(`${filePath}`)
        const fileExtension = path.extname(filePath).toLowerCase();
        const mimeType = fileExtension === '.png' ? 'image/png' :
                            fileExtension === '.jpeg' || fileExtension === '.jpg' ? 'image/jpeg' :
                            fileExtension === '.gif' ? 'image/gif' :
                            null;

        if (!mimeType) {
            res.status(404).send('Not Found. No user with specified ID, or user has no image');
            return;
        }

        res.setHeader('Content-Type', mimeType);
        res.sendFile(filePath, (err) => {
            if (err) {
                res.status(404).send('Not Found. No user with specified ID or user has no image');
                return;
            }
        });
    } catch (err) {
        Logger.error(err);
        res.status(500).send('Internal Server Error');
    }
};

const setImage = async (req: Request, res: Response): Promise<void> => {
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

const deleteImage = async (req: Request, res: Response): Promise<void> => {
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

export {getImage, setImage, deleteImage}
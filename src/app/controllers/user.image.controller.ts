import {Request, Response} from "express";
import Logger from "../../config/logger";
import fs from 'mz/fs';
import path from "path";
import * as images from "../models/user.image.model";
import { userExists } from "../models/user.model";
import { validateToken, genFileName } from "../services/passwords";
const imageDirectory = '/storage/images/';

const getImage = async (req: Request, res: Response): Promise<void> => {

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.status(404).send('Not Found. No user with specified ID, or user has no image');
        return;
    }

    try {
        const userExistsBool = await userExists(id);
        if (!userExistsBool) {
            res.status(404).send("Not Found. No user with specified ID, or user has no image");
            return;
        }

        const imageFileName = await images.getOne(id);
        if (!imageFileName) {
            res.status(404).send('Not Found. No user with specified ID, or user has no image');
            return;
        }

        const filePath = path.resolve(__dirname, "../../../") + imageDirectory + imageFileName;
        const fileExtension = path.extname(filePath).toLowerCase();
        const mimeType = fileExtension === '.png' ? 'image/png' :
                            fileExtension === '.jpeg' || fileExtension === '.jpg' ? 'image/jpeg' :
                            fileExtension === '.gif' ? 'image/gif' :
                            null;
        // invalid file type
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
    const token = req.headers['x-authorization'] as string;
    if (!token) {
        res.status(401).send("Unauthorized");
    }
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.status(404).send('Not found. No such user with ID given')
        return;
    }
    const contentType = req.headers['content-type'].toLowerCase();
    const validFileTypes = ['image/jpeg', 'image.jpg', 'image/png', 'image/gif'];
    // invalid file type
    if (!validFileTypes.includes(contentType)) {
        res.status(400).send('Bad Request. Invalid image supplied (possibly incorrect file type)');
        return;
    }
    const fileExtension = contentType === 'image/png' ? '.png' :
                      contentType === 'image/jpeg' ? '.jpeg' :
                      contentType === 'image/jpg' ? '.jpg' :
                      contentType === 'image/gif' ? '.gif' :
                      null;

    try {
        // check user exists
        const userExistsBool = await userExists(id);
        if (!userExistsBool) {
            res.status(404).send("Not found. No such user with ID given");
            return;
        }
        // check token matches
        const validateTokenBool = await validateToken(id, token)
        if (!validateTokenBool) {
            res.status(403).send("Can not change another user's profile picture");
            return;
        }

        const imageName = await genFileName() + fileExtension;
        const imageFileDirectory = path.resolve(__dirname, "../../../storage/images");
        const filePath = path.join(imageFileDirectory, imageName);
        await fs.writeFile(filePath, req.body);
        const hadImage = await images.updateImage(id, imageName);
        if (hadImage) {
            res.status(200).send('OK. Image updated');
            return;
        } else {
            res.status(201).send('Created. New image created');
            return;
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const deleteImage = async (req: Request, res: Response): Promise<void> => {
    const token = req.headers['x-authorization'] as string;
    if (!token) {
        res.status(401).send("Unauthorized");
    }
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.status(404).send('Not found. No such user with ID given')
        return;
    }
    try{
        // check user exists
        const userExistsBool = await userExists(id);
        if (!userExistsBool) {
            res.status(404).send("Not found. No such user with ID given");
            return;
        }
        // check token matches
        const validateTokenBool = await validateToken(id, token)
        if (!validateTokenBool) {
            res.status(403).send("Can not delete another user's profile picture");
            return;
        }

        const imageName = await images.getOne(id);
        const imageFileDirectory = path.resolve(__dirname, "../../../storage/images");
        const filePath = path.join(imageFileDirectory, imageName);
        await fs.unlink(filePath);
        await images.deleteImage(id);
        res.status(200).send("OK");
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getImage, setImage, deleteImage}
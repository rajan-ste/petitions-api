import {Request, Response} from "express";
import Logger from '../../config/logger';
import {validate, isValidEmail} from '../utils/validate'
import {hash} from '../services/passwords'
import * as schemas from '../resources/schemas.json'
import * as users from '../models/user.model'


const register = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`POST create a user with email ${req.body.email}`);
    const email = req.body.email;
    const validation = await validate(schemas.user_register, req.body);
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }
    if (!isValidEmail(email)) {
        res.status(400).send('Invalid Email');
        return;
    }

    const emailExists = await users.emailExists(email);
    if (emailExists) {
        res.status(403).send(`User with ${email} already exists`);
        return;
    }

    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const password = await hash(req.body.password);
    try {
        const result = await users.insert(email, firstName, lastName, password);
        res.status(201).send({ "userId": Number(result.insertId) });
    } catch (err) {
        Logger.error(err);
        res.status(500).send(`ERROR creating user ${email}: ${err}`);
    }
};


const login = async (req: Request, res: Response): Promise<void> => {
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

const logout = async (req: Request, res: Response): Promise<void> => {
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

const view = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`GET single user id ${req.params.id}`);
    const id = parseInt(req.params.id, 10);
    try {
        if (isNaN(id)) {
            res.status(404).send('User id must be a number')
            return;
        }
        const result = await users.getOne(id);
        if (result.length === 0) {
            res.status(404).send('User not found');
            return;
        } else {
            const camelCaseUser = result.map((user) => ({
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email
            }))[0];
            res.status(200).send(camelCaseUser);
            return;
        }
    } catch (err) {
        Logger.error(err);
        res.status(500).send(`ERROR reading user ${id}: ${err}`);
    }
};


const update = async (req: Request, res: Response): Promise<void> => {
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

export {register, login, logout, view, update}
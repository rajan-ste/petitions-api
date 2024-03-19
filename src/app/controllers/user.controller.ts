import {Request, Response} from "express";
import Logger from '../../config/logger';
import {validate, isValidEmail} from '../utils/validate'
import {hash} from '../services/passwords'
import * as schemas from '../resources/schemas.json'
import * as users from '../models/user.model'
import * as passwords from '../services/passwords'

const register = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`POST create a user with email ${req.body.email}`);

    // validate user data and email
    const email = req.body.email;
    const validation = await validate(schemas.user_register, req.body);
    if (validation !== true) {
        res.statusMessage = `Bad Request. Invalid information`;
        res.status(400).send();
        return;
    }
    if (!isValidEmail(email)) {
        res.status(400).send('Bad Request. Invalid information');
        return;
    }

    // check if user with email exists already
    const emailExists = await users.emailExists(email);
    if (emailExists) {
        res.status(403).send(`Email already in use`);
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
        res.status(500).send(`Internal Server Error`);
    }
};

/**
 *
 * @param req
 * @param res
 * @returns void
 */
const login = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`POST login user with email ${req.body.email}`)

    const validation = await validate(schemas.user_login, req.body);
    if (validation !== true) {
        res.status(400).send('Bad Request. Invalid information');
        return;
    }
    // get email and check it exists in the db
    const email = req.body.email;
    const emailExists = await users.emailExists(email);
    if (!emailExists) {
        res.status(401).send(`UnAuthorized. Incorrect email/password`);
        return;
    }

    // get password and check its not empty
   const comp = req.body.password;
   if (!comp) {
        res.status(400).send('Bad Request. Invalid information');
        return;
   }

   // check in case no password is found for email
   const rows = await users.getPass(email);
   if (rows.length === 0) {
        res.status(401).send('UnAuthorized. Incorrect email/password')
        return;
   }

   // compare the incoming pw with hashed db one
   const hashedPass = rows[0].password;
   const match = await passwords.compare(hashedPass, comp)
   if (!match) {
        res.status(401).send(`UnAuthorized. Incorrect email/password`);
        return;
   }

   // gen user auth token
   const token = await passwords.genToken();
    try{
        const updatedId = await users.authUser(email, token)
        res.status(200).send( { "userId": updatedId, "token": token } )
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const logout = async (req: Request, res: Response): Promise<void> => {
    const token = req.headers['x-authorization'] as string;
    // no token
    if (!token) {
        res.status(401).send('Unauthorized. Cannot log out if you are not authenticated');
        return;
    }
    try{
        const logOutBool = await users.logOut(token)
        if (!logOutBool) {
            res.status(401).send('Unauthorized. Cannot log out if you are not authenticated');
            return;
        } else {
            res.status(200).send();
            return;
        }
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
    const token = req.headers['x-authorization'];
    try {
        // check if id is NaN
        if (isNaN(id)) {
            res.status(404).send('Not Found. No user with specified ID')
            return;
        }
        // get user from db and check if not found
        const result = await users.getOne(id);
        const user = result[0]

        if (result.length === 0) {
            res.status(404).send('Not Found. No user with specified ID');
            return;
        }

        // verify auth token
        const userToken = user.auth_token;
        if (!token || userToken !== token) {
            const camelCaseUser = {
                firstName: user.first_name,
                lastName: user.last_name,
            };
            res.status(200).send(camelCaseUser);
            return;
        } else {
            const camelCaseUser = {
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email
            };
            res.status(200).send(camelCaseUser);
            return;
        }
    } catch (err) {
        Logger.error(err);
        res.status(500).send(`Internal Server Error`);
    }
};

const update = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`PATCH update a user with email ${req.params.id}`);

    // validate data
    const validation = await validate(schemas.user_edit, req.body);
    if (validation !== true) {
        res.status(400).send(`Bad Request. Invalid information`);
        return;
    }

    const id = parseInt(req.params.id, 10);
    const email = req.body.email;
    const newPassword = req.body.password;
    const currentPassword = req.body.currentPassword;

    if (isNaN(id)) {
        res.status(404).send('Not Found')
        return;
    }
    // check for auth token
    const token = req.headers['x-authorization'] as string;
    if (!token) {
        res.status(401).send('Unauthorized or Invalid currentPassword');
        return;
    }

    const getUser = await users.getOne(id);
    const user = getUser[0]

    // verify that user is editing their own data
    if (user.auth_token !== token) {
        res.status(403).send(`Cannot edit another user's information`);
        return;
    }

    // validate email with regex
    if (email && !isValidEmail(email)) {
        res.status(400).send('Bad Request. Invalid information');
        return;
    }
    // check if user with email exists already
    const emailExists = await users.emailExists(email);
    if (emailExists) {
        res.status(403).send(`Email already in use`);
        return;
    }
    // need current password to change password
    if (newPassword && !currentPassword) {
        res.status(400).send('Bad Request. Invalid information');
        return;
    }
    // check if new password is same as old password
    if (newPassword === currentPassword) {
        res.status(403).send(`Identical current and new passwords`);
        return;
    }

    // check currentPassword is actually the users password
    const hashedPass = user.password;
    const match = await passwords.compare(hashedPass, currentPassword);
    if (!match) {
        res.status(401).send('Unauthorized or Invalid currentPassword');
        return;
    }

    const newData = {
        ...(req.body.email && { email: req.body.email }),
        ...(req.body.password && { password: await hash(req.body.password) }),
        ...(req.body.firstName && { firstName: req.body.firstName }),
        ...(req.body.lastName && { lastName: req.body.lastName }),
    };
    try {
        const updateAction = await users.updateUser(newData, id)
        res.status(200).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {register, login, logout, view, update}
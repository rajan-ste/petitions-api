import {Request, Response} from "express";
import Logger from '../../config/logger';
import {validate, isValidEmail} from '../utils/validate'
import {hash} from '../services/passwords'
import * as schemas from '../resources/schemas.json'
import * as users from '../models/user.model'
import * as passwords from '../services/passwords'

const register = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`POST create a user with email ${req.body.email}`);

    // get email and validate it
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

    // get email and check it exists in the db
    const email = req.body.email;
    const emailExists = await users.emailExists(email);
    if (!emailExists) {
        res.status(401).send(`User with ${email} does not exist`);
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
    }
    try{
        const logOutBool = await users.logOut(token)
        if (!logOutBool) {
            res.status(401).send('Unauthorized. Cannot log out if you are not authenticated');
            return;
        } else {
            res.status(200).send();
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
    Logger.http(`PATCH update a user with email ${req.body.email}`);

    const email = req.body.email;

    /*
    * to do
    * - validate the email, check it doesnt exist OTHER than the email associated with the auth token
    * - validate data for 400 response
    * - validate password, current_password is the password in the db, password is the new one, these are only supplied when editing the password
    * - big update with all the fields, but not everything will be updated since not all the data will have changed but this means we can just have one model function
    * - need to implement authorization 401 response and 403 forbidden
    **/
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
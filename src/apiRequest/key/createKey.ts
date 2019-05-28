import { Request, Response, NextFunction } from "express";
import router from "router";
import { isLoggedIn } from "services/authentication";
import { serverError, dbError } from "services/errorHandler";
import { Key } from "models/key.model";
import { checkValidation } from "middleware/checkValidation";
const { check } = require('express-validator/check');
const { generateKeyPair } = require('crypto');
const sshpk = require('sshpk');


export function register() {
    router.post('/key', auth, val, checkValidation, createKeyPair);
}

const val = [
    check('name', 'Name field is required').exists()
]

function auth(req: Request, res: Response, next: NextFunction){
    if(isLoggedIn(req)) {
        next();
    }
    else {
        res.status(401).send();
    }
}

function createKeyPair(req: Request, res: Response){
    let key = new Key();
    key.name = req.body.name;
    key.public_key = null;
    key.private_key = null;

    generateKeyPair('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
            type: 'pkcs1',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs1',
            format: 'pem',
        }
    }, async (err: any, publicKey: string, privateKey: string) => {
        if(err){
            // istanbul ignore next
            serverError(res, err);
        }
        else{
            const publicKeySSH = sshpk.parseKey(publicKey, 'pem').toString('ssh');

            key.public_key = publicKeySSH;
            key.private_key = privateKey;

            try {
                const savedKey = await key.save();
                req.authuser.keys.push(savedKey._id);
                req.authuser.save();
                // Important to set private key to null
                // Dont send private keys through the internet!!
                savedKey.private_key = null;
                res.json(savedKey);
            }
            catch (err) {
                // istanbul ignore next
                dbError(res, err);
            }
        }
    });
}
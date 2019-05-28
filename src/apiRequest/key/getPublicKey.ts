import { Request, Response, NextFunction } from "express";
import router from "router";
import { isLoggedIn } from "services/authentication";
import { bindKey } from "middleware/bindings";


export function register() {
    router.get('/key/:key', bindKey, auth, getPublicKey);
}

function auth(req: Request, res: Response, next: NextFunction){
    if(isLoggedIn(req)) {
        if(req.authuser.hasKey(req.bindings.key._id)) {
            next();
        }
        else {
            res.status(403).send();
        }
    }
    else {
        res.status(401).send();
    }
}

function getPublicKey(req: Request, res: Response) {
    req.bindings.key.private_key = null;
    res.json(req.bindings.key);
}
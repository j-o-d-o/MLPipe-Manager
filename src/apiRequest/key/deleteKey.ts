import { Request, Response, NextFunction } from "express";
import router from "router";
import { isLoggedIn } from "services/authentication";
import { bindKey } from "middleware/bindings";
import { dbError } from "services/errorHandler";


export function register() {
    router.delete('/key/:key', bindKey, auth, deleteKey);
}

function auth(req: Request, res: Response, next: NextFunction){
    if(isLoggedIn(req)) {
        if(req.authuser.hasKey(req.bindings.key._id)){
            next();
        }
        else {
            res.status(403).send();
        }
    }
    else{
        res.status(401).send();
    }
}

async function deleteKey(req: Request, res: Response){
    // Pre hook is deleting the key also from the user(s) that have that key stored
    try {
        await req.bindings.key.remove();
        res.json(true);
    }
    catch (err) {
        // istanbul ignore next
        dbError(res, err);
    }
}
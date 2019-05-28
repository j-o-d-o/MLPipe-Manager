import { Request, Response, NextFunction } from "express";
import router from "router";
import { isLoggedIn } from "services/authentication";
import { Key } from "models/key.model";
import { dbError } from "services/errorHandler";


export function register() {
    router.get('/keys', auth, getUserKeys);
}

function auth(req: Request, res: Response, next: NextFunction){
    if(isLoggedIn(req)) {
        next();
    }
    else {
        res.status(401).send();
    }
}

async function getUserKeys(req: Request, res: Response) {
    const keyIds = req.authuser.keys;

    try {
        const keys = await Key
            .find({'_id': {$in: keyIds}}, {name: 1, public_key: 1, createdAt: 1})
            .sort({createdAt: -1})
            .exec();
        return res.json(keys);
    }
    catch (err) {
        // istanbul ignore next
        dbError(res, err);
    }
}
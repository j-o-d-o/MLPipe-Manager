import { Request, Response, NextFunction } from "express";
import router from "router";
import { isLoggedIn } from "services/authentication";
import { User } from "models/user.model";
import { dbError } from "services/errorHandler";


export function register() {
    router.get('/users', auth, getUsers);
}

function auth(req: Request, res: Response, next: NextFunction){
    if(isLoggedIn(req)){
        if (req.authuser.isAdmin()) {
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

async function getUsers(req: Request, res: Response){
    let searchQuery = {
        "is_active": true
    };

    try {
        const users = await User.find(searchQuery)
        .sort({createdAt: -1})
        .exec();
        res.json(users);
    }
    catch (err){
        // istanbul ignore next
        dbError(res, err);
    }
}
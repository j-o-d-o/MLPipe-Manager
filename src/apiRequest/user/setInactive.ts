import { Request, Response, NextFunction } from "express";
import router from "router";
import { isLoggedIn } from "services/authentication";
import { dbError } from "services/errorHandler";
import { bindUser } from "middleware/bindings";


export function register() {
    router.put('/user/:user/setInactive', bindUser, auth, setInactive);
}

function auth(req: Request, res: Response, next: NextFunction) {
    if(isLoggedIn(req)){
        const isSameUser = req.authuser._id.equals(req.bindings.user._id);
        const isAdmin = req.authuser.isAdmin();
        if (isSameUser || isAdmin) {
            next();
        }
        else {
            res.status(403).send();
            return false;
        }
    }
    else {
        res.status(401).send();
    }
}

async function setInactive(req: Request, res: Response) {
    var user = req.bindings.user;
    user.is_active = false

    try {
        await user.save();
        res.json(true);
    }
    catch (err) {
        // istanbul ignore next
        dbError(res, err);
    }
}
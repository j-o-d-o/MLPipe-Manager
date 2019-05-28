import { Request } from "express";
import { User } from "models/user.model";
import { Job } from "models/job.model";
var crypto = require('crypto');


export function getToken(req: Request) : string {
    let bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader !== 'undefined') {
        let bearer: string[] = bearerHeader.split(" ");
        return bearer.length > 1 ? bearer[1] : null;
    }
    else{
        return null;
    }
}

export async function loggIn(req: Request, bearerToken: string) : Promise<boolean>  {
    try {
        const user = await User.findOne({ $and : [ 
            {token: bearerToken}, 
            {is_active : true},
        ]});
        if(user){
            req.authuser = user;
        }
        return true;
    }
    catch (err) {
        throw new Error(err);
    }
}

export async function loggInJob(req: Request, token: string) {
    try {
        const job = await Job.findOne({token: token});
        if(job){
            req.authJob = job;
        }
        return true;
    }
    catch (err) {
        throw new Error(err);
    }
}

export function getJobToken(req: Request) : string {
    const token: any = req.headers["jobtoken"];
    if (typeof token !== "undefined") {
        return token;
    }
    else{
        return null;
    }
}

export function isLoggedIn(req: Request) {
    return ((req.authuser != undefined) && (req.authuser != null));
}

export function isJobLoggedIn(req: Request) {
    return ((req.authJob != undefined) && (req.authJob != null)); 
}

export function sha512(password: string, salt: string) {
    var hash = crypto.createHmac('sha512', salt);
    var value = "";
    if(password != "" && password != undefined){
        hash.update(password);
        value = hash.digest('hex');
    }
    return value;
};
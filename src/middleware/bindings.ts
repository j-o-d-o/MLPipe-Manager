import { Request, Response, NextFunction } from "express";
import { User } from "models/user.model";
import { Training } from "models/training.model";
import { Job } from "models/job.model";
import { Key } from "models/key.model";
import { dbError } from "services/errorHandler";


export async function bindUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    if(req.bindings == undefined)
        req.bindings = {};
    try {
        const param = req.params.user.toLowerCase();
        const user = await User.findOne({
            $and : [
                {
                    $or : [
                        {_id : param},
                        {email: new RegExp('^'+param+'$', 'i')},
                        {name: new RegExp('^'+param+'$', 'i')}
                    ]
                },
                { is_active : true }
            ]
        }).exec();
        if(user){
            req.bindings.user = user;
            next();
        }
        else{
            res.status(404).send();
        }
    }
    catch (err) {
        // istanbul ignore next
        dbError(res, err);
    }
}

export async function bindUserFromEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    if(req.bindings == undefined)
        req.bindings = {};
    try {
        const param = req.body.email.toLowerCase();
        const user = await User.findOne({ 
            $and : [ 
                {email : new RegExp('^'+param+'$', 'i')}, 
                { is_active : true } 
            ] 
        }).exec();
        if(user){
            req.bindings.user = user;
            next();
        }
        else{
            res.status(404).send();
        }
    }
    catch (err) {
        // istanbul ignore next
        dbError(res, err);
    }
}

export async function bindTraining(req: Request, res: Response, next: NextFunction): Promise<void> {
    if(req.bindings == undefined)
        req.bindings = {};
    try {
        const obj = await Training.findOne({ _id: req.params.training});
        if(obj){
            req.bindings.training = obj;
            next();
        }
        else{
            res.status(404).send();
        }
    }
    catch (err) {
        // istanbul ignore next
        dbError(res, err);
    }
}

export async function bindJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    if(req.bindings == undefined)
        req.bindings = {};
    try {
        const obj = await Job.findOne({ _id: req.params.job})
                             .populate('creator', {'name': 1})
                             .populate('trainings')
                             .exec();
        if(obj){
            req.bindings.job = obj;
            next();
        }
        else{
            res.status(404).send();
        }
    }
    catch (err) {
        // istanbul ignore next
        dbError(res, err);
    }
}

export async function bindKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    if(req.bindings == undefined)
        req.bindings = {};
    try {
        const obj = await Key.findOne({ _id: req.params.key});
        if(obj){
            req.bindings.key = obj;
            next();
        }
        else{
            res.status(404).send();
        }
    }
    catch (err) {
        // istanbul ignore next
        dbError(res, err);
    }
}
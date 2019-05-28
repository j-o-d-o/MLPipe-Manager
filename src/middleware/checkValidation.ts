import { Request, Response, NextFunction } from "express";
import { valError } from "services/errorHandler";
const { validationResult } = require('express-validator/check');


export function checkValidation(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        valError(res, errors.array());
    }
    else {
        next();
    }
}
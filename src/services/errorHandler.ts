import { Response } from "express";
import logger from "./logger";


export function dbError(res: Response, err: any): void {
    if(process.env.NODE_ENV == "test") {
        console.log(err);
    }
    logger.error("Database Error", { error: err });
    res.status(500).json({
        error_code: "DB_ERROR",
        data: err.message
    });
}

export function serverError(res: Response, err: any): void {
    if(process.env.NODE_ENV == "test") {
        console.log(err);
    }
    logger.error("Custom Server Error", { error: err });
    res.status(500).json({
        error_code: "SERVER_ERROR",
        data: err
    });
}

export function uploadError(res: Response, err: any): void {
    if(process.env.NODE_ENV == "test") {
        console.log(err);
    }
    logger.error("Upload / File Error", { error: err });
    res.status(500).json({
        error_code: "FILE_ERROR",
        data: err
    });
}

export function valError(res: Response, err: any) {
    //if(process.env.NODE_ENV == "test")
    //    console.log(err);
    res.status(400).json({
        error_code: "VAL_ERROR",
        data: err
    });
}
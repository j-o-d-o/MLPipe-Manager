/* istanbul ignore file */
import winston from "winston";
const { combine, timestamp, printf } = winston.format;


const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            format: combine(
                timestamp(),
                winston.format.colorize(),
                printf(({ level, message, timestamp, error }) => {
                    let output: string = `${timestamp} ${level}: ${message}`;
                    if (error !== undefined) {
                        output += ` ${error}`;
                    }
                    return output;
                }),
            ),
            silent: process.env.NODE_ENV === "test",
        }),
        new winston.transports.File({
            filename: "logs/app.log",
            maxsize: 10485760, // in bytes -> 10 MB
            maxFiles: 7,
            format: combine(
                timestamp(),
                winston.format.json(),
            ),
            silent: process.env.NODE_ENV === "test",
        })
    ],
    exitOnError: false,
});


export default logger;
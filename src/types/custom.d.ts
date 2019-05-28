// Extend the Request interface with custom fields
declare namespace Express {
    export interface Request {
        authuser: import("models/user.model").IUser,
        authJob: any,
        bindings: {
            user?: import("models/user.model").IUser,
            key?: import("models/key.model").IKey,
            awsSpotRequest?: import("models/awsSpotRequest.model").IAwsSpotRequest,
            job?: import("models/job.model").IJob,
            training?: import("models/training.model").ITraining,
        },
    }
}

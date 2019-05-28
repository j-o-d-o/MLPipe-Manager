import mongoose, { Schema, Document } from "mongoose";
import AWS from "aws-sdk";
import { IUser } from "models/user.model";


export interface IAwsSpotRequest extends Document {
    creator: Schema.Types.ObjectId | IUser,
    spot_request_id: string,
    instance_ids: string[],
    instance_ips: string[],

    aws_config: AWS.EC2.Types.RequestSpotInstancesRequest,

    // Fields needed to show user how the setup process is going
    in_error: boolean,
    is_finished: boolean, // is true if setup is done ( or if in error )
    is_canceling: boolean,
    setup_log: string[],
    updatedAt: mongoose.Schema.Types.Date,
    createdAt: mongoose.Schema.Types.Date,

    isCreatedBy: (user_id: Schema.Types.ObjectId) => boolean,
}

const awsSpotRequestSchema = new Schema({
    creator: {type: Schema.Types.ObjectId, ref: 'user', required: true},
    spot_request_id: {type: String, default: null},
    instance_ids: [{type: String, default: null}],
    instance_ips: [{type: String, default: null}],

    aws_config: {type: Object, default: null},

    // Fields needed to show user how the setup process is going
    in_error: {type: Boolean, default: false},
    is_finished: {type: Boolean, default: false}, // is true if setup is done ( or if in error )
    is_canceling: {type: Boolean, default: false},
    setup_log: [{type: String, default: null}],
},
{
    timestamps: true
});

awsSpotRequestSchema.methods.isCreatedBy = function(user_id: Schema.Types.ObjectId) {
    return this.creator.equals(user_id);
}


export const AwsSpotRequest = mongoose.model<IAwsSpotRequest>("awsSpotRequest", awsSpotRequestSchema);
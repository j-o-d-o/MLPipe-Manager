import mongoose, { Schema, Document } from "mongoose";
import { IKey } from "models/key.model";
import AWS from "aws-sdk";


// Role 0 = Developer, 100 = Admin
export interface IUser extends Document {
    name: string,
    email: string,
    role: number,
    salt: string,
    password: string,
    token: string,
    is_active: boolean,
    default_aws_config: AWS.EC2.Types.RequestSpotInstancesRequest,

    keys: Array<Schema.Types.ObjectId | IKey>,
    updatedAt: mongoose.Schema.Types.Date,
    createdAt: mongoose.Schema.Types.Date,

    isAdmin: () => boolean,
    hasKey: (keyId: Schema.Types.ObjectId) => boolean, 
}

const userSchema = new Schema({
    name: { type: String, unique: true, required: true},
    email: {type: String, required: true, unique: true},
    role: {type: Number, default: 0},
    salt: {type: String, required: true, select: false},
    password: { type: String, required: true, select: false },
    token: { type: String, unique: true, required: true, select: false},
    is_active: { type: Boolean, select: false, default: false},
    default_aws_config: {type: Object, default: null},

    keys: [{type: Schema.Types.ObjectId, ref: 'keystore'}],
},
{
    timestamps: true
});

userSchema.methods.isAdmin = function(): boolean {
    return this.role == 100;
}

userSchema.methods.hasKey = function(keyId: mongoose.Types.ObjectId) {
    let found = false;
    this.keys.forEach( (element: mongoose.Types.ObjectId) => {
        if(keyId.equals(element))
            found = true;
    });
    return found;
}


export const User = mongoose.model<IUser>("user", userSchema);
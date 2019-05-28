import { sha512 } from "services/authentication";
import { User, IUser } from "models/user.model";
import mongoose from "mongoose";


export async function isUniqueEmail(emailParam: string, userId: mongoose.Schema.Types.ObjectId) {
    try {
        const param: string = emailParam.toLowerCase();
        const user: IUser = await User.findOne({email: new RegExp('^'+param+'$', 'i')});
        // is unique if either the user email is from the users own profile (_id.equals(userId))
        // or the user is empty
        return !user || user._id.equals(userId);
    }
    catch (err) {
        throw err;
    }
}

export async function isUniqueName(nameParam: string, userId: mongoose.Schema.Types.ObjectId) {
    try {
        const param: string = nameParam.toLowerCase();
        const user: IUser = await User.findOne({
            $or :[
                { email: new RegExp('^'+param+'$', 'i') },
                { name : new RegExp('^'+param+'$', 'i') }
            ]
        });
        // is unique if either the user name is from the users own profile (_id.equals(userId))
        // or the user is empty
        return !user || user._id.equals(userId);
    }
    catch (err) {
        throw err;
    }
}

export async function checkPwd(pwd: string, email: string) {
    try {
        const param: string = email.toLowerCase();
        const user: IUser = await User.findOne( { $and : [
            {$or :[
                { email: new RegExp('^'+param+'$', 'i') },
                { name : new RegExp('^'+param+'$', 'i') }
            ]},
            { is_active : true },
        ]}).select("+password +salt").exec();
        if(user){
            // Check the password
            var hashedPwd = sha512(pwd, user.salt);
            return hashedPwd == user.password;
        }
        else{
            return false;
        }
    }
    catch (err) {
        throw err;
    }
}

export function fileExists(multerMetaData: any) {
    return multerMetaData !== undefined;
}

export function isZip(multerMetaData: any) {
    return multerMetaData !== undefined && multerMetaData.mimetype == "application/zip";
}
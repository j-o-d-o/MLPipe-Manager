import { sha512 } from "services/authentication";
import { User, IUser } from "models/user.model";
import mongoose from "mongoose";


export async function isUniqueEmail(emailParam: string, userId: mongoose.Schema.Types.ObjectId) {
    try {
        const param: string = emailParam.toLowerCase();
        const user: IUser = await User.findOne({email: new RegExp('^'+param+'$', 'i')});
        // is unique if either the user email is from the users own profile (_id.equals(userId))
        // or the user is empty
        if(!user || user._id.equals(userId)) return true;
        throw new Error("Email is not unique");
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
        if(!user || user._id.equals(userId)) return true;
        throw new Error("Name is not unique");
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
            if(hashedPwd == user.password) return true;
        }
        throw new Error("Password or User check failed")
    }
    catch (err) {
        throw err;
    }
}

export function fileExists(multerMetaData: any) {
    if(multerMetaData !== undefined) return true;
    throw new Error("file already exists");
}

export function isZip(multerMetaData: any) {
    if(multerMetaData !== undefined && multerMetaData.mimetype == "application/zip") return true;
    throw new Error("file is not a zip");
}
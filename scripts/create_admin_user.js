/// Use this script to create the first admin user for the application
/// positional arguments:
///   name: user name
///   email: user email
///   password: user password
///
/// example usage: >> node create_admin_user.js admin my@email.com 1234

// URL: POST /user/register
// Bindings: none

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const mongoose = require('mongoose');
const { User } = require("./../build/src/models/user.model");


createAdminUser = async (userName, email, password) => {
    var user = new User();
    user.name = userName;
    user.email = email.toLowerCase();
    user.is_active = true;
    user.role = 100;
    
    // Creating password
    var length = 64;
    user.salt = crypto.randomBytes(Math.ceil(length/2)).toString('hex').slice(0,length);
    user.password = sha512( password, user.salt);
    user.token = jwt.sign({payload: user.email}, process.env.USER_TOKEN);
    
    try {
        const savedUser = await user.save();
        return savedUser;
    }
    catch (err){
        throw err;
    }
}

const sha512 = (password, salt) => {
    var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
    var value = "";
    if(password != "" && password != undefined){
        hash.update(password);
        value = hash.digest('hex');
    }
    return value;
};

// istanbul ignore if
if (require.main === module) {
    res = require('dotenv').config({ path: "../.env" });

    if(res.error){
        throw res.error;
    }

    // Only called when the script is called directly via node as a script
    const userName = process.argv[2];
    const email = process.argv[3];
    const password = process.argv[4];

    if(userName === undefined || password === undefined || email === undefined) {
        throw ("ERROR: please specify userName, email and password as positional arguments (in that order) " +
               "in the arguments. e.g. >> node create_admin_user.js admin my@email.com 1234");
    }

    // Connect to mongoose
    mongoose.Promise = global.Promise;
    mongoose.set('debug', false);
    console.log(process.env.MONGODB_URI);
    const connection_url = process.env.NODE_ENV == "test" ? process.env.MONGODB_URI_TEST : process.env.MONGODB_URI;
    mongoose.connect(connection_url, { useNewUrlParser: true, useCreateIndex: true, }).then(() => {
        console.log("Connected to MongoDB Successfully");
        createAdminUser(userName, email, password);
        console.log("Successfully created new admin user");
    }).catch((err) => {
        throw ("Could not connect to MongoDB", { error: err });
    });
}

// Export (used in testing)
module.exports = createAdminUser
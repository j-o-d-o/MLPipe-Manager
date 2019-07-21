// Local machine might need a ssh server installation first
// >> sudo apt-get install openssh-server
// >> sudo service ssh start
// To only allow localhost edit
// >> sudo nano /etc/hosts.allow
// With:
// sshd : localhost : allow
// sshd : ALL : deny

// Local machine must need a key to connect to ssh
// >> ssh-keygen -b 4096
// >> chmod 400 my_generated_key
// >> ssh-copy-id -i my_generated_key.pub user@localhost
// Test if it works
// >> ssh -i my_generated_key user@localhost

// Local machine must have conda installed and in path

process.env.NODE_ENV = "test";
const PATH_TO_PRIVATE_KEY: string = "/home/jo/Documents/certs/localhost_ssh_key";
const PATH_TO_ZIP_PRJ: string = "/home/jo/Desktop/projects/MLPipe-Manager/test/testData/cifar-10_prj.zip"

import { describe, it } from "mocha";
import chai from "chai";
import chaiHttp from "chai-http";
import mongoose from "mongoose";
import fs from "fs";
import app from "../../src/server";
import { User, IUser } from "models/user.model";
import { Key, IKey } from "models/key.model";
import { IJob } from "models/job.model";
const createAdminUser = require("../../../scripts/create_admin_user");

chai.should();
chai.use(chaiHttp);


let adminUserObj: IUser;
let keyObj: IKey;
let jobObj: IJob;
let trainingId: any;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

describe("Smoke Test Remote", () => {
    before( async () => {
        await User.deleteMany({});
        await Key.deleteMany({});

        // create key to use
        const privateKey = fs.readFileSync(PATH_TO_PRIVATE_KEY, 'utf8');
        let key = new Key();
        key.private_key = privateKey;
        key.name = "_Test_localhost";
        keyObj = await key.save();

        // create admin user and add key to user
        adminUserObj = await createAdminUser("_test_admin", "_test_admin@email.com", "1234");
        adminUserObj.keys.push(keyObj._id);
        await adminUserObj.save();
    });

    describe('/test', () => {
        it('reaching the api', async () => {
            const res = await chai.request(app).get(process.env.API_PREFIX + '/test');
            res.should.have.status(200);
        });
    });

    describe("/job/remote", () => {
        it("Smoke Test - Create Remote Job", async function() {
            this.timeout(5000000);

            const train_src = fs.readFileSync(PATH_TO_ZIP_PRJ);
            const keyId = keyObj._id.toString();

            const res = await chai.request(app)
                .post(process.env.API_PREFIX + "/job/remote")
                .set("authorization", "Bearer " + adminUserObj.token)
                .set("Content-Type", "multipart/form-data")
                .attach("train_src", train_src, PATH_TO_ZIP_PRJ)
                .field("name", "_Test_remote_training")
                .field("description", "Testing remote training on localhost")
                .field("exec_path", "cifar10/train.py")
                .field("config_path", "cifar10/config.ini")
                .field("api_url", "http://localhost:4000")
                .field("key", keyId)
                .field("server_ip", "localhost")
                .field("ssh_port", 22)
                .field("user_name", "jo")
                .field("conda_env", "some_test_env");
            res.should.have.status(200);
            jobObj = res.body;

            let check_training = false;
            let exit_counter: number = 0;
            while(true) {
                if(exit_counter > 40) {
                    return;
                }
                exit_counter++;
                await delay(10000);

                if(!check_training) {
                    const res = await chai.request(app)
                        .get(process.env.API_PREFIX + "/job/" + jobObj._id)
                        .set("authorization", "Bearer " + adminUserObj.token);
                    console.log("In Error: " + res.body.in_error + 
                                " | Finished: " + res.body.is_finished + 
                                " | Number of experiments: " + res.body.trainings.length);
                    if(res.body.trainings.length > 0) {
                        trainingId = res.body.trainings[0]._id.toString();
                        check_training = true;
                    }
                    if(res.body.in_error) {
                        return;
                    }
                }
                else {
                    const res = await chai.request(app)
                        .get(process.env.API_PREFIX + "/training/" + trainingId)
                        .set("jobtoken", jobObj.token);
                    res.should.have.status(200);
                    console.log("Training Status: " + res.body.status);
                    if(res.body.status == 1) {
                        return;
                    }
                }
            }
        });
    });
});
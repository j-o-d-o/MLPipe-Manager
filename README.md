<img src="mlpipe_icon.png" width="500">

# MLPipe Manager

NodeJS server backend to distribute & manage Keras/Tensorflow trainings.
</br></br>
The MLPipe system also provides a lightwight python package to send your Keras/Tensorflow trainings to the backend. As well as a GUI that uses the MLPipe-Manager as backend.</br>
[MLPipe-Trainer](https://github.com/j-o-d-o/MLPipe-Trainer)</br>[MLPipe-Viewer]()

## The Features

- User Managment with Developer and Admin roles
- Manage trainings of Machine Learning models (Tensorflow/Keras)
- Create and manage keys to automatically connect to cloud services
- Create and train on AWS Spot instances. No more up- and downloading of training code, data or results:
  - Automize Spot instance creation via AWS javascript API
  - Automize uploading training code and execution
  - Get results automatically back via the MLPipe-Manager API endpoints

## Getting started

- Currently tested with LTS Node v10.15.3
- Spin up your server, connect to it and checkout the MLPipe-Manager repository
- If you have not yet, install MongoDB. Docu [here](https://github.com/j-o-d-o/MLPipe-Manager/docs/install_mongodb.md)
- Make a copy of the .env.template file, rename it to .env and adjust the fields: `MONGODB_URI, MONGODB_URI_TEST, USER_TOKEN`

### Setup AWS credentials
Create the file `~/.aws/credentials` (Linux/Mac) or `C:\Users\USERNAME\.aws\credentials` (Windows) with this content:
```ini
[default]
aws_access_key_id = your_access_key
aws_secret_access_key = your_secret_key
```
Find/create this key with: </br>
log in to aws console -> click on your user name -> My Security Credentials -> Access keys</br>
In the .env file you can specify the region to be used e.g. `AWS_REGION=eu-west-3`.

### Install packages and start server
```bash
# Install packages
>> npm install
# Build the typescript project
>> tsc
# Start with NODE_ENV=prod and node
>> npm start
```
To run it with [pm2](http://pm2.keymetrics.io/), run `>> pm2 --name MLPipe-Manager start npm -- start`</br>
Note, in case you are not using any webserver and want to access the api through http://ip:port, dont forget to open the port in case you use any firewall. Alternatively, server the API via a webserver and domain.

### Create admin user
Currently the creation of new users is only possible by admins. As there is no MLPipe user in the beginning, there is a script to create an admin user:
```bash
>> cd scripts
# positional arguments: [0]: user name, [1]: user email, [2]: password
>> node create_admin_user.js UserName my@email.com my_password
```
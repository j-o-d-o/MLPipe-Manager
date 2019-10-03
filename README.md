<img src="mlpipe_icon.png" width="500">

# MLPipe Manager

NodeJS server backend to train & manage Keras/Tensorflow trainings.
</br>
The MLPipe system also provides a lightwight python package to send your Keras/Tensorflow trainings to the backend, [MLPipe-Trainer](https://github.com/j-o-d-o/MLPipe-Trainer). As well as a GUI to easly interact with the Manager, [MLPipe-Viewer](https://github.com/j-o-d-o/MLPipe-Viewer).

## The Features

- Manage trainings of Machine Learning models (Tensorflow/Keras)
- Visualize training results
- Train on remote machines (e.g. AWS instances)
  - Automize uploading training code and training data
  - Get results automatically back via the MLPipe-Manager API endpoints
  - (AWS) close spot instances once training is done
- Create and manage keys to automatically connect to remote servers
- User Managment with Developer and Admin roles

## Getting started

- Currently tested with LTS Node v10.16.3
- Spin up your server, connect to it and checkout the MLPipe-Manager repository
- If you have not yet, install MongoDB. Docu [here](https://github.com/j-o-d-o/MLPipe-Manager/docs/install_mongodb.md)
- Make a copy of the .env.template file, rename it to .env and adjust the fields: `MONGODB_URI, MONGODB_URI_TEST, USER_TOKEN`

### Setup AWS credentials (optinal)
Note: This is optional in case you want to terminate AWS spot requests automatically after training is finished</br></br>
Create the file `~/.aws/credentials` (Linux/Mac) or `C:\Users\USERNAME\.aws\credentials` (Windows):
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
# Build the typescript project (typescript needs to be installed: >> npm install typescript -g)
>> tsc
# Start with NODE_ENV=prod and node
>> npm start
```
To run it with [pm2](http://pm2.keymetrics.io/), run `>> pm2 --name MLPipe-Manager start npm -- start`</br>
Note, in case you are not using any webserver and want to access the api through http://ip:port, dont forget to open the port in case you use any firewall. Alternatively, server the API via a webserver and domain.

### Create admin user
Currently the creation of new users is only possible by admins. As there is no MLPipe user in the beginning, there is a script to create a first admin user:
```bash
>> cd scripts
# positional arguments: [0]: user name, [1]: user email, [2]: password
>> node create_admin_user.js UserName my@email.com my_password
```
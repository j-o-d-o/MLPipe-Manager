# Install MongoDB

To install MongoDB, just follow the offical [docs](https://docs.mongodb.com/manual/installation) and chose your system.</br></br>
But there are some additional things to make it secure and work with MLPipe-Manager. The security steps are mainly taken from [here](https://www.digitalocean.com/community/tutorials/how-to-install-and-secure-mongodb-on-ubuntu-16-04), but should not only apply to Ubuntu 16.04.

### Add MongoDB user
After installation there are no MongoDB users and everybody can log in without credentials. So let's create an admin user first:
```bash
# should be able to log in without authorization
>> mongo
# create admin user
>> db.createUser( { user: "root", pwd: "secure_password",  roles: [ { role: "root", db: "admin" } ] })
# exit with ctrl+c
```

### Enable Authorization
In order to only allow log in via a specific user to the MongoDB instance, let's enable authorization. In `/etc/mongod.conf` adjust:
```config
...
security:
  authorization: "enabled"
...
```
```bash
# restart mongodb
>> sudo service mongod restart
```

To test if it worked try:
```bash
>> mongo
# this should show "not authorized" message
>> show dbs
```

### Open MongoDB Port
If you are using some sort of firewall, you need to open the port your MongoDB is running on (default=27017). e.g. for UFW:
```bash
>> sudo ufw allow 27017
# should list port 27017
>> sudo ufw status
```

### Create MLPipe users
To create MLPipe users you can now use either the `>> mongo` console again or some GUI e.g. [Robo 3T](https://robomongo.org/). Create these user roles in the admin database:
```json
{
    "user" : "mlpipe_user",
    "pwd": "my_secure_password",
    "db" : "admin",
    "roles" : [ 
        {
            "role" : "readWrite",
            "db" : "mlpipe"
        }, 
        {
            "role" : "readWrite",
            "db" : "mlpipe_test"
        }
    ]
}
```

Note: There is a bug in Robo 3T viewing the Users in the admin database on double click. You need to right click -> "view".</br></br>

Your `MONGODB_URI` could now be something like this:
```ini
MONGODB_URI=mongodb://mlpipe_user:my_secure_password@localhost:27017/mlpipe?authSource=admin
MONGODB_URI_TEST=mongodb://mlpipe_user:my_secure_password@localhost:27017/mlpipe_test?authSource=admin
```
import ssh2 from "ssh2";
const fs = require('fs');


export function connect(ipAddress: string, port: number, username: string, privateKey: Buffer) : Promise<ssh2.Client> {
    return new Promise((resolve, reject) => {
        var conn = new ssh2.Client();
        conn.on('ready', () => {
            console.log('Client :: ready');
            resolve(conn);
        }).on('error', (err) => {
            reject(err);
        }).connect({
            host: ipAddress,
            port: port,
            username: username,
            privateKey: privateKey,
        });
    });
}

export function uploadFile(conn: ssh2.Client, localPath: string, remotePath: string) : Promise<boolean> {
    return new Promise((resolve, reject) => {
        conn.sftp( (err, sftp) => {
            if (err) {
                reject(err);
            }
            else {
                const readStream = fs.createReadStream(localPath);
                const writeStream = sftp.createWriteStream(remotePath);

                writeStream.on('close', function () {
                    sftp.end();
                    resolve(true);
                });
                writeStream.on('error', function(err) {
                    reject(err);
                });

                // initiate transfer of file
                readStream.pipe( writeStream );
                readStream.on('error', function(err: any) { reject(err); })
            }
        });
    });
}

export function setupTraining(
        conn: ssh2.Client,
        job_id: any,
        job_token: string,
        source_folder: string,
        train_folder: string,
        conda_env: string,
        config_path: string,
        api_url: string)
    {
    // TODO: sanatize execPath & condaEnv for security reasons!
    const commands : string[] = [
        "cd ~",
        "bash setup_training.sh" +
        " -id " + job_id +
        " -t " + job_token +
        " -s " + source_folder +
        " -ts " + train_folder +
        " -env " + conda_env +
        " -p " + config_path +
        " -u " + api_url
    ];
    return _execCommands(conn, commands);
}

export function startTraining(
        conn: ssh2.Client,
        jobId: any,
        condaEnv: string,
        execPath: string,
        sourceFolder: string) 
    {
    // TODO: sanatize execPath & condaEnv for security reasons!
    const commands: string[] = [
        "source ~/.bash_profile",
        "cd ~/" + sourceFolder + "/" + jobId + "/*",
        "export PYTHONPATH=$(pwd)",
        "conda activate " + condaEnv,
        "python " + execPath,
    ];
    return _execCommands(conn, commands);
}

function _execCommands(conn: ssh2.Client, commands: string[]) {
    return new Promise((resolve, reject) => {
        conn.exec(commands.join(" && "), function(err, stream) {
            if (err) reject(err)
            else {
                var streamData: any[] = [];
                stream.on('close', () => {
                    resolve(streamData);
                }).on('data', (data: any) => {
                    // Need better error handling. Maybe check if string contains "[DATE] Error"
                    // because these are error messages from the MLPipe Trainer
                    // But only works if MLPipe Trainer is used... dont really want to be specific on that
                    console.log(' STDOUT: ' + data.toString().replace(/[\r|\n|\r\n]$/, ''));
                    streamData.push('STDOUT: ' + data);
                }).stderr.on('data', data => {
                    // There is no rejecting on STDERR cause a lot of warnings or normal logs
                    // are, for whatever reason, written to STDERR
                    console.log(' STDERR: ' + data.toString().replace(/[\r|\n|\r\n]$/, ''));
                    streamData.push('STDERR: ' + data);
                });
            }
        });
    });
}
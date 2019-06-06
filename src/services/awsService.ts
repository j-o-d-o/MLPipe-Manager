// Load the AWS SDK for Node.js
import AWS from "aws-sdk";
import { DescribeSpotInstanceRequestsResult } from "aws-sdk/clients/ec2";
AWS.config.apiVersion = '2016-11-15';


export async function testKeyPair(keyPairName: string): Promise<AWS.EC2.DescribeKeyPairsResult> {
    try {
        const ec2 = new AWS.EC2();
        const data = await ec2.describeKeyPairs({
            KeyNames: [ keyPairName ],
        }).promise();
        return data;
    }
    catch (err) {
        console.log(err);
        throw err;
    }
}

export async function createSpotInstance(params: AWS.EC2.Types.RequestSpotInstancesRequest): Promise<[string, string]> {
    // params need to be a dict with these otpions
    // https://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_RequestSpotInstances.html
    try {
        // Request Instance -> Get created Instance -> Wait till its running -> return instanced Id
        const ec2 = new AWS.EC2();
        const requestData = await ec2.requestSpotInstances(params).promise();
        const requestId = requestData.SpotInstanceRequests[0].SpotInstanceRequestId;
        console.log("Created AWS Spot Request with Request Id: " + requestId);
        const instanceData = await ec2.waitFor('spotInstanceRequestFulfilled', {SpotInstanceRequestIds:  [requestId]}).promise();
        const instanceId = instanceData.SpotInstanceRequests[0].InstanceId;
        await ec2.waitFor('instanceStatusOk', {InstanceIds:  [instanceId]}).promise();
        console.log("AWS Instance running with Instance Id: " + instanceId);
        return [requestId, instanceId];
    }
    catch (err){
        throw err;
    }
}

export async function cancelSpotRequest(spotRequestId: string): Promise<boolean> {
    // Note that it does not termiante the associated instances with the spot request!
    try {
        const ec2 = new AWS.EC2();
        await ec2.cancelSpotInstanceRequests({ SpotInstanceRequestIds: [spotRequestId] }).promise();
        return true;
    }
    catch (err) {
        throw err;
    }
}

export async function stopInstance(instanceId: string): Promise<boolean> {
    try {
        const ec2 = new AWS.EC2();
        await ec2.stopInstances({ InstanceIds: [instanceId] }).promise();
        return true;
    }
    catch (err) {
        throw err;
    }
}

export async function terminateInstances(instanceIds: string[]): Promise<boolean> {
    try {
        // For some reason there is an issue with just taking the original array...
        let ids: string[] = [];
        instanceIds.forEach( id => { ids.push(id) });
        const ec2 = new AWS.EC2();
        await ec2.terminateInstances({InstanceIds: ids}).promise();
        return true;
    }
    catch (err) {
        throw err;
    }
}

export async function getInstanceId(spotRequestId: string): Promise<string> {
    try {
        const ec2 = new AWS.EC2();
        const data = await ec2.describeSpotInstanceRequests({SpotInstanceRequestIds: [spotRequestId]}).promise();
        // var instanceType = data.Reservations[0].Instances[0].InstanceType;
        // var dns = data.Reservations[0].Instances[0].PublicDnsName;
        const instanceId = data.SpotInstanceRequests[0].InstanceId;
        return instanceId;
    }
    catch (err) {
        throw err;
    }
}

export async function getIPfromInstance(instanceId: string): Promise<string> {
    try {
        const ec2 = new AWS.EC2();
        const data = await ec2.describeInstances({InstanceIds: [instanceId]}).promise();
        // var instanceType = data.Reservations[0].Instances[0].InstanceType;
        // var dns = data.Reservations[0].Instances[0].PublicDnsName;
        const ipAddress = data.Reservations[0].Instances[0].PublicIpAddress;
        return ipAddress;
    }
    catch (err) {
        throw err;
    }
}

export async function getSpotRequests(params: any): Promise<DescribeSpotInstanceRequestsResult> {
    try {
        const ec2 = new AWS.EC2();
        const data = await ec2.describeSpotInstanceRequests(params).promise();
        return data;
    }
    catch (err) {
        throw err;
    }
}
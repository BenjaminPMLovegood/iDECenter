const cp = require("child_process");

function obj(x, appends) {
    var rv = {};

    for (key in x) rv[key] = x[key];
    if (appends) for (key in appends) rv[key] = appends[key];

    return rv;
}

function execWrapper(command, resolve) {
    cp.exec(command, function(error, stdout, stderr) {
        if(error) {
            resolve({ containerId : undefined, error : obj(error, { errmsg : stderr }) });
        } else {
            resolve({ containerId : stdout.trim() });
        }
    });
}

// create a container from a specified image and start it, return the container id
// "docker run"
//
// portMap looks like
// [ { docker : 8080, host : 8081 }, ... ]
// dirMap looks like
// [ { docker : "/root/a", host : "/home/user/docker/a" }, ... ]
module.exports.run = async function(imageName, portMap, dirMap) {
    var portArgs = portMap ? portMap.map(m => `-p ${m.host}:${m.docker}`).join(" ") : "";
    var mountArgs = dirMap ? dirMap.map(m => `-v ${m.host}:${m.docker}`).join(" ") : "";

    return new Promise(resolve => execWrapper(`docker run ${portArgs} ${mountArgs} -d ${imageName}`, resolve));
}

// create a container from a specified image and return the container id
// "docker create"
//
// for param portMap dirMap, see function run
module.exports.create = async function(imageName, portMap, dirMap) {
    var portArgs = portMap ? portMap.map(m => `-p ${m.host}:${m.docker}`).join(" ") : "";
    var mountArgs = dirMap ? dirMap.map(m => `-v ${m.host}:${m.docker}`).join(" ") : "";

    return new Promise(resolve => execWrapper(`docker create ${portArgs} ${mountArgs} ${imageName}`, resolve));
}

// start a container exists
// "docker start"
module.exports.start = async function(containerId) {
    return new Promise(resolve => execWrapper(`docker start ${containerId}`, resolve));
}

// kill a running container
// "docker kill"
module.exports.kill = async function(containerId) {
    return new Promise(resolve => execWrapper(`docker kill ${containerId}`, resolve));
}

// delete a container exists
// "docker rm"
module.exports.rm = async function(containerId) {
    return new Promise(resolve => execWrapper(`docker rm ${containerId}`, resolve));
}

module.exports.ps = async function() {
    return new Promise(resolve => {
        cp.exec("docker ps --no-trunc", function(err, stdout, stderr) { 
            if (err) {
                resolve({ result : undefined, error : obj(err, { errmsg : stderr }) });
            } else {
                resolve({ result : stdout.split('\n').map(m => m.split(' ')[0]).filter(m => m.length == 64) });
            }
        });
    });
}

module.exports.psall = async function() {
    return new Promise(resolve => {
        cp.exec("docker ps --no-trunc -a", function(err, stdout, stderr) { 
            if (err) {
                resolve({ result : undefined, error : obj(err, { errmsg : stderr }) });
            } else {
                resolve({ result : stdout.split('\n').map(m => m.split(' ')[0]).filter(m => m.length == 64) });
            }
        });
    });
}

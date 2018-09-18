const dockerOpModuleName = "dockerop";

function obj(x, appends) {
    var rv = {};

    for (key in x) rv[key] = x[key];
    if (appends) for (key in appends) rv[key] = appends[key];

    return rv;
}

module.exports = function(env) {
    daemon = env.daemon;
    ex = {};

    function execWrapper(command, args, resolve, reject) {
        daemon.call(dockerOpModuleName, command, args, rv => {
            if (rv.cid) resolve(rv.cid);
            else reject(rv.error);
        });
    }

    // create a container from a specified image and return the container id
    // "docker create"
    //
    // portMap looks like
    // [ { docker : 8080, host : 8081 }, ... ]
    // dirMap looks like
    // [ { docker : "/root/a", host : "/home/user/docker/a", readonly : false }, ... ]
    ex.create = async function(imageName, portMap, dirMap, extraArgs) {
        return new Promise((resolve, reject) => {
            execWrapper(
                "create",
                {
                    "img" : imageName,
                    "portmap" : portMap,
                    "dirmap" : dirMap,
                    "extra" : (typeof extraArgs == "string" ? extraArgs : extraArgs.join(" "))
                },
                resolve,
                reject
            );
        });
    }

    // start a container exists
    // "docker start"
    ex.start = async function(containerId) {
        return new Promise((resolve, reject) => {
            execWrapper(
                "start",
                {
                    "cid" : containerId
                },
                resolve,
                reject
            );
        });
    }

    // kill a running container
    // "docker kill"
    ex.kill = async function(containerId) {
        return new Promise((resolve, reject) => {
            execWrapper(
                "kill",
                {
                    "cid" : containerId
                },
                resolve,
                reject
            );
        });
    }

    /*
    // delete a container exists
    // "docker rm"
    ex.rm = async function(containerId) {
        return new Promise(resolve => execWrapper(`docker rm ${containerId}`, resolve));
    }
    */

    ex.ps = async function() {
        return new Promise((resolve, reject) => {
            execWrapper("ps", {}, resolve, reject);
        });
    }

    ex.psall = async function() {
        return new Promise((resolve, reject) => {
            execWrapper("psall", {}, resolve, reject);
        });
    }

    return ex;
}

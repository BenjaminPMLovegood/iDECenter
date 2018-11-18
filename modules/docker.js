const dockerOpModuleName = "dockerop";

module.exports = function(env) {
    daemon = env.daemon;
    ex = {};

    function execWrapper(command, args, resolve, reject) {
        daemon.call(dockerOpModuleName, command, args, rv => {
            if (rv.cid) resolve(rv.cid);
            else reject(rv.error);
        });
    }

    env._runningCids = []

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

    ex.killmany = async function(cids) {
        return new Promise((resolve, reject) => {
            daemon.call(dockerOpModuleName, "killmany", { cids : cids }, rv => {
                if (rv.error) {
                    reject(rv.error);
                } else {
                    resolve(rv.cids);
                }
            });
        });
    }

    ex.refreshRunningStatus = async function() {
        return env._runningCids = (await ex.ps()) || [];
    }

    ex.isCidRunning = function(cid) {
        return env._runningCids.includes(cid);
    }

    ex.startRefresher = function() {
        ex.refreshRunningStatus(); // do it once
        env._refresher = setInterval(function() { ex.refreshRunningStatus(); }, 5000);
    }

    ex.closeRefresher = function() {
        if (env._refresher) clearInterval(env._refresher);
    }

    return ex;
}

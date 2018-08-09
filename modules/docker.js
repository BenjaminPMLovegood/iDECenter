const cp = require("child_process");

// create a container from a specified image and return the container id
// "docker run"
//
// portMap looks like
// [ { docker : 8080, host : 8081 }, ... ]
// dirMap looks like
// [ { docker : "/root/a", host : "/home/user/docker/a" }, ... ]
module.exports.run = async function(imageName, portMap, dirMap) {
    
}

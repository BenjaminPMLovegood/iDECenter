function checkUsername(username) {
    return /^[_a-zA-Z0-9]{1,32}$/.test(username);
}

function checkProjectName(projname) {
    return checkUsername(username);
}

checkUsername.checkProjectName = checkProjectName;

if (typeof module !== "undefined") module.exports = checkUsername;

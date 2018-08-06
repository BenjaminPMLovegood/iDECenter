function checkUsername(username) {
    return /^[_a-zA-Z0-9]{1,32}$/.test(username);
}

if (typeof module !== "undefined") module.exports = checkUsername;

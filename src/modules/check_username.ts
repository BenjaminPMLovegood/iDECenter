export function checkUsername(username: string): boolean {
    return /^[_a-zA-Z0-9]{1,32}$/.test(username);
}

export function checkProjectName(projname: string): boolean {
    return checkUsername(projname);
}


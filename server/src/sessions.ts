const sessions: Record<string, number> = {};

export function getSession(sessionid: string) {
    return sessions[sessionid];
}

export function setSession(sessionid: string, id: number) {
    sessions[sessionid] = id;
}

export function deleteSession(sessionid: string) {
    delete sessions[sessionid];
}

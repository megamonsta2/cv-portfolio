const sessions: Record<string, number> = {};
const five_min = 5 * 60 * 1000;

export function getSession(sessionid: string) {
    return sessions[sessionid];
}

export function setSession(sessionid: string, id: number) {
    sessions[sessionid] = id;

    setTimeout(() => deleteSession(sessionid), five_min);
}

export function deleteSession(sessionid: string) {
    delete sessions[sessionid];
}

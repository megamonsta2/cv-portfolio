type FetchData<T> =
    | { success: true; data: T }
    | { success: false; msg: string };
type CVList = {
    accounts: { id: number; name: string; email: string }[];
    langs: { account_id: number; lang: string }[];
};
type SingleCV = {
    account: {
        name: string;
        email: string;
        aboutme: string | null;
        education: string | null;
    };
    langs: { id: number; lang: string }[];
    links: { id: number; link: string; type: string }[];
};
type SessionData = {
    name: string;
    sessionId: string;
};

const funcs: Record<string, () => unknown> = {
    viewcvs,
    viewcv,
    accounts,
    editcv,
};
const url = "http://250129418.cs2410-web01pvm.aston.ac.uk";

class Topbar extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
<p id="topbar">
    <a href="index.html">Main Page</a>
    <a href="viewcvs.html">View CVs</a>
    <a href="accounts.html">Sign Up/Login</a>
    <a href="editcv.html">Edit CV</a>
</p>`;
    }
}

class SessionInfo extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
<div id="session-info">
    <div id="account-info"></div>
    <button hidden id="logout">Logout</button>
</div>`;
    }
}

function main() {
    const fileName = GetFileName();
    const func = funcs[fileName];
    window.onload = () => {
        customElements.define("top-bar", Topbar);
        customElements.define("session-info", SessionInfo);

        if (func) func();
        SetupLogout();
        RefreshSessionInfo();
    };
}

function GetFileName() {
    const path = window.location.pathname;
    return path.substring(path.lastIndexOf("/") + 1).slice(0, -5);
}

async function GetData<T>(
    subpath: string,
    method: "POST" | "GET",
    body?: Record<string, any>,
) {
    const result = await fetch(`${url}/${subpath}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body && JSON.stringify(body),
    });
    return (await result.json()) as FetchData<T>;
}

async function viewcvs() {
    const table = document.getElementById("cv-list");
    if (!(table instanceof HTMLTableElement)) return;

    const cvs = await GetData<CVList>("getcvs", "GET");
    DisplayCVList(cvs, table);

    const searchForm = document.getElementById("search");
    const nameSearch = document.getElementById("name-search-input");
    const langSearch = document.getElementById("lang-search-input");
    const submitSearch = document.getElementById("search-submit");
    const searchDisplay = document.getElementById("search-display");
    if (
        !(searchForm instanceof HTMLFormElement) ||
        !(nameSearch instanceof HTMLInputElement) ||
        !(langSearch instanceof HTMLInputElement) ||
        !(submitSearch instanceof HTMLInputElement) ||
        !searchDisplay
    )
        return;

    searchForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const [name, lang] = [nameSearch.value, langSearch.value];
        console.log(name, lang, typeof name, typeof lang);

        if (name !== "") {
            searchDisplay.innerHTML = "Searched by name!";
            const cvs = await GetData<CVList>(`getcvs/byname/${name}`, "GET");
            DisplayCVList(cvs, table);
        } else if (lang !== "") {
            searchDisplay.innerHTML = "Searched by language!";
            const cvs = await GetData<CVList>(`getcvs/bylang/${lang}`, "GET");
            DisplayCVList(cvs, table);
        } else {
            searchDisplay.innerHTML = "No queries to search with!";
        }
    });
}

function DisplayCVList(cvs: FetchData<CVList>, table: HTMLTableElement) {
    if (!cvs.success) return;
    const rows = table.rows;
    for (let i = 1; i < rows.length; i++) table.deleteRow(i);

    const langsById: Record<number, string[]> = {};
    for (const lang of cvs.data.langs) {
        const id = lang.account_id;
        if (langsById[id]) langsById[id].push(lang.lang);
        else langsById[id] = [lang.lang];
    }

    for (let i = 0; i < cvs.data.accounts.length; i++) {
        const account = cvs.data.accounts[i];
        const row = table.insertRow(i + 1);

        const [nameCell, emailCell, langCell] = [
            row.insertCell(0),
            row.insertCell(1),
            row.insertCell(2),
        ];
        nameCell.innerHTML = `<a href="viewcv.html?id=${account.id}">${account.name}</a>`;
        emailCell.innerHTML = account.email;

        const langs = langsById[account.id];
        if (langs) langCell.innerHTML = langs.join(", ");
        else langCell.innerHTML = "N/A";
    }
}

async function viewcv() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    const display = document.getElementById("view-cv-display");
    if (!display || !id) return;

    const cv = await GetData<SingleCV>(`getcvs/${id}`, "GET");
    if (!cv.success) return;

    const data = cv.data;
    const text: string[] = [
        `Name: ${data.account.name}`,
        `Email: ${data.account.email}`,
    ];
    if (data.account.aboutme) text.push(`About Me: ${data.account.aboutme}`);
    if (data.account.education)
        text.push(`Education: ${data.account.education}`);

    const listsText: string[] = [];
    if (data.langs.length > 0) {
        listsText.push("Programming Languages:<ul>");
        data.langs.forEach((lang) => listsText.push(`<li>${lang.lang}</li>`));
        listsText.push("</ul>");
    }

    if (data.links.length > 0) {
        listsText.push("Links:<ul>");
        data.links.forEach((link) =>
            listsText.push(`<li>${link.link} | ${link.type}</li>`),
        );
        listsText.push("</ul>");
    }

    text.push(listsText.join(""));
    display.innerHTML = text.join("<br>");
}

async function accounts() {
    SetupRegister();
    SetupLogin();
}

async function SetupRegister() {
    const form = document.getElementById("register");
    const nameInput = document.getElementById("register-name");
    const emailInput = document.getElementById("register-email");
    const passwordInput = document.getElementById("register-password");
    const display = document.getElementById("register-display");
    if (
        !(form instanceof HTMLFormElement) ||
        !(nameInput instanceof HTMLInputElement) ||
        !(emailInput instanceof HTMLInputElement) ||
        !(passwordInput instanceof HTMLInputElement) ||
        !display
    )
        return;

    form.onsubmit = async (e) => {
        e.preventDefault();
        if (sessionStorage.getItem("sessionId"))
            return (display.innerHTML = "You are already logged in!");

        const [name, email, password] = [
            nameInput.value,
            emailInput.value,
            passwordInput.value,
        ];
        const result = await GetData<SessionData>("register", "POST", {
            name,
            email,
            password,
        });
        SetSessionInfo(result, display);
    };
}

async function SetupLogin() {
    const form = document.getElementById("login");
    const emailInput = document.getElementById("login-email");
    const passwordInput = document.getElementById("login-password");
    const display = document.getElementById("login-display");
    if (
        !(form instanceof HTMLFormElement) ||
        !(emailInput instanceof HTMLInputElement) ||
        !(passwordInput instanceof HTMLInputElement) ||
        !display
    )
        return;

    form.onsubmit = async (e) => {
        e.preventDefault();
        if (sessionStorage.getItem("sessionId"))
            return (display.innerHTML = "You are already logged in!");

        const [email, password] = [emailInput.value, passwordInput.value];
        const result = await GetData<SessionData>("login", "POST", {
            email,
            password,
        });
        SetSessionInfo(result, display);
    };
}

async function SetupLogout() {
    const logout = document.getElementById("logout");
    if (!(logout instanceof HTMLButtonElement)) return;

    logout.onclick = async () => {
        const sessionId = sessionStorage.getItem("sessionId");
        if (!sessionId) return;

        const result = await GetData<undefined>("logout", "POST", {
            sessionId,
        });
        if (result.success) sessionStorage.clear();
        RefreshSessionInfo();
    };
}

function SetSessionInfo(result: FetchData<SessionData>, display: HTMLElement) {
    if (result.success) {
        const { name, sessionId } = result.data;
        sessionStorage.setItem("name", name);
        sessionStorage.setItem("sessionId", sessionId);

        display.innerHTML = `Success!`;
        RefreshSessionInfo();
    } else display.innerHTML = `Failed! ${result.msg}`;
}

function RefreshSessionInfo() {
    const accountInfo = document.getElementById("account-info");
    const logout = document.getElementById("logout");
    if (!accountInfo || !logout) return;

    const sessionId = sessionStorage.getItem("sessionId");
    if (sessionId) {
        const name = sessionStorage.getItem("name");
        accountInfo.innerHTML = `Logged in as ${name ?? "UNDEFINED"}`;
        logout.hidden = false;
    } else {
        accountInfo.innerHTML = "Not logged in";
        logout.hidden = true;
    }
}

async function editcv() {
    const LoggedIn = document.getElementById("edit-cv-logged-in");
    const NotLoggedIn = document.getElementById("edit-cv-not-logged-in");
    if (!LoggedIn || !NotLoggedIn) return;

    const sessionId = sessionStorage.getItem("sessionId");
    if (!sessionId) {
        LoggedIn.hidden = true;
        NotLoggedIn.hidden = false;
        return;
    }

    LoggedIn.hidden = false;
    NotLoggedIn.hidden = true;

    const cv = await GetData<SingleCV>(`getcvs/bysession/${sessionId}`, "GET");
    if (cv.success) {
        const aboutMeDisplay = document.getElementById(
            "edit-cv-about-me-display",
        );
        if (aboutMeDisplay) {
            aboutMeDisplay.innerHTML = `Currently: ${cv.data.account.aboutme ?? "N/A"}`;
        }

        const educationDisplay = document.getElementById(
            "edit-cv-education-display",
        );
        if (educationDisplay) {
            educationDisplay.innerHTML = `Currently: ${cv.data.account.education ?? "N/A"}`;
        }

        const langsDisplay = document.getElementById("edit-cv-langs-display");
        if (langsDisplay instanceof HTMLTableElement) {
            for (let i = 0; i < cv.data.langs.length; i++) {
                const lang = cv.data.langs[i];
                AddNewLanguage(langsDisplay, i, lang.id, lang.lang);
            }
        }

        const linksDisplay = document.getElementById("edit-cv-links-display");
        if (linksDisplay instanceof HTMLTableElement) {
            for (let i = 0; i < cv.data.links.length; i++) {
                const link = cv.data.links[i];
                AddNewLink(linksDisplay, i, link.id, link.link, link.type);
            }
        }
    }

    UpdateAboutMe();
    UpdateEducation();
    UpdateLanguages();
    UpdateLinks();
}

async function UpdateAboutMe() {
    const form = document.getElementById("edit-cv-about-me");
    const input = document.getElementById("edit-cv-about-me-input");
    const display = document.getElementById("edit-cv-about-me-display");
    if (
        !(form instanceof HTMLFormElement) ||
        !(input instanceof HTMLInputElement) ||
        !display
    )
        return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const sessionid = sessionStorage.getItem("sessionId");
        if (!sessionid) return;

        const text = input.value;
        input.value = "";

        const cv = await GetData(`update/about-me`, "POST", {
            sessionid,
            text,
        });
        if (cv.success && display)
            display.innerHTML = `Currently: ${text ?? "N/A"}`;
    });
}

async function UpdateEducation() {
    const form = document.getElementById("edit-cv-education");
    const input = document.getElementById("edit-cv-education-input");
    const display = document.getElementById("edit-cv-education-display");
    if (
        !(form instanceof HTMLFormElement) ||
        !(input instanceof HTMLInputElement) ||
        !display
    )
        return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const sessionid = sessionStorage.getItem("sessionId");
        if (!sessionid) return;

        const text = input.value;
        input.value = "";

        const cv = await GetData(`update/education`, "POST", {
            sessionid,
            text,
        });
        if (cv.success && display)
            display.innerHTML = `Currently: ${text ?? "N/A"}`;
    });
}

async function UpdateLanguages() {
    const form = document.getElementById("edit-cv-langs");
    const input = document.getElementById("edit-cv-langs-input");
    const display = document.getElementById("edit-cv-langs-display");
    if (
        !(form instanceof HTMLFormElement) ||
        !(input instanceof HTMLInputElement) ||
        !(display instanceof HTMLTableElement)
    )
        return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const sessionid = sessionStorage.getItem("sessionId");
        if (!sessionid) return;

        const lang = input.value;
        if (lang === "") return;
        input.value = "";

        const cv = await GetData<{ id: number }>(`update/langs/add`, "POST", {
            sessionid,
            lang,
        });
        if (!cv.success) return;

        AddNewLanguage(display, display.rows.length, cv.data.id, lang);
    });
}

async function AddNewLanguage(
    display: HTMLTableElement,
    index: number,
    langid: number,
    lang: string,
) {
    const row = display.insertRow(index);
    const displayCell = row.insertCell(0);
    const removeCell = row.insertCell(1);

    const button = document.createElement("button");
    button.innerHTML = "Delete";
    button.addEventListener("click", async (e) => {
        e.preventDefault();

        const sessionid = sessionStorage.getItem("sessionId");
        if (!sessionid) return;

        const result = await GetData("update/langs/delete", "POST", {
            sessionid,
            langid,
        });
        if (result.success) row.remove();
    });

    displayCell.innerHTML = lang;
    removeCell.appendChild(button);
}

async function UpdateLinks() {
    const form = document.getElementById("edit-cv-links");
    const input = document.getElementById("edit-cv-links-input");
    const typeinput = document.getElementById("edit-cv-links-type-input");
    const display = document.getElementById("edit-cv-links-display");
    if (
        !(form instanceof HTMLFormElement) ||
        !(input instanceof HTMLInputElement) ||
        !(typeinput instanceof HTMLSelectElement) ||
        !(display instanceof HTMLTableElement)
    )
        return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const sessionid = sessionStorage.getItem("sessionId");
        if (!sessionid) return;

        const [link, type] = [input.value, typeinput.value];
        if (link === "" || type === "") return;
        input.value = "";
        typeinput.value = "";

        const cv = await GetData<{ id: number }>(`update/links/add`, "POST", {
            sessionid,
            link,
            type,
        });
        if (!cv.success) return;

        AddNewLink(display, display.rows.length, cv.data.id, link, type);
    });
}

async function AddNewLink(
    display: HTMLTableElement,
    index: number,
    linkid: number,
    link: string,
    type: string,
) {
    const row = display.insertRow(index);
    const typeCell = row.insertCell(0);
    const linkCell = row.insertCell(1);
    const removeCell = row.insertCell(2);

    const button = document.createElement("button");
    button.innerHTML = "Delete";
    button.addEventListener("click", async (e) => {
        e.preventDefault();

        const sessionid = sessionStorage.getItem("sessionId");
        if (!sessionid) return;

        const result = await GetData("update/links/delete", "POST", {
            sessionid,
            linkid,
        });
        if (result.success) row.remove();
    });

    typeCell.innerHTML = type;
    linkCell.innerHTML = link;
    removeCell.appendChild(button);
}

main();

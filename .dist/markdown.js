import { Channel } from "./channel.js";
import { Dialog } from "./dialog.js";
import { Emoji } from "./emoji.js";
class MarkDown {
    txt;
    keep;
    stdsize;
    owner;
    info;
    constructor(text, owner, { keep = false, stdsize = false } = {}) {
        if ((typeof text) === (typeof "")) {
            this.txt = text.split("");
        }
        else {
            this.txt = text;
        }
        if (this.txt === undefined) {
            this.txt = [];
        }
        this.info = owner.info;
        this.keep = keep;
        this.owner = owner;
        this.stdsize = stdsize;
    }
    get rawString() {
        return this.txt.join("");
    }
    get textContent() {
        return this.makeHTML().textContent;
    }
    makeHTML({ keep = this.keep, stdsize = this.stdsize } = {}) {
        return this.markdown(this.txt, { keep, stdsize });
    }
    markdown(text, { keep = false, stdsize = false } = {}) {
        let txt;
        if ((typeof text) === (typeof "")) {
            txt = text.split("");
        }
        else {
            txt = text;
        }
        if (txt === undefined) {
            txt = [];
        }
        const span = document.createElement("span");
        let current = document.createElement("span");
        function appendcurrent() {
            if (current.innerHTML !== "") {
                span.append(current);
                current = document.createElement("span");
            }
        }
        for (let i = 0; i < txt.length; i++) {
            if (txt[i] === "\n" || i === 0) {
                const first = i === 0;
                if (first) {
                    i--;
                }
                let element = document.createElement("span");
                let keepys = "";
                if (txt[i + 1] === "#") {
                    console.log("test");
                    if (txt[i + 2] === "#") {
                        if (txt[i + 3] === "#" && txt[i + 4] === " ") {
                            element = document.createElement("h3");
                            keepys = "### ";
                            i += 5;
                        }
                        else if (txt[i + 3] === " ") {
                            element = document.createElement("h2");
                            element.classList.add("h2md");
                            keepys = "## ";
                            i += 4;
                        }
                    }
                    else if (txt[i + 2] === " ") {
                        element = document.createElement("h1");
                        keepys = "# ";
                        i += 3;
                    }
                }
                else if (txt[i + 1] === ">" && txt[i + 2] === " ") {
                    element = document.createElement("div");
                    const line = document.createElement("div");
                    line.classList.add("quoteline");
                    element.append(line);
                    element.classList.add("quote");
                    keepys = "> ";
                    i += 3;
                }
                if (keepys) {
                    appendcurrent();
                    if (!first && !stdsize) {
                        span.appendChild(document.createElement("br"));
                    }
                    const build = [];
                    for (; txt[i] !== "\n" && txt[i] !== undefined; i++) {
                        build.push(txt[i]);
                    }
                    try {
                        if (stdsize) {
                            element = document.createElement("span");
                        }
                        if (keep) {
                            element.append(keepys);
                            //span.appendChild(document.createElement("br"));
                        }
                        element.appendChild(this.markdown(build, { keep, stdsize }));
                        span.append(element);
                    }
                    finally {
                        i -= 1;
                        console.log(txt[i]);
                        continue;
                    }
                }
                if (first) {
                    i++;
                }
            }
            if (txt[i] === "\n") {
                if (!stdsize) {
                    appendcurrent();
                    span.append(document.createElement("br"));
                }
                continue;
            }
            if (txt[i] === "`") {
                let count = 1;
                if (txt[i + 1] === "`") {
                    count++;
                    if (txt[i + 2] === "`") {
                        count++;
                    }
                }
                let build = "";
                if (keep) {
                    build += "`".repeat(count);
                }
                let find = 0;
                let j = i + count;
                let init = true;
                for (; txt[j] !== undefined && (txt[j] !== "\n" || count === 3) && find !== count; j++) {
                    if (txt[j] === "`") {
                        find++;
                    }
                    else {
                        if (find !== 0) {
                            build += "`".repeat(find);
                            find = 0;
                        }
                        if (init && count === 3) {
                            if (txt[j] === " " || txt[j] === "\n") {
                                init = false;
                            }
                            if (keep) {
                                build += txt[j];
                            }
                            continue;
                        }
                        build += txt[j];
                    }
                }
                if (stdsize) {
                    console.log(build);
                    build = build.replaceAll("\n", "");
                    console.log(build, JSON.stringify(build));
                }
                if (find === count) {
                    appendcurrent();
                    i = j;
                    if (keep) {
                        build += "`".repeat(find);
                    }
                    if (count !== 3 && !stdsize) {
                        const samp = document.createElement("samp");
                        samp.textContent = build;
                        span.appendChild(samp);
                    }
                    else {
                        const pre = document.createElement("pre");
                        if (build.at(-1) === "\n") {
                            build = build.substring(0, build.length - 1);
                        }
                        if (txt[i] === "\n") {
                            i++;
                        }
                        pre.textContent = build;
                        span.appendChild(pre);
                    }
                    i--;
                    continue;
                }
            }
            if (txt[i] === "*") {
                let count = 1;
                if (txt[i + 1] === "*") {
                    count++;
                    if (txt[i + 2] === "*") {
                        count++;
                    }
                }
                let build = [];
                let find = 0;
                let j = i + count;
                for (; txt[j] !== undefined && find !== count; j++) {
                    if (txt[j] === "*") {
                        find++;
                    }
                    else {
                        build.push(txt[j]);
                        if (find !== 0) {
                            build = build.concat(new Array(find).fill("*"));
                            find = 0;
                        }
                    }
                }
                if (find === count && (count != 1 || txt[i + 1] !== " ")) {
                    appendcurrent();
                    i = j;
                    const stars = "*".repeat(count);
                    if (count === 1) {
                        const i = document.createElement("i");
                        if (keep) {
                            i.append(stars);
                        }
                        i.appendChild(this.markdown(build, { keep, stdsize }));
                        if (keep) {
                            i.append(stars);
                        }
                        span.appendChild(i);
                    }
                    else if (count === 2) {
                        const b = document.createElement("b");
                        if (keep) {
                            b.append(stars);
                        }
                        b.appendChild(this.markdown(build, { keep, stdsize }));
                        if (keep) {
                            b.append(stars);
                        }
                        span.appendChild(b);
                    }
                    else {
                        const b = document.createElement("b");
                        const i = document.createElement("i");
                        if (keep) {
                            b.append(stars);
                        }
                        b.appendChild(this.markdown(build, { keep, stdsize }));
                        if (keep) {
                            b.append(stars);
                        }
                        i.appendChild(b);
                        span.appendChild(i);
                    }
                    i--;
                    continue;
                }
            }
            if (txt[i] === "_") {
                let count = 1;
                if (txt[i + 1] === "_") {
                    count++;
                    if (txt[i + 2] === "_") {
                        count++;
                    }
                }
                let build = [];
                let find = 0;
                let j = i + count;
                for (; txt[j] !== undefined && find !== count; j++) {
                    if (txt[j] === "_") {
                        find++;
                    }
                    else {
                        build.push(txt[j]);
                        if (find !== 0) {
                            build = build.concat(new Array(find).fill("_"));
                            find = 0;
                        }
                    }
                }
                if (find === count && (count != 1 || (txt[j + 1] === " " || txt[j + 1] === "\n" || txt[j + 1] === undefined))) {
                    appendcurrent();
                    i = j;
                    const underscores = "_".repeat(count);
                    if (count === 1) {
                        const i = document.createElement("i");
                        if (keep) {
                            i.append(underscores);
                        }
                        i.appendChild(this.markdown(build, { keep, stdsize }));
                        if (keep) {
                            i.append(underscores);
                        }
                        span.appendChild(i);
                    }
                    else if (count === 2) {
                        const u = document.createElement("u");
                        if (keep) {
                            u.append(underscores);
                        }
                        u.appendChild(this.markdown(build, { keep, stdsize }));
                        if (keep) {
                            u.append(underscores);
                        }
                        span.appendChild(u);
                    }
                    else {
                        const u = document.createElement("u");
                        const i = document.createElement("i");
                        if (keep) {
                            i.append(underscores);
                        }
                        i.appendChild(this.markdown(build, { keep, stdsize }));
                        if (keep) {
                            i.append(underscores);
                        }
                        u.appendChild(i);
                        span.appendChild(u);
                    }
                    i--;
                    continue;
                }
            }
            if (txt[i] === "~" && txt[i + 1] === "~") {
                const count = 2;
                let build = [];
                let find = 0;
                let j = i + 2;
                for (; txt[j] !== undefined && find !== count; j++) {
                    if (txt[j] === "~") {
                        find++;
                    }
                    else {
                        build.push(txt[j]);
                        if (find !== 0) {
                            build = build.concat(new Array(find).fill("~"));
                            find = 0;
                        }
                    }
                }
                if (find === count) {
                    appendcurrent();
                    i = j - 1;
                    const tildes = "~~";
                    if (count === 2) {
                        const s = document.createElement("s");
                        if (keep) {
                            s.append(tildes);
                        }
                        s.appendChild(this.markdown(build, { keep, stdsize }));
                        if (keep) {
                            s.append(tildes);
                        }
                        span.appendChild(s);
                    }
                    continue;
                }
            }
            if (txt[i] === "|" && txt[i + 1] === "|") {
                const count = 2;
                let build = [];
                let find = 0;
                let j = i + 2;
                for (; txt[j] !== undefined && find !== count; j++) {
                    if (txt[j] === "|") {
                        find++;
                    }
                    else {
                        build.push(txt[j]);
                        if (find !== 0) {
                            build = build.concat(new Array(find).fill("~"));
                            find = 0;
                        }
                    }
                }
                if (find === count) {
                    appendcurrent();
                    i = j - 1;
                    const pipes = "||";
                    if (count === 2) {
                        const j = document.createElement("j");
                        if (keep) {
                            j.append(pipes);
                        }
                        j.appendChild(this.markdown(build, { keep, stdsize }));
                        j.classList.add("spoiler");
                        j.onclick = MarkDown.unspoil;
                        if (keep) {
                            j.append(pipes);
                        }
                        span.appendChild(j);
                    }
                    continue;
                }
            }
            if (txt[i] === "h" && txt[i + 1] === "t" && txt[i + 2] === "t" && txt[i + 3] === "p") {
                let build = "http";
                let j = i + 4;
                const endchars = new Set(["\\", "<", ">", "|", "]", " "]);
                for (; txt[j] !== undefined; j++) {
                    const char = txt[j];
                    if (endchars.has(char)) {
                        break;
                    }
                    build += char;
                }
                console.log("checking:" + build);
                if (URL.canParse(build)) {
                    const a = document.createElement("a");
                    //a.href=build;
                    MarkDown.safeLink(a, build);
                    a.textContent = build;
                    a.target = "_blank";
                    i = j;
                    span.appendChild(a);
                }
                continue;
            }
            if (txt[i] === "<" && txt[i + 1] === "t" && txt[i + 2] === ":") {
                let found = false;
                const build = ["<", "t", ":"];
                let j = i + 3;
                for (; txt[j] !== void 0; j++) {
                    build.push(txt[j]);
                    if (txt[j] === ">") {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    appendcurrent();
                    i = j;
                    const parts = build.join("").match(/^<t:([0-9]{1,16})(:([tTdDfFR]))?>$/);
                    const dateInput = new Date(Number.parseInt(parts[1]) * 1000);
                    let time = "";
                    if (Number.isNaN(dateInput.getTime()))
                        time = build.join("");
                    else {
                        if (parts[3] === "d")
                            time = dateInput.toLocaleString(void 0, { day: "2-digit", month: "2-digit", year: "numeric" });
                        else if (parts[3] === "D")
                            time = dateInput.toLocaleString(void 0, { day: "numeric", month: "long", year: "numeric" });
                        else if (!parts[3] || parts[3] === "f")
                            time = dateInput.toLocaleString(void 0, { day: "numeric", month: "long", year: "numeric" }) + " " +
                                dateInput.toLocaleString(void 0, { hour: "2-digit", minute: "2-digit" });
                        else if (parts[3] === "F")
                            time = dateInput.toLocaleString(void 0, { day: "numeric", month: "long", year: "numeric", weekday: "long" }) + " " +
                                dateInput.toLocaleString(void 0, { hour: "2-digit", minute: "2-digit" });
                        else if (parts[3] === "t")
                            time = dateInput.toLocaleString(void 0, { hour: "2-digit", minute: "2-digit" });
                        else if (parts[3] === "T")
                            time = dateInput.toLocaleString(void 0, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                        else if (parts[3] === "R")
                            time = Math.round((Date.now() - (Number.parseInt(parts[1]) * 1000)) / 1000 / 60) + " minutes ago";
                    }
                    const timeElem = document.createElement("span");
                    timeElem.classList.add("markdown-timestamp");
                    timeElem.textContent = time;
                    span.appendChild(timeElem);
                    continue;
                }
            }
            if (txt[i] === "<" && (txt[i + 1] === ":" || (txt[i + 1] === "a" && txt[i + 2] === ":"))) {
                let found = false;
                const build = txt[i + 1] === "a" ? ["<", "a", ":"] : ["<", ":"];
                let j = i + build.length;
                for (; txt[j] !== void 0; j++) {
                    build.push(txt[j]);
                    if (txt[j] === ">") {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    const buildjoin = build.join("");
                    const parts = buildjoin.match(/^<(a)?:\w+:(\d{10,30})>$/);
                    if (parts && parts[2]) {
                        appendcurrent();
                        i = j;
                        const isEmojiOnly = txt.join("").trim() === buildjoin.trim();
                        const owner = (this.owner instanceof Channel) ? this.owner.guild : this.owner;
                        const emoji = new Emoji({ name: buildjoin, id: parts[2], animated: Boolean(parts[1]) }, owner);
                        span.appendChild(emoji.getHTML(isEmojiOnly));
                        continue;
                    }
                }
            }
            if (txt[i] == "[" && !keep) {
                let partsFound = 0;
                let j = i + 1;
                const build = ["["];
                for (; txt[j] !== void 0; j++) {
                    build.push(txt[j]);
                    if (partsFound === 0 && txt[j] === "]") {
                        if (txt[j + 1] === "(" &&
                            txt[j + 2] === "h" && txt[j + 3] === "t" && txt[j + 4] === "t" && txt[j + 5] === "p" && (txt[j + 6] === "s" || txt[j + 6] === ":")) {
                            partsFound++;
                        }
                        else {
                            break;
                        }
                    }
                    else if (partsFound === 1 && txt[j] === ")") {
                        partsFound++;
                        break;
                    }
                }
                if (partsFound === 2) {
                    appendcurrent();
                    i = j;
                    const parts = build.join("").match(/^\[(.+)\]\((https?:.+?)( ('|").+('|"))?\)$/);
                    if (parts) {
                        const linkElem = document.createElement("a");
                        MarkDown.safeLink(linkElem, parts[2]);
                        linkElem.textContent = parts[1];
                        linkElem.target = "_blank";
                        linkElem.rel = "noopener noreferrer";
                        linkElem.title = (parts[3] ? parts[3].substring(2, parts[3].length - 1) + "\n\n" : "") + parts[2];
                        span.appendChild(linkElem);
                        continue;
                    }
                }
            }
            current.textContent += txt[i];
        }
        appendcurrent();
        return span;
    }
    static unspoil(e) {
        e.target.classList.remove("spoiler");
        e.target.classList.add("unspoiled");
    }
    giveBox(box) {
        box.onkeydown = _ => {
            //console.log(_);
        };
        let prevcontent = "";
        box.onkeyup = _ => {
            const content = MarkDown.gatherBoxText(box);
            if (content !== prevcontent) {
                prevcontent = content;
                this.txt = content.split("");
                this.boxupdate(box);
            }
        };
        box.onpaste = _ => {
            if (!_.clipboardData)
                return;
            console.log(_.clipboardData.types);
            const data = _.clipboardData.getData("text");
            document.execCommand("insertHTML", false, data);
            _.preventDefault();
            if (!box.onkeyup)
                return;
            box.onkeyup(new KeyboardEvent("_"));
        };
    }
    boxupdate(box) {
        const restore = saveCaretPosition(box);
        box.innerHTML = "";
        box.append(this.makeHTML({ keep: true }));
        if (restore) {
            restore();
        }
    }
    static gatherBoxText(element) {
        if (element.tagName.toLowerCase() === "img") {
            return element.alt;
        }
        if (element.tagName.toLowerCase() === "br") {
            return "\n";
        }
        let build = "";
        for (const thing of element.childNodes) {
            if (thing instanceof Text) {
                const text = thing.textContent;
                build += text;
                continue;
            }
            const text = this.gatherBoxText(thing);
            if (text) {
                build += text;
            }
        }
        return build;
    }
    static trustedDomains = new Set([location.host]);
    static safeLink(elm, url) {
        if (URL.canParse(url)) {
            const Url = new URL(url);
            if (elm instanceof HTMLAnchorElement && this.trustedDomains.has(Url.host)) {
                elm.href = url;
                elm.target = "_blank";
                return;
            }
            elm.onmouseup = _ => {
                if (_.button === 2)
                    return;
                console.log(":3");
                function open() {
                    const proxy = window.open(url, '_blank');
                    if (proxy && _.button === 1) {
                        proxy.focus();
                    }
                    else if (proxy) {
                        window.focus();
                    }
                }
                if (this.trustedDomains.has(Url.host)) {
                    open();
                }
                else {
                    const full = new Dialog([
                        "vdiv",
                        ["title", "You're leaving spacebar"],
                        ["text", "You're going to " + Url.host + " are you sure you want to go there?"],
                        ["hdiv",
                            ["button", "", "Nevermind", _ => full.hide()],
                            ["button", "", "Go there", _ => { open(); full.hide(); }],
                            ["button", "", "Go there and trust in the future", _ => {
                                    open();
                                    full.hide();
                                    this.trustedDomains.add(Url.host);
                                }]
                        ]
                    ]);
                    full.show();
                }
            };
        }
        else {
            throw Error(url + " is not a valid URL");
        }
    }
}
//solution from https://stackoverflow.com/questions/4576694/saving-and-restoring-caret-position-for-contenteditable-div
function saveCaretPosition(context) {
    const selection = window.getSelection();
    if (!selection)
        return;
    const range = selection.getRangeAt(0);
    range.setStart(context, 0);
    const len = range.toString().length;
    return function restore() {
        if (!selection)
            return;
        const pos = getTextNodeAtPosition(context, len);
        selection.removeAllRanges();
        const range = new Range();
        range.setStart(pos.node, pos.position);
        selection.addRange(range);
    };
}
function getTextNodeAtPosition(root, index) {
    const NODE_TYPE = NodeFilter.SHOW_TEXT;
    const treeWalker = document.createTreeWalker(root, NODE_TYPE, elem => {
        if (!elem.textContent)
            return 0;
        if (index > elem.textContent.length) {
            index -= elem.textContent.length;
            return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
    });
    const c = treeWalker.nextNode();
    return {
        node: c ? c : root,
        position: index
    };
}
export { MarkDown };

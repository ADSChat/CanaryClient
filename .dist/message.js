import { Contextmenu } from "./contextmenu.js";
import { User } from "./user.js";
import { Member } from "./member.js";
import { MarkDown } from "./markdown.js";
import { Embed } from "./embed.js";
import { File } from "./file.js";
import { SnowFlake } from "./snowflake.js";
import { Emoji } from "./emoji.js";
class Message {
    static contextmenu = new Contextmenu("message menu");
    owner;
    headers;
    embeds;
    author;
    mentions;
    mention_roles;
    attachments; //probably should be its own class tbh, should be Attachments[]
    snowflake;
    message_reference;
    type;
    timestamp;
    content;
    static del;
    static resolve;
    /*
    weakdiv:WeakRef<HTMLDivElement>;
    set div(e:HTMLDivElement){
        if(!e){
            this.weakdiv=null;
            return;
        }
        this.weakdiv=new WeakRef(e);
    }
    get div(){
        return this.weakdiv?.deref();
    }
    //*/
    div;
    member;
    reactions;
    get id() {
        return this.snowflake.id;
    }
    static setup() {
        this.del = new Promise(_ => { this.resolve = _; });
        Message.setupcmenu();
    }
    static setupcmenu() {
        Message.contextmenu.addbutton("Copy raw text", function () {
            navigator.clipboard.writeText(this.content.rawString);
        });
        Message.contextmenu.addbutton("Reply", function (div) {
            this.channel.setReplying(this);
        });
        Message.contextmenu.addbutton("Copy message id", function () {
            navigator.clipboard.writeText(this.id);
        });
        Message.contextmenu.addsubmenu("Add reaction", function (e) {
            Emoji.emojiPicker(e.x, e.y, this.localuser).then(_ => {
                console.log(_, ":3");
                this.reactionToggle(_);
            });
        });
        Message.contextmenu.addbutton("Edit", function () {
            this.channel.editing = this;
            const markdown = document.getElementById("typebox")["markdown"];
            markdown.txt = this.content.rawString.split('');
            markdown.boxupdate(document.getElementById("typebox"));
        }, null, _ => { return _.author.id === _.localuser.user.id; });
        Message.contextmenu.addbutton("Delete message", function () {
            this.delete();
        }, null, _ => { return _.canDelete(); });
    }
    constructor(messagejson, owner) {
        this.owner = owner;
        this.headers = this.owner.headers;
        this.giveData(messagejson);
        this.owner.messages.set(this.id, this);
    }
    reactionToggle(emoji) {
        let remove = false;
        for (const thing of this.reactions) {
            if (thing.emoji.name === emoji) {
                remove = thing.me;
                break;
            }
        }
        let reactiontxt;
        if (emoji instanceof Emoji) {
            reactiontxt = `${emoji.name}:${emoji.id}`;
        }
        else {
            reactiontxt = encodeURIComponent(emoji);
        }
        fetch(`${this.info.api}/channels/${this.channel.id}/messages/${this.id}/reactions/${reactiontxt}/@me`, {
            method: remove ? "DELETE" : "PUT",
            headers: this.headers
        });
    }
    giveData(messagejson) {
        const func = this.channel.infinite.snapBottom();
        for (const thing of Object.keys(messagejson)) {
            if (thing === "attachments") {
                this.attachments = [];
                for (const thing of messagejson.attachments) {
                    this.attachments.push(new File(thing, this));
                }
                continue;
            }
            else if (thing === "content") {
                this.content = new MarkDown(messagejson[thing], this.channel);
                continue;
            }
            else if (thing === "id") {
                this.snowflake = new SnowFlake(messagejson.id, this);
                continue;
            }
            else if (thing === "member") {
                Member.new(messagejson.member, this.guild).then(_ => {
                    this.member = _;
                });
                continue;
            }
            else if (thing === "embeds") {
                this.embeds = [];
                for (const thing in messagejson.embeds) {
                    console.log(thing, messagejson.embeds);
                    this.embeds[thing] = new Embed(messagejson.embeds[thing], this);
                }
                continue;
            }
            this[thing] = messagejson[thing];
        }
        if (messagejson.reactions?.length) {
            console.log(messagejson.reactions, ":3");
        }
        this.author = new User(messagejson.author, this.localuser);
        for (const thing in messagejson.mentions) {
            this.mentions[thing] = new User(messagejson.mentions[thing], this.localuser);
        }
        if (!this.member && this.guild.id !== "@me") {
            this.author.resolvemember(this.guild).then(_ => {
                this.member = _;
            });
        }
        if (this.mentions.length || this.mention_roles.length) { //currently mention_roles isn't implemented on the spacebar servers
            console.log(this.mentions, this.mention_roles);
        }
        if (this.mentionsuser(this.localuser.user)) {
            console.log(this);
        }
        if (this.div) {
            this.generateMessage();
        }
        func();
    }
    canDelete() {
        return this.channel.hasPermission("MANAGE_MESSAGES") || this.author.snowflake === this.localuser.user.snowflake;
    }
    get channel() {
        return this.owner;
    }
    get guild() {
        return this.owner.guild;
    }
    get localuser() {
        return this.owner.localuser;
    }
    get info() {
        return this.owner.info;
    }
    messageevents(obj) {
        const func = Message.contextmenu.bind(obj, this);
        this.div = obj;
        obj.classList.add("messagediv");
    }
    deleteDiv() {
        if (!this.div)
            return;
        try {
            this.div.remove();
            this.div = undefined;
        }
        catch (e) {
            console.error(e);
        }
    }
    mentionsuser(userd) {
        if (userd instanceof User) {
            return this.mentions.includes(userd);
        }
        else if (userd instanceof Member) {
            return this.mentions.includes(userd.user);
        }
    }
    getimages() {
        const build = [];
        for (const thing of this.attachments) {
            if (thing.content_type.startsWith('image/')) {
                build.push(thing);
            }
        }
        return build;
    }
    async edit(content) {
        return await fetch(this.info.api + "/channels/" + this.channel.snowflake + "/messages/" + this.id, {
            method: "PATCH",
            headers: this.headers,
            body: JSON.stringify({ content: content })
        });
    }
    delete() {
        fetch(`${this.info.api}/channels/${this.channel.snowflake}/messages/${this.id}`, {
            headers: this.headers,
            method: "DELETE",
        });
    }
    deleteEvent() {
        if (this.div) {
            this.div.innerHTML = "";
            this.div = undefined;
        }
        const prev = this.channel.idToPrev.get(this.snowflake);
        const next = this.channel.idToNext.get(this.snowflake);
        if (prev) {
            this.channel.idToPrev.delete(this.snowflake);
        }
        if (next) {
            this.channel.idToNext.delete(this.snowflake);
        }
        if (prev && next) {
            this.channel.idToPrev.set(next, prev);
            this.channel.idToNext.set(prev, next);
        }
        this.channel.messageids.delete(this.snowflake);
        if (prev && prev.getObject()) {
            prev.getObject().generateMessage();
        }
        if (this.channel.lastmessage === this) {
            if (prev) {
                this.channel.lastmessage = prev.getObject();
            }
            else {
                this.channel.lastmessage = undefined;
            }
        }
    }
    reactdiv;
    generateMessage(premessage = undefined) {
        if (!this.div)
            return;
        if (!premessage) {
            premessage = this.channel.idToPrev.get(this.snowflake)?.getObject();
        }
        const div = this.div;
        if (this === this.channel.replyingto) {
            div.classList.add("replying");
        }
        div.innerHTML = "";
        const build = document.createElement('div');
        build.classList.add("flexltr");
        if (this.message_reference) {
            const replyline = document.createElement("div");
            const line = document.createElement("hr");
            const minipfp = document.createElement("img");
            minipfp.classList.add("replypfp");
            replyline.appendChild(line);
            replyline.appendChild(minipfp);
            const username = document.createElement("span");
            replyline.appendChild(username);
            const reply = document.createElement("div");
            username.classList.add("username");
            this.author.bind(username, this.guild);
            reply.classList.add("replytext");
            replyline.appendChild(reply);
            const line2 = document.createElement("hr");
            replyline.appendChild(line2);
            line2.classList.add("reply");
            line.classList.add("startreply");
            replyline.classList.add("replyflex");
            this.channel.getmessage(this.message_reference.message_id).then(message => {
                const author = message.author;
                reply.appendChild(message.content.makeHTML({ stdsize: true }));
                minipfp.src = author.getpfpsrc();
                author.bind(minipfp);
                username.textContent = author.username;
                author.bind(username);
            });
            reply.onclick = _ => {
                console.log("this got clicked :3");
                this.channel.infinite.focus(this.message_reference.message_id);
            };
            div.appendChild(replyline);
        }
        build.classList.add("message");
        div.appendChild(build);
        if ({ 0: true, 19: true }[this.type] || this.attachments.length !== 0) {
            const pfpRow = document.createElement('div');
            pfpRow.classList.add("flexltr");
            let pfpparent, current;
            if (premessage != null) {
                pfpparent ??= premessage;
                let pfpparent2 = pfpparent.all;
                pfpparent2 ??= pfpparent;
                const old = (new Date(pfpparent2.timestamp).getTime()) / 1000;
                const newt = (new Date(this.timestamp).getTime()) / 1000;
                current = (newt - old) > 600;
            }
            const combine = (premessage?.author?.snowflake != this.author.snowflake) || (current) || this.message_reference;
            if (combine) {
                const pfp = this.author.buildpfp();
                this.author.bind(pfp, this.guild, false);
                pfpRow.appendChild(pfp);
            }
            else {
                div["pfpparent"] = pfpparent;
            }
            pfpRow.classList.add("pfprow");
            build.appendChild(pfpRow);
            const text = document.createElement("div");
            text.classList.add("flexttb");
            const texttxt = document.createElement("div");
            texttxt.classList.add("commentrow", "flexttb");
            text.appendChild(texttxt);
            if (combine) {
                const username = document.createElement("span");
                username.classList.add("username");
                this.author.bind(username, this.guild);
                div.classList.add("topMessage");
                username.textContent = this.author.username;
                const userwrap = document.createElement("div");
                userwrap.classList.add("flexltr");
                userwrap.appendChild(username);
                if (this.author.bot) {
                    const username = document.createElement("span");
                    username.classList.add("bot");
                    username.textContent = "BOT";
                    userwrap.appendChild(username);
                }
                const time = document.createElement("span");
                time.textContent = "  " + formatTime(new Date(this.timestamp));
                time.classList.add("timestamp");
                userwrap.appendChild(time);
                texttxt.appendChild(userwrap);
            }
            else {
                div.classList.remove("topMessage");
            }
            const messaged = this.content.makeHTML();
            div["txt"] = messaged;
            const messagedwrap = document.createElement("div");
            messagedwrap.classList.add("flexttb");
            messagedwrap.appendChild(messaged);
            texttxt.appendChild(messagedwrap);
            build.appendChild(text);
            if (this.attachments.length) {
                console.log(this.attachments);
                const attach = document.createElement("div");
                attach.classList.add("flexltr");
                for (const thing of this.attachments) {
                    attach.appendChild(thing.getHTML());
                }
                messagedwrap.appendChild(attach);
            }
            if (this.embeds.length) {
                console.log(this.embeds);
                const embeds = document.createElement("div");
                embeds.classList.add("flexltr");
                for (const thing of this.embeds) {
                    embeds.appendChild(thing.generateHTML());
                }
                messagedwrap.appendChild(embeds);
            }
            //
        }
        else if (this.type === 7) {
            const text = document.createElement("div");
            text.classList.add("flexttb");
            const texttxt = document.createElement("div");
            text.appendChild(texttxt);
            build.appendChild(text);
            texttxt.classList.add("flexltr");
            const messaged = document.createElement("span");
            div["txt"] = messaged;
            messaged.textContent = "welcome: ";
            texttxt.appendChild(messaged);
            const username = document.createElement("span");
            username.textContent = this.author.username;
            //this.author.profileclick(username);
            this.author.bind(username, this.guild);
            texttxt.appendChild(username);
            username.classList.add("username");
            const time = document.createElement("span");
            time.textContent = "  " + formatTime(new Date(this.timestamp));
            time.classList.add("timestamp");
            texttxt.append(time);
            div.classList.add("topMessage");
        }
        div["all"] = this;
        const reactions = document.createElement("div");
        reactions.classList.add("flexltr", "reactiondiv");
        this.reactdiv = new WeakRef(reactions);
        this.updateReactions();
        div.append(reactions);
        return (div);
    }
    updateReactions() {
        const reactdiv = this.reactdiv.deref();
        if (!reactdiv)
            return;
        const func = this.channel.infinite.snapBottom();
        reactdiv.innerHTML = "";
        for (const thing of this.reactions) {
            console.log(thing, ":3");
            const reaction = document.createElement("div");
            reaction.classList.add("reaction");
            if (thing.me) {
                reaction.classList.add("meReacted");
            }
            let emoji;
            if (thing.emoji.id || /\d{17,21}/.test(thing.emoji.name)) {
                if (/\d{17,21}/.test(thing.emoji.name))
                    thing.emoji.id = thing.emoji.name; //Should stop being a thing once the server fixes this bug
                const emo = new Emoji(thing.emoji, this.guild);
                emoji = emo.getHTML(false);
            }
            else {
                emoji = document.createElement("p");
                emoji.textContent = thing.emoji.name;
            }
            const count = document.createElement("p");
            count.textContent = "" + thing.count;
            count.classList.add("reactionCount");
            reaction.append(count);
            reaction.append(emoji);
            reactdiv.append(reaction);
            reaction.onclick = _ => {
                this.reactionToggle(thing.emoji.name);
            };
        }
        func();
    }
    giveReaction(data, member) {
        for (const thing of this.reactions) {
            if (thing.emoji.name === data.name) {
                thing.count++;
                if (member.id === this.localuser.user.id) {
                    thing.me = true;
                    this.updateReactions();
                    return;
                }
            }
        }
        this.reactions.push({
            count: 1,
            emoji: data,
            me: member.id === this.localuser.user.id
        });
        this.updateReactions();
    }
    takeReaction(data, id) {
        console.log("test");
        for (const i in this.reactions) {
            const thing = this.reactions[i];
            console.log(thing, data);
            if (thing.emoji.name === data.name) {
                thing.count--;
                if (thing.count === 0) {
                    this.reactions.splice(+i, 1);
                    this.updateReactions();
                    return;
                }
                if (id === this.localuser.user.id) {
                    thing.me = false;
                    this.updateReactions();
                    return;
                }
            }
        }
    }
    buildhtml(premessage = undefined) {
        if (this.div) {
            console.error(`HTML for ${this.snowflake} already exists, aborting`);
            return;
        }
        try {
            const div = document.createElement("div");
            this.div = div;
            this.messageevents(div);
            return this.generateMessage(premessage);
        }
        catch (e) {
            console.error(e);
        }
    }
}
function formatTime(date) {
    const now = new Date();
    const sameDay = date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();
    const formatTime = date => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (sameDay) {
        return `Today at ${formatTime(date)}`;
    }
    else if (isYesterday) {
        return `Yesterday at ${formatTime(date)}`;
    }
    else {
        return `${date.toLocaleDateString()} at ${formatTime(date)}`;
    }
}
Message.setup();
export { Message };

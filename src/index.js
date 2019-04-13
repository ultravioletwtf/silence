const notifier = require("mail-notifier");
const config = require("../config.json");
const sg = require("@sendgrid/mail");
const fs = require("fs");

const PRIVACY = "https://example.org/legal/your-privacy-policy";
const GLSEN = "https://www.glsen.org/day-silence";

const REPLY_FOOTER = 
    "(Beep, boop! This message was delivered to you by the mail robot.) " +
    "Learn more about the GLSEN Day of Silence: "

const emailText = (name, address, subject, messageId, medium = `Email (${config.imap.user})`) => {
    return [
        "Beep, boop! Mail robot here.",
        "",
        `Sender: ${name} (${address})`,
        `Subject: ${subject}`,
        `Sent through: ${medium}`,
        `Message ID: ${messageId}`,
        "",
        "-------------------------------",
        "",
        ""
    ];
}

// Global CatLoggr
new (require("cat-loggr"))().setGlobal();

const mails = require("../mails.json");

const emails = ["johndoe@gmail.com", "john@mycorp.com"];

let updatingMailFile = false;

sg.setApiKey(config.sendgrid);
notifier(config.imap).on("mail", processMail).start();

console.init(
    "starting silence on " +
    config.imap.user +
    " (listening for emails: " +
    emails.join(", ") +
    ")"
);

function updateMailFile() {
    console.info("updating mail file");
    if (updatingMailFile) {
        // Try again in a second
        setInterval(updateMailFile, 1000);
        console.warn("mail file busy, retrying in 1 second");
    }
    else {
        updatingMailFile = true;
        fs.writeFile("mails.json", JSON.stringify(mails), err => {
            if (err) console.error("error updating mail file: " + err);
            else {
                console.info("successfully updated mail file");
                updatingMailFile = false;
            }
        });
    }
}

function logMail(id, type, address, name, original = null) {
    mails[id] = { type, address, name, original };
    updateMailFile();
}

function sendNotification(name, address, mail, email) {
    const { subject } = mail;

    const prefix = emailText(name, address, subject, mail.messageId);
    
    const text = prefix.join("\n") + mail.text;
    const html = prefix.join("<br>") + mail.html;

    sg.send({
        to: email,
        from: `${name} (${address}) <${config.imap.user}>`,
        bcc: config.imap.user,
        html,
        text,
        subject
    });
}

function processMail(mail) {

    const { from, inReplyTo } = mail;

    let type = "incoming";
    let { address, name } = from[0];

    console.info(`recieved mail from: ${address}`);

    let original = null;

    // BCC'd in a notification in order to get the id
    if (address === config.imap.user) {
        console.info(`mail is a notification! logging as such`)
        type = "notification";
        // Really hacky way bc I'm too lazy to do RegEx
        original = mail.text.split("Message ID: ")[1].split("\n")[0];
    }

    else if (emails.includes(address)) {
        console.info("sending reply");

        const originalId = mails[inReplyTo[inReplyTo.length - 1]].original;
        const originalMail = mails[originalId];

        type = "reply";
        address = originalMail.address;
        name = originalMail.name;

        sg.send({
            to: `${name} <${address}>`,
            from: `Day of Silence Contact <${config.imap.user}>`,
            text: mail.text + "\n\n" + REPLY_FOOTER + GLSEN,
            html: 
                mail.html + 
                "<br><br>" + 
                REPLY_FOOTER + 
                `<a href="${GLSEN}">${GLSEN}</a>`,
            subject: mail.subject
        });
    }

    if (type === "incoming") {
        console.info("mail robot dispatched");

        const content = [
            "-- Do not reply to this email. --",
            "",
            "Beep, boop! Hello. I am the mail robot. I was programmed " +
            "in one night to help with the GLSEN Day of Silence. I was " +
            `told to tell you that your mail (${mail.subject}) went ` +
            "through! A reply will be sent as soon as possible. I also have " +
            "to tell you some privacy stuff.",
            "",
            `By emailing ${config.imap.user}, you agree and consent to the ` +
            "Silence Privacy Policy, readable here: "
        ];

        sg.send({
            to: `${name} <${address}>`,
            from: `Mail Robot <${config.imap.user}>`,
            text: content.join("\n") + PRIVACY,
            html: content.join("<br>") + `<a href="${PRIVACY}">${PRIVACY}</a>`,
            subject: "Day of Silence Message Sent Successfully"
        });

        for (const email of emails) sendNotification(name, address, mail, email);
    }

    logMail(mail.messageId, type, address, name, original);
}

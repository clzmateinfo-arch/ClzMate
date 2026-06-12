const nodemailer = require("nodemailer");

const buildTransportOptions = () => {
    const {
        MAIL_SERVICE,
        MAIL_HOST,
        MAIL_PORT,
        MAIL_SECURE,
        MAIL_USER,
        MAIL_PASS,
    } = process.env;

    if (MAIL_SERVICE && MAIL_SERVICE.toLowerCase() === "gmail") {
        return {
            service: "gmail",
            auth: {
                user: MAIL_USER,
                pass: MAIL_PASS,
            },
        };
    }

    return {
        host: MAIL_HOST || "smtp.gmail.com",
        port: Number(MAIL_PORT) || 587,
        secure: String(MAIL_SECURE || "false").toLowerCase() === "true",
        auth: {
            user: MAIL_USER,
            pass: MAIL_PASS,
        },
        tls: {
            rejectUnauthorized: process.env.MAIL_TLS_REJECT_UNAUTHORIZED !== "false",
        },
    };
};

const getFromAddress = () => {
    const name = process.env.MAIL_FROM_NAME || "Up Dev Team";
    const email = process.env.MAIL_FROM_EMAIL || process.env.MAIL_USER || `no-reply@${process.env.APP_DOMAIN || "example.com"}`;
    return `"${name}" <${email}>`;
};

const mailSender = async (email, title, bodyHtml) => {
    try {
        const transportOptions = buildTransportOptions();
        const transporter = nodemailer.createTransport(transportOptions);

        await transporter.verify();

        const info = await transporter.sendMail({
            from: getFromAddress(),
            to: email,
            subject: title,
            html: bodyHtml,
            text: bodyHtml ? bodyHtml.replace(/<[^>]*>/g, "") : undefined,
        });

        return info;
    } catch (error) {
        console.error("Error while sending mail (mailSender) -", error?.message || error, { to: email });
        return null;
    }
};

module.exports = mailSender;

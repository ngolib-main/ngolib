const nodemailer = require('nodemailer');

/**
 * Send a contact email using the same Gmail configuration as other parts of the app
 * @param {Object} req - Express request object containing to, subject, and message
 * @param {Object} res - Express response object
 */

const sendEmail = async (to, subject, htmlContent) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "ngolibmain@gmail.com",
                pass: "eckx berq ndsz qwpe"
            }
        });

        const result = await transporter.sendMail({
            from: "ngolibmain@gmail.com",
            to: to,
            subject: subject,
            html: htmlContent
        });

        return {success: true, messageId: result.messageId};
    } catch (error) {
        console.error("Email sending error:", error);
        return {success: false, error: error.message};
    }
};


const sendContactEmail = async (req, res) => {
    const {to, subject, message} = req.body;

    // Validate required fields
    if (!to) {
        return res.status(400).json({message: "Recipient email is required"});
    }

    if (!message) {
        return res.status(400).json({message: "Email message is required"});
    }

    try {
        // Create transporter with the same configuration as in your forgot password function
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "ngolibmain@gmail.com",
                pass: "eckx berq ndsz qwpe"
            }
        });

        // Send the email using the same pattern as your existing code
        await transporter.sendMail({
            from: "ngolibmain@gmail.com",
            to: "ngolibmain@gmail.com",
            subject: subject || "Contact Message", // Default subject if not provided
            html: `<p>${message} to ${to}</p>`
        });

        res.status(200).json({message: "Email sent successfully"});
    } catch (err) {
        console.error(err);
        res.status(500).json({message: "Server error"});
    }
};

module.exports = {
    sendEmail,
    sendContactEmail
};
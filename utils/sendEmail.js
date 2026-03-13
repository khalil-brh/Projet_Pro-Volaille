const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendVerificationEmail(to, userName) {
    const mailOptions = {
        from: `"Pro-Volaille" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Bienvenue chez Pro-Volaille - Compte en attente de validation",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FFF8F0; border-radius: 12px; overflow: hidden;">
                <div style="background: #1E1210; padding: 30px; text-align: center;">
                    <h1 style="color: #FDBA4A; font-size: 24px; margin: 0;">Pro-Volaille</h1>
                    <p style="color: #C4A090; font-size: 12px; letter-spacing: 2px; margin: 5px 0 0;">DISTRIBUTION</p>
                </div>
                <div style="padding: 30px;">
                    <h2 style="color: #1E1210; font-size: 20px;">Bonjour ${userName},</h2>
                    <p style="color: #4A3A30; line-height: 1.8; font-size: 15px;">
                        Merci pour votre inscription sur <strong>Pro-Volaille</strong> !
                    </p>
                    <p style="color: #4A3A30; line-height: 1.8; font-size: 15px;">
                        Votre compte a bien été créé. Un administrateur va examiner vos documents
                        et valider votre compte dans les plus brefs délais.
                    </p>
                    <div style="background: #FDBA4A22; border-left: 4px solid #FDBA4A; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0;">
                        <p style="color: #1E1210; margin: 0; font-size: 14px;">
                            <strong>En attente de validation</strong><br/>
                            Vous recevrez une notification dès que votre compte sera approuvé.
                            Vous pourrez alors accéder aux tarifs professionnels.
                        </p>
                    </div>
                    <p style="color: #7A6A60; font-size: 13px; margin-top: 30px;">
                        Cordialement,<br/>
                        L'équipe Pro-Volaille
                    </p>
                </div>
                <div style="background: #1E1210; padding: 15px; text-align: center;">
                    <p style="color: #7A6A60; font-size: 11px; margin: 0;">
                        © 2026 STE Pro-Volaille. Tous droits réservés. · Menzeh 7 Bis, Salma City 2091, Ariana
                    </p>
                </div>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
}

async function sendApprovalEmail(to, userName) {
    const mailOptions = {
        from: `"Pro-Volaille" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Pro-Volaille - Votre compte a été approuvé !",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FFF8F0; border-radius: 12px; overflow: hidden;">
                <div style="background: #1E1210; padding: 30px; text-align: center;">
                    <h1 style="color: #FDBA4A; font-size: 24px; margin: 0;">Pro-Volaille</h1>
                    <p style="color: #C4A090; font-size: 12px; letter-spacing: 2px; margin: 5px 0 0;">DISTRIBUTION</p>
                </div>
                <div style="padding: 30px;">
                    <h2 style="color: #1E1210; font-size: 20px;">Félicitations ${userName} !</h2>
                    <p style="color: #4A3A30; line-height: 1.8; font-size: 15px;">
                        Votre compte <strong>Pro-Volaille</strong> a été approuvé par notre équipe.
                    </p>
                    <div style="background: #22C55E22; border-left: 4px solid #22C55E; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0;">
                        <p style="color: #1E1210; margin: 0; font-size: 14px;">
                            <strong>Compte validé</strong><br/>
                            Vous pouvez maintenant vous connecter et accéder à l'ensemble
                            de nos produits avec les tarifs professionnels.
                        </p>
                    </div>
                    <div style="text-align: center; margin: 25px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login"
                           style="background: #FDBA4A; color: #1E1210; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">
                            Se connecter
                        </a>
                    </div>
                    <p style="color: #7A6A60; font-size: 13px; margin-top: 30px;">
                        Cordialement,<br/>
                        L'équipe Pro-Volaille
                    </p>
                </div>
                <div style="background: #1E1210; padding: 15px; text-align: center;">
                    <p style="color: #7A6A60; font-size: 11px; margin: 0;">
                        © 2026 STE Pro-Volaille. Tous droits réservés. · Menzeh 7 Bis, Salma City 2091, Ariana
                    </p>
                </div>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
}

module.exports = { sendVerificationEmail, sendApprovalEmail };

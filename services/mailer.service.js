'use strict';

const { randomUUID } = require('crypto');
const handlebars = require('handlebars');
const inviteToGroup = require('../templates/inviteToGroup.template');
const welcomeTemplate = require('../templates/welcome.template');
const client = require('../configs/redis.config');
const { NodemailerConfig } = require('../configs');

const EXPIRED_TIME = 900;

class MailerService {
    async sendActivationEmail(user) {
        const activationToken = `${randomUUID()}${randomUUID()}`.replace(
            /-/g,
            ''
        );

        await client.set(
            `emailActivationToken-${activationToken}`,
            user.id,
            'EX',
            EXPIRED_TIME
        );

        const template = handlebars.compile(welcomeTemplate);
        const htmlToSend = template({
            email: user.email,
            siteConfigName: process.env.FRONTEND_SITE_NAME,
            activeLink: `${process.env.BACKEND_URL}/auth/activate/${activationToken}?active=EMAIL_VERIFY`,
        });

        const mailOptions = {
            from: process.env.EMAIL_NAME,
            to: user.email,
            subject: `Activate your account ${process.env.FRONTEND_SITE_NAME}`,
            text: `Welcome ${user.email} to ${process.env.FRONTEND_SITE_NAME}. Link to active your account: ${process.env.BACKEND_URL}/auth/activate/${activationToken}?active=EMAIL_VERIFY`,
            html: htmlToSend,
        };

        await NodemailerConfig.transporter.sendMail(mailOptions);

        return mailOptions;
    }
    async sendInviteToGroupEmail(user, group, inviteToken) {
        const template = handlebars.compile(inviteToGroup);
        const htmlToSend = template({
            username: user.username,
            group: group.title,
            groupImg: group.groupImg,
            siteConfigName: process.env.FRONTEND_SITE_NAME,
            joinLink: `${process.env.FRONTEND_URL}/group/${group.id}/invite?inviteToken=${inviteToken}`,
        });

        const mailOptions = {
            from: process.env.EMAIL_NAME,
            to: user.email,
            subject: `You have been invited to join ${group.title}`,
            text: `Welcome ${user.username} to ${group.title}. Link to join group: ${process.env.FRONTEND_URL}/group/${group.id}/invite?inviteToken=${inviteToken}`,
            html: htmlToSend,
        };

        await NodemailerConfig.transporter.sendMail(mailOptions);

        return mailOptions;
    }
}

module.exports = new MailerService();

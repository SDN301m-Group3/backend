'use strict';

const { randomUUID } = require('crypto');
const handlebars = require('handlebars');
const inviteToGroup = require('../templates/inviteToGroup.template');
const welcomeTemplate = require('../templates/welcome.template');
const ownerRemovedGroup = require('../templates/ownerRemovedGroup.template');
const removeUserFromGroup = require('../templates/removeUserFromGroup.template');
const userUploadNewPhoto = require('../templates/userUploadNewPhoto.template');
const client = require('../configs/redis.config');
const { NodemailerConfig } = require('../configs');
const likePhoto = require('../templates/likePhoto.template');
const inviteToAlbum = require('../templates/inviteToAlbum.template');
const userGroupUpdateTemplate = require('../templates/userGroupUpdateTemplate');
const reactPhoto = require('../templates/reactPhoto.template');

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
            activeLink: `${process.env.FRONTEND_URL}/active/${activationToken}?active=EMAIL_VERIFY`,
        });

        const mailOptions = {
            from: process.env.EMAIL_NAME,
            to: user.email,
            subject: `Activate your account ${process.env.FRONTEND_SITE_NAME}`,
            text: `Welcome ${user.email} to ${process.env.FRONTEND_SITE_NAME}. Link to active your account: ${process.env.FRONTEND_URL}/active/${activationToken}?active=EMAIL_VERIFY`,
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
    async sendOwnerRemovedGroupEmail(user, group) {
        const template = handlebars.compile(ownerRemovedGroup);
        const htmlToSend = template({
            username: user.username,
            group: group.title,
            groupImg: group.groupImg,
            siteConfigName: process.env.FRONTEND_SITE_NAME,
        });

        const mailOptions = {
            from: process.env.EMAIL_NAME,
            to: user.email,
            subject: `Important Notice: Group Deleted`,
            text: `Dear ${user.username}, We regret to inform you that the group, ${group.title}, has been deleted by the owner. We understand that this may come as unexpected news. If you have any questions or need further assistance, please do not hesitate to contact our support team. Thank you for your understanding.`,
            html: htmlToSend,
        };

        await NodemailerConfig.transporter.sendMail(mailOptions);

        return mailOptions;
    }
    async sendUserUploadPhotoEmail(user, uploadUser, photo, album) {
        const template = handlebars.compile(userUploadNewPhoto);
        const htmlToSend = template({
            username: user.username,
            uploadUsername: uploadUser.username,
            photoUrl: photo.url,
            albumTitle: album.title,
            redirectUrl: `${process.env.FRONTEND_URL}/photo/${photo._id}`,
            siteConfigName: process.env.FRONTEND_SITE_NAME,
        });

        const mailOptions = {
            from: process.env.EMAIL_NAME,
            to: user.email,
            subject: `Photo Uploaded`,
            text: `Dear ${user.username}, We are excited to inform you that ${uploadUser.username} has uploaded a new photo to the album, ${album.title}. Click the link to view the new photo: ${process.env.FRONTEND_URL}/photo/${photo._id}`,
            html: htmlToSend,
        };

        await NodemailerConfig.transporter.sendMail(mailOptions);

        return mailOptions;
    }
    async sendRemoveUserFromGroupEmail(user, group) {
        const template = handlebars.compile(removeUserFromGroup);
        const htmlToSend = template({
            username: user.username,
            group: group.title,
            groupImg: group.groupImg,
            siteConfigName: process.env.FRONTEND_SITE_NAME,
        });

        const mailOptions = {
            from: process.env.EMAIL_NAME,
            to: user.email,
            subject: `Group Membership Update`,
            text: `Dear ${user.username}, We regret to inform you that you have been removed from the group, ${group.title}, by the group owner. If you have any questions or need further information regarding this decision, please feel free to reach out to our support team. Thank you for your understanding.`,
            html: htmlToSend,
        };

        await NodemailerConfig.transporter.sendMail(mailOptions);

        return mailOptions;
    }
    async sendUserLikePhotoEmail(user, photo, comment) {
        const template = handlebars.compile(likePhoto);
        const htmlToSend = template({
            ownerUsername: photo?.owner?.username,
            photoUrl: photo?.url,
            commentUsername: user?.username,
            content: comment?.content,
            redirectUrl: `${process.env.FRONTEND_URL}/photo/${photo?._id}`,
            siteConfigName: process.env.FRONTEND_SITE_NAME,
        });

        const mailOptions = {
            from: process.env.EMAIL_NAME,
            to: photo.owner.email,
            subject: `${user.username} commented on your photo`,
            text: `${user.username} commented on your photo. Click the link to view the comment: ${process.env.FRONTEND_URL}/photo/${photo.id}`,
            html: htmlToSend,
        };

        await NodemailerConfig.transporter.sendMail(mailOptions);

        return mailOptions;
    }

    async sendUserReactPhotoEmail(user, photo, noti) {
        const template = handlebars.compile(reactPhoto);
        const htmlToSend = template({
            ownerUsername: photo?.owner?.username,
            photoUrl: photo?.url,
            content: noti?.content,
            redirectUrl: `${process.env.FRONTEND_URL}/photo/${photo?._id}`,
            siteConfigName: process.env.FRONTEND_SITE_NAME,
        });

        const mailOptions = {
            from: process.env.EMAIL_NAME,
            to: photo.owner.email,
            subject: `${user.username} react on your photo`,
            text: `${user.username} react on your photo. Click the link to view the reaction: ${process.env.FRONTEND_URL}/photo/${photo.id}`,
            html: htmlToSend,
        };

        await NodemailerConfig.transporter.sendMail(mailOptions);

        return mailOptions;
    }

    async sendInviteToAlbumEmail(user, album, inviteToken) {
        const template = handlebars.compile(inviteToAlbum);
        const htmlToSend = template({
            username: user.username,
            album: album.title,
            albumImg: album.photos.length !== 0 ? album.photos[0].url : '',
            siteConfigName: process.env.FRONTEND_SITE_NAME,
            joinLink: `${process.env.FRONTEND_URL}/album/${album._id}/invite?inviteToken=${inviteToken}`,
        });

        const mailOptions = {
            from: process.env.EMAIL_NAME,
            to: user.email,
            subject: `You have been invited to join ${album.title}`,
            text: `Welcome ${user.username} to ${album.title}. Link to join group: ${process.env.FRONTEND_URL}/album/${album._id}/invite?inviteToken=${inviteToken}`,
            html: htmlToSend,
        };

        await NodemailerConfig.transporter.sendMail(mailOptions);
    }

    async sendUserGroupUpdateMail(user, group) {
        const template = handlebars.compile(userGroupUpdateTemplate);
        const htmlToSend = template({
            username: user.username,
            groupTitle: group.title,
            groupImg: group.groupImg,
            redirectUrl: `${process.env.FRONTEND_URL}/group/${group?._id}`,
            siteConfigName: process.env.FRONTEND_SITE_NAME
        });
    
        const mailOptions = {
            from: process.env.EMAIL_NAME,
            to: user.email,
            subject: `Group Information Update`,
            text: `Dear ${user.username}, ${group.title} group has updated group owner`,
            html: htmlToSend,
        };
    
        await NodemailerConfig.transporter.sendMail(mailOptions);
    
        return mailOptions;
    }
}

module.exports = new MailerService();

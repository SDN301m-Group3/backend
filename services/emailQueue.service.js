const Queue = require('bull');
const MailerService = require('./mailer.service');
const client = require('../configs/redis.config');

const emailQueueService = new Queue('emailQueue', {
    redis: {
        port: client.options.port,
        host: client.options.host,
        password: client.options.password,
    },
});

emailQueueService.process(async (job, done) => {
    const { type, data } = job.data;

    try {
        switch (type) {
            case 'inviteToAlbum':
                await MailerService.sendInviteToAlbumEmail(
                    data.user,
                    data.album,
                    data.inviteToken
                );
                break;
            case 'activation':
                await MailerService.sendActivationEmail(data.user);
                break;
            case 'ownerRemovedGroup':
                await MailerService.sendOwnerRemovedGroupEmail(
                    data.user,
                    data.group
                );
                break;
            case 'inviteToGroup':
                await MailerService.sendInviteToGroupEmail(
                    data.user,
                    data.group,
                    data.inviteToken
                );
                break;
            case 'removeUserFromGroup':
                await MailerService.sendRemoveUserFromGroupEmail(
                    data.user,
                    data.group
                );
                break;
            case 'userLikePhoto':
                await MailerService.sendUserLikePhotoEmail(
                    data.user,
                    data.photo,
                    data.comment
                );
                break;
            case 'userReactPhoto':
                await MailerService.sendUserReactPhotoEmail(
                    data.user,
                    data.photo,
                    data.noti
                );
                break;
            case 'userAlbumUpdate':
                await MailerService.sendUserAlbumUpdateEmail(
                    data.user,
                    data.owner,
                    data.album
                );
                break;
            default:
                throw new Error(`Unknown email type: ${type}`);
        }
        done();
    } catch (error) {
        done(error);
    }
});

module.exports = emailQueueService;

/* eslint-disable import/no-unresolved */
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { User } from 'meteor/socialize:user-model';
import { publishComposite } from 'meteor/reywood:publish-composite';
import { BlocksCollection } from '../common/common';

const optionsArgumentCheck = {
    limit: Match.Optional(Number),
    skip: Match.Optional(Number),
    sort: Match.Optional(Object),
};

publishComposite('socialize.blockedUsers', function publishBlockedUsers(options = { limit: 10, sort: { createdAt: -1 } }) {
    check(options, optionsArgumentCheck);
    if (!this.userId) {
        return this.ready();
    }

    const currentUser = User.createEmpty(this.userId);

    return {
        find() {
            return currentUser.blocks(options);
        },
        children: [
            {
                find(block) {
                    return Meteor.users.find({ _id: block.blockedUserId }, { fields: User.fieldsToPublish });
                },
            },
        ],
    };
});

/**
 * Publication to check if the current user is blocking the given user.
 * @param lookupUserId {String}
 */
publishComposite('socialize.blocksUserById', function publishBlockedUsers(lookupUserId) {
    check(lookupUserId, String);
    if (!this.userId) {
        return this.ready();
    }
    const currentUserId = this.userId;

    return {
        find() {
            return BlocksCollection.find({ userId: currentUserId, blockedUserId: lookupUserId }, { limit: 1 });
        },
        children: [
            {
                find(block) {
                    return Meteor.users.find({ _id: block.blockedUserId }, { fields: User.fieldsToPublish });
                }
            }
        ]
    };
});

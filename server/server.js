/* eslint-disable import/no-unresolved */
import { User } from 'meteor/socialize:user-model';
import { Meteor } from 'meteor/meteor';
/* eslint-enabled import/no-unresolved */

import { Block, BlocksCollection } from '../common/common.js';
import './publications.js';

try {
    BlocksCollection.createIndexAsync({ userId: 1 });
    BlocksCollection.createIndexAsync({ blockedUserId: 1 });
    BlocksCollection.createIndexAsync({ userId: 1, blockedUserId: 1 });
    BlocksCollection.createIndexAsync({ createdAt: -1 });
} catch(e) {
    console.debug('Failed to create indexes for user blocking collection.');
}

// array to store functions that run when a user gets blocked
const onHooks = [];

/**
 * Register a function to run when a user is blocked
 * @param {Function} onHook A function which runs after a user has been blocked
 */
User.onBlocked = function onBlocked(onHook) {
    if (typeof onHook === 'function') {
        // add the hook to the onHooks array
        onHooks.push(onHook);
    }
};

BlocksCollection.allow({
    insert(userId, block) {
        if (block.checkOwnership()) {
            if (!block.isDuplicate()) {
                return true;
            }
            throw new Meteor.Error('ExistingBlock', 'This user is already blocked by the current user');
        }
        return false;
    },
    remove(userId, block) {
        return block.checkOwnership();
    },
});

BlocksCollection.after.insert(function afterInsert(userId, document) {
    onHooks.forEach((hook) => {
        hook(userId, document.blockedUserId);
    });
});

export { Block, BlocksCollection };

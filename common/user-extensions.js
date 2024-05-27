export default ({ Meteor, User, Block, BlocksCollection }) => {
    // Array to store additional blocking check functions
    const blockHooks = [];

    /**
     * Register a new function that if returns true signifies that a user is blocked
     * @param {Function} hook A function which returns true if the user should be considered blocked
     */
    User.registerBlockingHook = function registerBlockingHook(hook) {
        if (typeof hook === 'function') {
            // add the hook to the blockHooks array
            blockHooks.push(hook);
        }
    };

    User.methods({
        /**
         * Check if the user blocks another by running checks which
         * have been registered with User.registerBlockingHook()
         * @param   {Object}  [user=Meteor.user()] The user instance to check
         * @returns {Boolean} Whether or not the user is blocked
         */
        blocksUser(user = Meteor.user()) {
            if (Meteor.isServer) {
                return this.blocksUserAsync(user._id);
            }
            const self = this;
            let blocked = false;

            if (!this.isSelf(user) && !this.isFriendsWith(user._id)) {
                blocked = blockHooks.some(hook => hook.call(self, user));
            }
            return blocked;
        },
        async blocksUserAsync(user) {
            let blocked = false;
            if (!user) {
              user = await Meteor.user();
            }
            const isFriends = await this.isFriendsWith(user._id);
            if (!this.isSelf(user) && !isFriends) {
              blocked = blockHooks.some((hook) => hook.call(this, user));
            }
            return blocked;
          },

        /**
         * Check if user blocks another by their _id
         * @param   {Object}  user The User instance to check against
         * @returns {Boolean} Whether the user is blocked or not
         */
        blocksUserById(userId) {
            if (Meteor.isServer) {
                return this.blocksUserByIdAsync(userId);
            }
            return !!BlocksCollection.findOne({ userId: this._id, blockedUserId: userId });
        },
        async blocksUserByIdAsync(userId) {
            const exists = await BlocksCollection.findOneAsync({ userId: this._id, blockedUserId: userId });
            return !!exists
        },

        /**
         * Block a user by their _id
         */
        block() {
            if (Meteor.isServer) {
                new Block({ blockedUserId: this._id }).saveAsync();
            } else {
                new Block({ blockedUserId: this._id }).save();
            }
        },

        /**
         * Unblock a user that was previously blocked by their _id
         */
        unblock() {
            if (Meteor.isServer) {
                return this.unblockAsync();
            }
            // find then remove because you must remove records by _id on client
            const block = BlocksCollection.findOne({ userId: Meteor.userId(), blockedUserId: this._id });
            block && block.remove();
        },
        async unblockAsync() {
            // find then remove because you must remove records by _id on client
            const block = await BlocksCollection.findOneAsync({ userId: Meteor.userId(), blockedUserId: this._id });
            block && block.remove();
        },

        /**
         * Get a cursor of Block instances for users that this user blocks
         * @param  {Object} [options={}] Mongo style options object which is passed to Collection.find()
         * @returns {Mongo.Cursor} A cursor which when iterated over returns Block instances
         */
        blocks(options = {}) {
            return BlocksCollection.find({ blockedUserId: this._id }, options);
        },

        /**
         * Get a cursor of Block instances for other users that block this user.
         * @param  {Object} [options={}] Mongo style options object which is passed to Collection.find()
         * @returns {Mongo.Cursor} A cursor which when iterated over returns Block instances
         */
        blockedBys(options = {}) {
            return BlocksCollection.find({ userId: this._id }, options);
        },

        /**
         * Get a list of userIds who are blocking the user
         * @param  {Object} [options={}] Mongo style options object which is passed to Collection.find()
         * @returns {Array} Array of userIds for users that block this user
         */
        blockedByUserIds(options = {}) {
            if (Meteor.isServer) {
                return this.blockedByUserIdsAsync(options);
            }
            return this.blockedBys(options).map(block => block.userId);
        },

        async blockedByUserIdsAsync(options = {}) {
            return this.blockedBys(options).mapAsync((block) => block.userId)
        },

        /**
         * Get a cursor of User instances who are blocking the user
         * @param  {Object} [options={}] Mongo style options object which is passed to Collection.find()
         * @returns {Mongo.Cursor} A cursor which when iterated over returns User instances
         */
        blockedByUsers(options = {}) {
            if (Meteor.isServer) {
                return this.blockedByUsersAsync(options)
            }
            const ids = this.blockedByUserIds(options);
            return Meteor.users.find({ _id: { $in: ids } });
        },
        async blockedByUsersAsync(options = {}) {
            const ids = await this.blockedByUserIdsAsync(options);
            return Meteor.users.find({ _id: { $in: ids } });
        },

        /**
         * Get a list of userIds that the user blocks
         * @param  {Object} [options={}] Mongo style options object which is passed to Collection.find()
         * @returns {Array} Array of userIds for users that this user blocks
         */
        blockedUserIds(options = {}) {
            if (Meteor.isServer) {
                return this.blockedUserIdsAsync(options);
            }
            return this.blocks(options).map(block => block.blockedUserId);
        },
        async blockedUserIdsAsync(options = {}) {
            return this.blocks(options).mapAsync(block => block.blockedUserId);
        },

        /**
         * Get a cursor of User instances that the user is blocking
         * @param  {Object} [options={}] Mongo style options object which is passed to Collection.find()
         * @returns {Mongo.Cursor} A cursor which when iterated over returns User instances
         */
        blockedUsers(options = {}) {
            if (Meteor.isServer) {
                return this.blockedUsersAsync(options);
            }
            const ids = this.blockedUserIds(options);
            return Meteor.users.find({ _id: { $in: ids } });
        },
        async blockedUsersAsync(options = {}) {
            const ids = await this.blockedUserIdsAsync(options);
            return Meteor.users.find({ _id: { $in: ids } });
        },

    });

    // Register a hook to check if the user block another by _id field
    User.registerBlockingHook(function blocksUserById(userId) {
        if (Meteor.isServer) {
            return this.blocksUserByIdAsync(userId);
        }
        return this.blocksUserById(userId);
    });
};

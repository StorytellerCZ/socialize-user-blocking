/* eslint-disable import/no-unresolved */
import SimpleSchema from 'meteor/aldeed:simple-schema';
/* eslint-enable import/no-unresolved */

export default ({ BaseModel, ServerTime, Mongo }) => {
    const BlocksCollection = new Mongo.Collection('socialize:blocks');

    class Block extends BaseModel {
        async isDuplicate() {
            const block = await BlocksCollection.findOneAsync({ userId: this.userId, blockedUserId: this.blockedUserId });
            return !!block
        }
    }

    Block.attachCollection(BlocksCollection);

    const BlockSchema = new SimpleSchema({
        userId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id,
            autoValue() {
                if (this.isInsert) {
                    return this.userId;
                }
                return undefined;
            },
            denyUpdate: true,
        },
        blockedUserId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id,
            denyUpdate: true,
        },
        createdAt: {
            type: Date,
            autoValue() {
                if (this.isInsert) {
                    return ServerTime.date();
                }
                return undefined;
            },
            denyUpdate: true,
        },
    });

    // Create the schema for a Block
    Block.attachSchema(BlockSchema);

    return { Block, BlocksCollection };
};

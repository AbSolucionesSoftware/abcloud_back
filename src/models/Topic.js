const {Schema, model} = require('mongoose');

const topicSchema = new Schema({
    topicTitle: String,
    preference: Number,
    keyTopicVideo: String,
    newTopic: Boolean,
    preview: Boolean,
    resources: [{
        title: String,
        keyDownloadResource: String,
        urlDownloadResource: String,
        urlExtern: String
    }],
    idBlock: {
        type: Schema.ObjectId,
        ref: 'block'
    }
},{
    timestamps: true,
});

module.exports = model('topic',topicSchema);


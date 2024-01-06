const {Schema, model} = require('mongoose');

const answers = new Schema({
    idQuestion: {
        type: Schema.ObjectId,
        ref: 'question'
    },
    answer: String,
    preference: Number
},{
    timestamps: true,
});

module.exports = model('answer',answers);
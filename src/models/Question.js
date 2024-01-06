const { Schema, model } = require('mongoose');

const questionSchema = new Schema(
    {
        question: String,
        preference: Number
    },{
        timestamps: true,
    }
);


module.exports = model('question',questionSchema);
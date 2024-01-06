const { Schema, model } = require('mongoose');

const responseAnswerUser = new Schema(
    {
        idQuestion: {
            type: Schema.ObjectId,
            ref: 'question'
        },
        idCurso: {
            type: Schema.ObjectId,
            ref: 'course'
        },
        nameCurso: String,
        idUser: {
            type: Schema.ObjectId,
            ref: 'user'
        },
        nameUser: String,
        ageUser: String,
        emailUser: String,
        professionUser: String,
        phoneUser: String,
        textQuestion: String,
        answer: String,
    },{
        timestamps: true,
    }
);


module.exports = model('responseansweruser',responseAnswerUser);
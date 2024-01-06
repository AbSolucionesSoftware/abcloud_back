const { Schema, model } = require("mongoose");

const courseEvaluationSchema = new Schema(
  {
    questionnaire: [
      {
        question: String,
        reply: String,
      },
    ],
    idUser: {
      type: Schema.ObjectId,
      ref: "user",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model('courseEvaluation',courseEvaluationSchema );

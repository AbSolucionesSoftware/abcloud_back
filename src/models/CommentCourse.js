const { Schema, model } = require("mongoose");

const commentCourseSchema = new Schema(
  {
    idUser: {
        type: Schema.ObjectId,
        ref: "user",
    },
    idCourse: {
        type: Schema.ObjectId,
        ref: "course",
    },
    comment: String,
    qualification: Number,
  },
  {
    timestamps: true,
  }
);

module.exports = model('commentCourse',commentCourseSchema );
const { Schema, model } = require("mongoose");

const commentSchema = new Schema(
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
    likes: Number,
    dislikes: Number,
    idTopic: {
      type: Schema.ObjectId,
      ref: "topic",
    },
    answers: [
      {
        comment: String,
        idUser: {
          type: Schema.ObjectId,
          ref: "user",
        },
        likes: Number,
        dislikes: Number,
        createComment: Date,
        editComment: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = model("comment", commentSchema);

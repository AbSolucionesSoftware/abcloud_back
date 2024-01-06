const { Schema, model } = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

const replyCommentSchema = new Schema(
  {
    idUser: {
      type: Schema.ObjectId,
      ref: "user",
    },
    idCourse: {
      type: Schema.ObjectId,
      ref: "course",
    },
    idComment: {
        type: Schema.ObjectId,
        ref: "course",
    },
    answer: String,
  },
  {
    timestamps: true,
  }
);

replyCommentSchema.plugin(mongoosePaginate);

module.exports = model("replyCommentCourse", replyCommentSchema);

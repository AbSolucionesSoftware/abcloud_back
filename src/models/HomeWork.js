const mongoose = require("mongoose");
var Float = require("mongoose-float").loadType(mongoose, 4);
const { Schema, model } = mongoose;

const homeWorkSchema = new Schema(
  {
    idUser: {
        type: Schema.ObjectId,
        ref: "user",
    },
    idCourse: {
        type: Schema.ObjectId,
        ref: "course",
    },
    qualificationHomework: {
      type: Float
    },
    idTopic: {
      type: Schema.ObjectId,
      ref: "topic",
    },
    topicBoolean: Boolean,
    homeworkFileKey: String,
    homeworkFileUrl: String,
    comments: [
        {
            comment: String,
            idUser: {
              type: Schema.ObjectId,
              ref: "user",
            },
            createComment: Date,
            editComment: Date,
        }
    ]
  },
  {
    timestamps: true,
  }
);

module.exports = model("homeworks", homeWorkSchema);
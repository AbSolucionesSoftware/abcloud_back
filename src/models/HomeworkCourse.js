const { Schema, model } = require("mongoose");

const homeworkCourseSchema = new Schema(
  {
    idUser: {
        type: Schema.ObjectId,
        ref: "user",
    },
    idCourse: {
        type: Schema.ObjectId,
        ref: "course",
    },
    description: String,
    comments: [{
        comment: String,
        idUser: {
            type: Schema.ObjectId,
            ref: "user",
        }
    }],
    keyFile: String,
    urlFile: String
  },
  {
    timestamps: true,
  }
);

module.exports = model("homeworkCourse", homeworkCourseSchema);

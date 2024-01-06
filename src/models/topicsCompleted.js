const { Schema, model } = require("mongoose");

const topicsCompletedSchema = new Schema(
  {
    idTopic: {
      type: Schema.ObjectId,
      ref: "topic",
    },
    idUser:{
      type: Schema.ObjectId,
      ref: "user",
    },
    idCourse: {
      type: Schema.ObjectId,
      ref: "course",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model("topicsCompleted", topicsCompletedSchema);

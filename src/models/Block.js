const { Schema, model } = require("mongoose");

const blockSchema = new Schema(
  {
    blockTitle: String,
    idCourse: {
      type: Schema.ObjectId,
      ref: "course",
    },
    preference: Number
  },
  {
    timestamps: true,
  }
);

module.exports = model("block", blockSchema);

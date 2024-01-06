const { Schema, model } = require("mongoose");

const reactionsSchema = new Schema(
  {
    idUser: {
      type: Schema.ObjectId,
      ref: "user",
    },
    idComment: {
        type: Schema.ObjectId,
        ref: "course",
    },
    reaction: String,
  },
  {
    timestamps: true,
  }
);

module.exports = model("reactions", reactionsSchema);

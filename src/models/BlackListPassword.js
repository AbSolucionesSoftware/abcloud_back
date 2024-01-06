const { Schema, model } = require("mongoose");

const blackList = new Schema(
  {
    email: String,
    code: String,
    verify: Boolean
  },
  {
    timestamps: true,
  }
);

module.exports = model("blackListPassword", blackList);
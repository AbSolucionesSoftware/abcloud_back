const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    name: String,
    age: String,
    scholarship: String,
    keyImage: String,
    urlImage: String,
    phone: String,
    email: {
      type: String,
      unique: true,
      trim: true,
    },
    password: String,
    type: String,
    sessiontype: String,
    policies: Boolean,
    profession: String,
    admin: Boolean,
    last_sesion: String,
    messagingTokens: [
      {
        token: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = model("user", userSchema);

const { Schema, model } = require("mongoose");

const cartSchema = new Schema(
  {
    idUser: {
      type: Schema.ObjectId,
      ref: "user",
    },
    courses: [
      {
        course: {
          type: Schema.ObjectId,
          ref: "course",
        },
      },
    ],
    packsCourses: [
      {
        package: {
          type: Schema.ObjectId,
          ref: "coursePackages",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = model("cart", cartSchema);

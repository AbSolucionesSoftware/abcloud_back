const { Schema, model } = require("mongoose");

const couponSchema = new Schema(
  {
    code: String,
    exchange: Boolean,
    idCourse: {
      type: Schema.ObjectId,
      ref: "course",
    },
    idUser: {
      type: Schema.ObjectId,
      ref: "user",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model("coupon", couponSchema);

const mongoose = require("mongoose");
var Float = require("mongoose-float").loadType(mongoose, 4);

const packagesSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    slug: String,
    image: String,
    key_image: String,
    courses: [
      {
        courseId: { type: mongoose.Schema.ObjectId, ref: "course" },
        course: { type: mongoose.Schema.ObjectId, ref: "course" },
        prices: {
          free: Boolean,
          price: Float,
          promotionPrice: Float,
          persentagePromotion: String,
        },
      },
    ],
    idProfessor: {
      type: mongoose.Schema.ObjectId,
      ref: "user",
    },
    pricePack: Float,
    active: Boolean,
    archived: Boolean,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("coursePackages", packagesSchema);

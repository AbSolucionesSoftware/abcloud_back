const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    image_desktop: String,
    image_devices: String,
    key_desktop: String,
    key_devices: String,
    course_ref: String,
    order_number: Number,
    course_name: String,
  },
);

module.exports = mongoose.model("banner", bannerSchema);

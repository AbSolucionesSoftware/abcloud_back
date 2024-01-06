const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    image: String,
    key_image: String,
    image_devices: String,
    key_image_devices: String,
    sended: Boolean,
    url: String,
    id_course: String,
    id_teacher: String,
    teacher_name: String,
    admin: Boolean,
    general: Boolean,
    date_send: String,
    create_date: String,
    isModal: Boolean,
  },
);

module.exports = mongoose.model("notification", notificationSchema);

const mongoose = require("mongoose");

const homeTemplatesSchema = new mongoose.Schema({
  show_title: Boolean,
  title: String,
  show_banner: Boolean,
  banner: String,
  banner_key: String,
  show_cards: Boolean,
  data: String,
  category: String,
  courses: [
    {
      id: String,
      course: {
        type: mongoose.Schema.ObjectId,
        ref: "course",
      },
    },
  ],
  order_template: Number,
  image_on_cards: Boolean,
  image_on_cards_key: String,
  only_cards: Boolean,
  image_orientation: String,
  url_redirection: String,
});

module.exports = mongoose.model("homeTemplates", homeTemplatesSchema);

const { Schema, model } = require("mongoose");

const categorieSchema = new Schema(
  {
    categorie: {
      type: String,
      trim: true
    },
    subCategories: [
      {
        subCategorie: {
          type: String,
          trim: true
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = model("categorie", categorieSchema);

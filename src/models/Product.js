const { Schema, model } = require("mongoose");

const ProductSchema = new Schema(
    {
      name: {
        type: String,
        require: true,
      },
      type: {
        type: String,
        require: true,
      },
      description: String,
      price: String,
      idProfessor: {
        type: Schema.ObjectId,
        ref: "user",
      },
    },
    {
      timestamps: true,
    }
  );

module.exports = model("product", ProductSchema);

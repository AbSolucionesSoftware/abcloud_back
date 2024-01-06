const mongoose = require("mongoose");
const { Schema, model } = mongoose;
var Float = require("mongoose-float").loadType(mongoose, 4);
const paginate = require('mongoose-paginate-v2');

const PaymentLinkSchema = new Schema(
  {
    paymentID: {
      type: String,
      require: true,
    },
    url: {
      type: String,
      require: true,
    },
    idProduct: {
      type: Schema.ObjectId,
      ref: "product",
    },
    product: {
      type: String,
      require: true,
    },
    description: String,
    typePayment: {
      type: String,
      require: true,
    },
    typeService: {
      type: String,
      require: true,
    },
    price: Number,
    quantity: Number,
    currency: {
      type: String,
      require: true,
    },
    statusPay: Boolean,
    total: Float,
    amount: Number,
    idPay: {
      type: Schema.ObjectId,
      ref: "pay",
    },
    notes: String,
    user: {
      idUser: String,
      name: String,
      phone: String,
      email: String,
    }
  },
  {
    timestamps: true,
  }
);
PaymentLinkSchema.plugin(paginate);
module.exports = model("paymentlinks", PaymentLinkSchema);

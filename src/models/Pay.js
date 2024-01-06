const mongoose = require("mongoose");
var Float = require("mongoose-float").loadType(mongoose, 4);
const paginate = require('mongoose-paginate-v2');
const { Schema, model } = mongoose;

const paySchema = new Schema(
  {
    stripeObject: String,
    payPalPayment: String,
    triedPayment: String,
    idUser: {
       type: Schema.ObjectId,
       ref: 'user' 
    },
    nameUser: String,
    typePay: String,
    statusPay: Boolean,
    comment: String,
    total: String,
    amount: String,
    isService: Boolean,
    idService: {
      type: Schema.ObjectId,
      ref: 'product' 
   },
    typeService: String,
    summary: String,
    courses: [
      {
        priceCourse: Float,
        pricePromotionCourse: Float,
        promotion: Boolean,
        persentagePromotion: String,
        idCourse: {
          type: Schema.ObjectId,
          ref: 'course'
        },
        coupon_discount: {
          percent_discount: Number,
          discount_price: Number, 
          coupon_code: String
        }
      }
    ]
  },
  {
    timestamps: true,
  }
);

paySchema.plugin(paginate);

module.exports = model('pay',paySchema);
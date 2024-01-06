const mongoose = require("mongoose");
var Float = require("mongoose-float").loadType(mongoose, 4);

const courseSchema = new mongoose.Schema(
  {
    title: String,
    subtitle: String,
    keyPromotionalImage: String,
    urlPromotionalImage: String,
    urlCourseVideo: String,
    hours: String,  
    priceCourse: {
      free: Boolean,
      price: Float,
      promotionPrice: Float,
      persentagePromotion: String,
    },
    idProfessor: {
      type: mongoose.Schema.ObjectId,
      ref: "user",
    },
    publication: Boolean,
    qualification: Float,
    learnings: [
      {
        learning: String,
      },
    ],
    category: String,
    subCategory: String,
    requirements: [
      {
        requirement: String,
      },
    ],
    whoStudents: [
      {
        whoStudent: String,
      },
    ],
    description: String,
    level: String,
    language: String,
    startMessage: String,
    finalMessage: String,
    inscriptionStudents: Number,
    idMassPromotion: String,
    MassPromotionPercentage: String,
    slug: {
      type: String,
      unique: true
    },
    // >>>>>>> TALLER  >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    taller:{
        nameTaller: String,

        fechaInicio: String,
        fechaFin: String,
        horaInicio: String,
        horaFin: String,
        sesiones: String,
        duracionSesion: String,
        
        descripcionTaller:String,
        aprendizajesTaller: [
          {
            apredizaje: String
          }
        ], 
        publicTaller: Boolean,
        keyImageTaller: String,
        urlImageTaller: String,
        nameMaestro: String,
        descripcionMaestro: String,
        keyImageMaestro: String,
        urlImageMaestro: String,
        infoCorreo: String,
        linksCorreo: [{
          tituloEnlace: String,
          enlace: String
        }]
    },
    // cupon de descuento
    active_coupon: Boolean,
    coupon_discount: {
      percent_discount: Number,
      discount_price: Number, 
      coupon_code: String
    },
    archived: Boolean
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("course", courseSchema);

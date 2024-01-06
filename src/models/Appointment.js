const { Schema, model } = require("mongoose");

const AppointmentSchema = new Schema(
    {
      summary: {
        type: String,
        require: true,
      },
      product: String,
      idProduct: {
        type: Schema.ObjectId,
        ref: "product",
      },
      name: String,
      email: String,
      description: String,
      start: String,
      end: String,
      hours: Number,
      fecha: String,
      hora: Number,
      minuto: Number,
      linkMeeting: String,
      idGoogleMeet: String,
      attendees: [
        {
          name: String,
          email: String,
        },
      ],
      created: String,
      requestedBy: {
        name: String,
        email: String,
      },
      amount: String,
      idPay: {
        type: Schema.ObjectId,
        ref: "pay",
      },
    },
    {
      timestamps: true,
    }
  );

module.exports = model("appointment", AppointmentSchema);

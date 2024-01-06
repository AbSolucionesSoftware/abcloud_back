const appointCtrl = {};
const AppointmentModel = require("../models/Appointment");
const UserModel = require("../models/User");
const ProductModel = require("../models/Product");
const modelPay = require("../models/Pay");
const Stripe = require("stripe");
const { google } = require("googleapis");
const moment = require("moment-timezone");
const { sendEmail } = require("../middleware/sendEmail");
moment.tz.setDefault("America/Mexico_City");

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/gmail.send",
];
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PROJECT_NUMBER = process.env.GOOGLE_PROJECT_NUMBER;
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

const jwtClient = new google.auth.JWT(
  GOOGLE_CLIENT_EMAIL,
  null,
  GOOGLE_PRIVATE_KEY,
  SCOPES,
  "diego.leon@abcloud.com.mx"
);

const calendar = google.calendar({
  version: "v3",
  //project: GOOGLE_PROJECT_NUMBER,
  auth: jwtClient,
});

appointCtrl.getAppointment = async (req, res) => {
  try {
    const appointment = await AppointmentModel.find({
      fecha: { $gte: moment().locale("es-mx").format("L") },
    }).select("start end");
    //console.log(appointment)
    res.status(200).json(appointment);
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

appointCtrl.createAppointment = async (req, res) => {
  try {
    await modelPay.findByIdAndUpdate(
      payBase._id,
      {
        statusPay: true,
        triedPayment: paymentConfirm.id,
        comment: "Realizado",
      },
      async (err, postStored) => {
        if (err) {
          res.status(500).json({ message: "Error al crear el pago." });
          return;
        }
        await createCalendarEvent(appointment, res, { _id: payBase._id });
      }
    );
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

appointCtrl.createTestAppointment = async (req, res) => {
  try {
    const input = {
      summary: req.body.summary,
      product: req.body.product,
      idProduct: req.body.idProduct,
      name: req.body.name,
      email: req.body.email,
      description: req.body.description,
      start: req.body.start,
      end: req.body.end,
      hours: req.body.hours,
      linkMeeting: "",
      idGoogleMeet: "",
      /* attendees: [
        {
          name: "",
          email: "",
        },
      ], */
      creator: {
        name: "",
        email: "",
      },
      created: "",
      requestedBy: {
        name: "",
        email: "",
      },
      amount: req.body.amount,
      //idPay: null,
    };
    const newAppoinment = new AppointmentModel(input);
    await newAppoinment.save();
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
  }
};
appointCtrl.getTestAppoinments = async (req, res) => {
  try {
    /* calendar.events.list(
      {
        calendarId: GOOGLE_CALENDAR_ID,
        //timeMin: (new Date()).toISOString(),
        //maxResults: 10,
        //singleEvents: true,
        //orderBy: 'startTime',
      },
      (error, result) => {
        if (error) {
          res.send(JSON.stringify({ error: error }));
        } else {
          if (result.data.items.length) {
            res.send(JSON.stringify({ events: result.data.items }));
          } else {
            res.send(JSON.stringify({ message: "No upcoming events found." }));
          }
        }
      }
    ); */
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
  }
};

appointCtrl.createPay = async (req, res) => {
  try {
    const { idStripe, username, total, typePay, idService, summary } = req.body;
    const newPay = new modelPay({
      stripeObject: idStripe.id,
      nameUser: username,
      typePay: typePay,
      statusPay: false,
      comment: "Intento de pago creado",
      isService: true,
      idService,
      typeService: "Consultoria",
      summary,
      total: total,
      amount: Math.round(100 * parseFloat(total)),
    });
    await newPay.save((err, userStored) => {
      if (err) {
        res.status(500).json({ message: "Ups, algo paso", err });
      } else {
        if (!userStored) {
          res.status(404).json({ message: "Error" });
        } else {
          res
            .status(200)
            .json({ message: "Todo correcto", idPay: userStored._id });
        }
      }
    });
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

appointCtrl.confirmPay = async (req, res) => {
  try {
    const payBase = await modelPay.findById(req.params.idPay);
    const stripe = new Stripe(process.env.LLAVE_SECRETA_STRIPE);
    if (payBase) {
      stripe.paymentIntents
        .create({
          amount: payBase.amount,
          currency: "MXN",
          description: JSON.stringify(payBase._id),
          payment_method_types: ["card"],
          payment_method: payBase.stripeObject,
        })
        .then((payment) => {
          stripe.paymentIntents
            .confirm(payment.id, {
              return_url: `${process.env.APP_URI}/payment_confirm/${payment.id}/${payBase._id}`,
            })
            .then(async (paymentConfirm) => {
              if (paymentConfirm.status === "requires_action") {
                res
                  .status(200)
                  .json({ message: "requires_action", paymentConfirm });
                return;
              }
              if (paymentConfirm.status === "succeeded") {
                await modelPay.findByIdAndUpdate(
                  payBase._id,
                  {
                    statusPay: true,
                    triedPayment: paymentConfirm.id,
                    comment: "Realizado",
                  },
                  async (err, postStored) => {
                    if (err) {
                      res
                        .status(500)
                        .json({ message: "Error al crear el pago." });
                      return;
                    }
                    const product = await ProductModel.findById(
                      req.body.appointment.idProduct
                    );
                    if (!product) throw new Error("No se encontro servicio");
                    const professor = await UserModel.findById(
                      product.idProfessor
                    );
                    //create event in google calendar
                    calendar.events.insert(
                      {
                        calendarId: GOOGLE_CALENDAR_ID,
                        conferenceDataVersion: 1,
                        resource: {
                          summary: req.body.appointment.summary,
                          description: req.body.appointment.description,
                          start: {
                            dateTime: req.body.appointment.start,
                            timeZone: "America/Mexico_City",
                          },
                          end: {
                            dateTime: req.body.appointment.end,
                            timeZone: "America/Mexico_City",
                          },
                          conferenceData: {
                            createRequest: {
                              requestId: "opcional",
                            },
                          },
                          attendees: [
                            { email: professor.email },
                            { email: req.body.appointment.email },
                          ],
                          reminders: {
                            useDefault: false,
                            overrides: [
                              { method: "email", minutes: 30 }, // Notificar por correo electrónico 30 minutos antes
                              { method: "popup", minutes: 10 }, // Mostrar una ventana emergente 10 minutos antes
                            ],
                          },
                        },
                      },
                      async (error, result) => {
                        if (error) {
                          res.send(JSON.stringify({ error: error }));
                        } else {
                          const input = {
                            summary: req.body.appointment.summary,
                            product: req.body.appointment.product,
                            idProduct: req.body.appointment.idProduct,
                            name: req.body.appointment.name,
                            email: req.body.appointment.email,
                            description: req.body.appointment.description,
                            start: req.body.appointment.start,
                            end: req.body.appointment.end,
                            hours: req.body.appointment.hours,
                            fecha: moment(req.body.appointment.fecha).locale("es-mx").format(
                              "L"
                            ),
                            hora: req.body.appointment.hora,
                            minuto: req.body.appointment.minuto,
                            linkMeeting: result.data.hangoutLink,
                            idGoogleMeet: result.data.id,
                            attendees: [
                              {
                                name: professor.name,
                                email: professor.email,
                              },
                              {
                                name: req.body.appointment.name,
                                email: req.body.appointment.email,
                              },
                            ],
                            created: moment().locale("es-mx").format(),
                            requestedBy: {
                              name: req.body.appointment.name,
                              email: req.body.appointment.email,
                            },
                            amount: req.body.appointment.amount,
                            idPay: payBase._id,
                          };
                          const newAppoinment = new AppointmentModel(input);
                          await newAppoinment.save();
                          await emailFinisUser(
                            payBase._id,
                            newAppoinment,
                            professor,
                            result.data
                          );
                          res.status(200).json({
                            message: "Reunión agendada",
                            idPay: payBase._id,
                            conferenceData: {
                              linkMeeting: result.data.hangoutLink,
                              idGoogleMeet: result.data.id,
                            },
                          });
                        }
                      }
                    );
                  }
                );
              } else {
                await modelPay.findByIdAndUpdate(payBase._id, {
                  comment: "Error de pago",
                });
                res
                  .status(500)
                  .json({ message: "No se pudo procesar el pago." });
              }
            })
            .catch(async (err) => {
              if (err.type === "StripeCardError") {
                await modelPay.findByIdAndUpdate(payBase._id, {
                  comment: err.code,
                });
                res.status(400).json({ message: err.message });
              } else {
                await modelPay.findByIdAndUpdate(payBase._id, {
                  comment: "Error de pago",
                });
                res.status(404).json({ message: "Error al completar pago" });
              }
            });
        })
        .catch(async (err) => {
          console.log(err);
          await modelPay.findByIdAndUpdate(payBase._id, {
            comment: "Error de pago",
          });
          res.status(404).json({ message: "Error al completar pago" });
        });
    } else {
      res.status(404).json({ message: "No existe este intento de pago" });
    }
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log({ error });
  }
};

appointCtrl.cancelPay = async (req, res) => {
  try {
    await modelPay.findByIdAndUpdate(req.params.idPay, {
      comment: "Rechazado por usuario",
    });
    res.status(200).json({ message: "Intento de pago cancelado" });
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

appointCtrl.PaypalPay = async (req, res) => {
  try {
    const { paymentData, appointment } = req.body;
    const newPay = new modelPay({
      payPalPayment: paymentData.idPaypal,
      nameUser: paymentData.username,
      typePay: paymentData.typePay,
      statusPay: false,
      comment: "Realizado",
      total: paymentData.total,
      amount: Math.round(100 * parseFloat(paymentData.total)),
      statusPay: true,
      isService: true,
      idService: paymentData.idService,
      typeService: "Consultoria",
      summary: paymentData.summary,
    });
    await newPay.save(async (err, postStored) => {
      if (err) {
        res.status(500).json({ message: "Ups, algo paso", err });
      } else {
        if (!postStored) {
          res.status(404).json({ message: "Error" });
        } else {
          await createCalendarEvent(appointment, res, postStored);
        }
      }
    });
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

async function createCalendarEvent(data, res, paydata) {
  try {
    //get professor of course selected
    const product = await ProductModel.findById(data.idProduct);
    if (!product) throw new Error("No se encontro producto/servicio");
    const professor = await UserModel.findById(product.idProfessor);
    //create event in google calendar
    calendar.events.insert(
      {
        calendarId: GOOGLE_CALENDAR_ID,
        conferenceDataVersion: 1,
        resource: {
          summary: data.summary,
          description: data.description,
          start: {
            dateTime: data.start,
            timeZone: "America/Mexico_City",
          },
          end: {
            dateTime: data.end,
            timeZone: "America/Mexico_City",
          },
          conferenceData: {
            createRequest: {
              requestId: "opcional",
            },
          },
          attendees: [{ email: professor.email }, { email: data.email }],
          reminders: {
            useDefault: false,
            overrides: [
              { method: "email", minutes: 30 }, // Notificar por correo electrónico 30 minutos antes
              { method: "popup", minutes: 10 }, // Mostrar una ventana emergente 10 minutos antes
            ],
          },
        },
      },
      async (error, result) => {
        if (error) {
          console.log(error);
          res.status(505).json({
            error: error,
            /* message: error.message, */ idPay: paydata._id,
          });
        } else {
          const input = {
            summary: data.summary,
            product: data.product,
            idProduct: data.idProduct,
            name: data.name,
            email: data.email,
            description: data.description,
            start: data.start,
            end: data.end,
            hours: data.hours,
            linkMeeting: result.data.hangoutLink,
            idGoogleMeet: result.data.id,
            fecha: moment(data.fecha).locale("es-mx").format("L"),
            hora: data.hora,
            minuto: data.minuto,
            attendees: [
              {
                name: professor.name,
                email: professor.email,
              },
              {
                name: data.name,
                email: data.email,
              },
            ],
            created: moment().locale("es-mx").format(),
            requestedBy: {
              name: data.name,
              email: data.email,
            },
            amount: data.amount,
            idPay: paydata._id,
          };
          const newAppoinment = new AppointmentModel(input);
          await newAppoinment.save();
          await emailFinisUser(
            paydata._id,
            newAppoinment,
            professor,
            result.data
          );
          res.status(200).json({
            message: "Reunión agendada",
            idPay: paydata._id,
            conferenceData: {
              linkMeeting: result.data.hangoutLink,
              idGoogleMeet: result.data.id,
            },
          });
        }
      }
    );
  } catch (error) {
    console.log(error);
    res
      .status(505)
      .json({ message: "Error del servidor", error, idPay: paydata._id });
  }
}

const emailFinisUser = async (paymentId, appointment, professor, meet) => {
  const {
    attendees,
    summary,
    description,
    product,
    fecha,
    hora,
    minuto,
    hours,
  } = appointment;
  try {
    const start = moment().date(fecha).hour(hora).minute(minuto);
    const end = moment(start).add(hours, "hours");

    const content = `
      <div style="padding: 16px;">
        <h2>${summary} - ${product} consultoria con ${professor.name}</h2>
        <h3>Se agendo correctamente una reunion por medio de Google meet</h3>
        <p>${description}</p>
        <p>Fecha y hora: ${moment(fecha).format("LL")} de ${moment(
      start
    ).format("LT")} a ${moment(end).format("LT")} Hora México</p>
        <p>Invitados:</p>
        <ul>
          <li>${attendees[0].name} - ${attendees[0].email}</li>
          <li>${attendees[1].name} - ${attendees[1].email}</li>
        </ul>
        <p>ID de pago: ${paymentId}</p>
        <p>ID evento Google meet: ${meet.id}</p>
        <p><b>ENLACE VIDEOCONFERENCIA: <a href="${
          meet.hangoutLink
        }" target="_blank">${meet.hangoutLink}</a></b></p>
        <br />
        <p>Cualquier duda o aclaracion ${
          professor.phone ? `al número de telefono ${professor.phone} o ` : ""
        }al correo electrónico ${professor.email}</p>
        <div style="display: flex;justify-content: center;align-items: center; height: 60px; width: 200px;">
            <img src="https://cursos-uniline.s3.us-west-1.amazonaws.com/unilineAzul.png" alt="unilie logo" style="max-width: 100%;max-height: 100%;" />
        </div>
      </div>
    `;
    await sendEmail(appointment.email, summary, content, "Uniline");
  } catch (error) {
    console.log(error);
  }
};

module.exports = appointCtrl;

const payCtrl = {};
const modelPay = require("../models/Pay");
const Stripe = require("stripe");
const modelInscription = require("../models/Inscription");
const reuserFunction = require("../middleware/reuser");
const modelCart = require("../models/Cart");
const modelCourse = require("../models/Course");
const modelUser = require("../models/User");
const { sendEmail } = require("../middleware/sendEmail");

payCtrl.createPay = async (req, res) => {
  try {
    const { idStripe, courses, username, idUser, total, typePay } = req.body;
    const newPay = new modelPay({
      stripeObject: idStripe.id,
      idUser: idUser,
      nameUser: username,
      typePay: typePay,
      statusPay: false,
      comment: "Intento de pago creado",
      isService: false,
      //idService: null,
      typeService: "Curso",
      total: total,
      amount: Math.round(100 * parseFloat(total)),
      courses: courses,
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

payCtrl.confirmPay = async (req, res) => {
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
                    const cartUser = await modelCart.findOne({
                      idUser: payBase.idUser,
                    });
                    const user_bd = await modelUser.findById(payBase.idUser);
                    payBase.courses.map(async (course) => {
                      const curso_bd = await modelCourse.findById(
                        course.idCourse
                      );
                      const inscriptionBase = await modelInscription.findOne({
                        idCourse: course.idCourse,
                        idUser: payBase.idUser,
                      });
                      if (!inscriptionBase) {
                        const newInscription = new modelInscription({
                          idCourse: course.idCourse,
                          idUser: payBase.idUser,
                          codeKey: "",
                          code: false,
                          priceCourse: course.priceCourse,
                          freeCourse: false,
                          promotionCourse: course.pricePromotionCourse,
                          persentagePromotionCourse: course.persentagePromotion,
                          studentAdvance: "0",
                          ending: false,
                          numCertificate: reuserFunction.generateNumCertifictate(
                            10
                          ),
                          coupon_discount: course.coupon_discount
                            ? course.coupon_discount
                            : null,
                        });
                        await newInscription.save();
                        if (curso_bd.startMessage) {
                          await payCtrl.createSendEmailStart(user_bd, curso_bd);
                        }
                      }
                    });
                    for (z = 0; z < payBase.courses.length; z++) {
                      for (i = 0; i < cartUser.courses.length; i++) {
                        if (
                          JSON.stringify(payBase.courses[z].idCourse) ===
                          JSON.stringify(cartUser.courses[i].course)
                        ) {
                          await modelCart.updateOne(
                            {
                              _id: cartUser._id,
                            },
                            {
                              $pull: {
                                courses: {
                                  _id: cartUser.courses[i]._id,
                                },
                              },
                            }
                          );
                        }
                      }
                    }
                    res.status(200).json({ message: "Pago realizado" });
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
              console.log(err.type);
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

payCtrl.createInscriptionAfterConfirm = async (req, res) => {
  try {
    const { idPaymentIntent, idPay } = req.body;
    const payBase = await modelPay.findById(idPay);
    //verificar si ya esta pagado para no continuar
    if (payBase.statusPay) {
      res.status(400).json({ message: "Este pago ya ha sido validado" });
      return;
    }
    await modelPay.findByIdAndUpdate(
      payBase._id,
      { statusPay: true, triedPayment: idPaymentIntent, comment: "Realizado" },
      async (err, postStored) => {
        if (err) {
          res.status(500).json({ message: "Error al crear el pago." });
        } else {
          if (!postStored) {
            res.status(500).json({ message: "Error al crear el pago." });
          } else {
            const cartUser = await modelCart.findOne({
              idUser: payBase.idUser,
            });
            const user_bd = await modelUser.findById(payBase.idUser);
            payBase.courses.map(async (course) => {
              const curso_bd = await modelCourse.findById(course.idCourse);
              const inscriptionBase = await modelInscription.findOne({
                idCourse: course.idCourse,
                idUser: payBase.idUser,
              });
              if (!inscriptionBase) {
                const newInscription = new modelInscription({
                  idCourse: course.idCourse,
                  idUser: payBase.idUser,
                  codeKey: "",
                  code: false,
                  priceCourse: course.priceCourse,
                  freeCourse: false,
                  promotionCourse: course.pricePromotionCourse,
                  persentagePromotionCourse: course.persentagePromotion,
                  studentAdvance: "0",
                  ending: false,
                  numCertificate: reuserFunction.generateNumCertifictate(10),
                  coupon_discount: course.coupon_discount
                    ? course.coupon_discount
                    : null,
                });
                await newInscription.save();
                if (curso_bd.startMessage) {
                  await payCtrl.createSendEmailStart(user_bd, curso_bd);
                }
              }
            });
            for (z = 0; z < payBase.courses.length; z++) {
              for (i = 0; i < cartUser.courses.length; i++) {
                if (
                  JSON.stringify(payBase.courses[z].idCourse) ===
                  JSON.stringify(cartUser.courses[i].course)
                ) {
                  await modelCart.updateOne(
                    {
                      _id: cartUser._id,
                    },
                    {
                      $pull: {
                        courses: {
                          _id: cartUser.courses[i]._id,
                        },
                      },
                    }
                  );
                }
              }
            }
            res.status(200).json({ message: "Pago realizado" });
          }
        }
      }
    );
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

payCtrl.updateStatusPay = async (req, res) => {
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

payCtrl.getPay = async (req, res) => {
  try {
    await modelPay.findById(req.params.idPay, async (err, courses) => {
      if (err) {
        res.status(505).json({ message: "Ups, algo paso", err });
      } else {
        if (!courses) {
          res.status(505).json({ message: "Ups, algo paso", err });
        } else {
          await modelCourse.populate(
            courses,
            { path: "courses.idCourse" },
            async function (err2, populatedTransactions) {
              // Your populated translactions are inside populatedTransactions
              if (err2) {
                res.status(505).json({ message: "Ups, algo paso", err2 });
              } else {
                await modelUser.populate(
                  populatedTransactions,
                  { path: "courses.idCourse.idProfessor" },
                  async function (err3, populatedTransactions2) {
                    // Your populated translactions are inside populatedTransactions
                    if (err3) {
                      res.status(505).json({ message: "Ups, algo paso", err3 });
                    } else {
                      res.status(200).json(populatedTransactions2);
                    }
                  }
                );
              }
            }
          );
        }
      }
    });
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

payCtrl.pauWithPayPal = async (req, res) => {
  try {
    const { idPaypal, courses, username, idUser, total, typePay } = req.body;
    const newPay = new modelPay({
      payPalPayment: idPaypal,
      idUser: idUser,
      nameUser: username,
      typePay: typePay,
      statusPay: false,
      comment: "Realizado",
      isService: false,
      //idService: null,
      typeService: "Curso",
      total: total,
      amount: Math.round(100 * parseFloat(total)),
      courses: courses,
      statusPay: true,
    });
    await newPay.save(async (err, courseBase) => {
      if (err) {
        res.status(500).json({ message: "Ups, algo paso", err });
      } else {
        if (!courseBase) {
          res.status(404).json({ message: "Error" });
        } else {
          const cartUser = await modelCart.findOne({
            idUser: idUser,
          });
          const user_bd = await modelUser.findById(idUser);
          courseBase.courses.map(async (course) => {
            const curso_bd = await modelCourse.findById(course.idCourse);
            const inscriptionBase = await modelInscription.findOne({
              idCourse: course.idCourse,
              idUser: idUser,
            });
            if (!inscriptionBase) {
              const newInscription = new modelInscription({
                idCourse: course.idCourse,
                idUser: idUser,
                codeKey: "",
                code: false,
                priceCourse: course.priceCourse,
                freeCourse: false,
                promotionCourse: course.pricePromotionCourse,
                persentagePromotionCourse: course.persentagePromotion,
                studentAdvance: "0",
                ending: false,
                numCertificate: reuserFunction.generateNumCertifictate(10),
                coupon_discount: course.coupon_discount
                  ? course.coupon_discount
                  : null,
              });
              await newInscription.save();
              if (curso_bd.startMessage) {
                await payCtrl.createSendEmailStart(user_bd, curso_bd);
              }
            }
          });
          for (z = 0; z < courseBase.courses.length; z++) {
            for (i = 0; i < cartUser.courses.length; i++) {
              if (
                JSON.stringify(courseBase.courses[z].idCourse) ===
                JSON.stringify(cartUser.courses[i].course)
              ) {
                await modelCart.updateOne(
                  {
                    _id: cartUser._id,
                  },
                  {
                    $pull: {
                      courses: {
                        _id: cartUser.courses[i]._id,
                      },
                    },
                  }
                );
              }
            }
          }
          res.status(200).json({ idPay: courseBase._id });
        }
      }
    });
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

payCtrl.createSendEmailStart = async (user, curso) => {
  const nombre = user.name.split(" ");
  try {
    const htmlContentUser = `
      <div>
        <h3>Hola, ${nombre[0]}</h3>               
        ${curso.startMessage}
      </div>
    `;
    await sendEmail(
      user.email,
      `Tienes un nuevo curso: ${curso.title}`,
      htmlContentUser,
      "Uniline"
    );
  } catch (error) {
    console.log(error);
  }
};

payCtrl.SendPdfEmail = async (req, res) => {
  try {
    if (!req.file) res.status(404).send({ message: "No se recibio archivo" });
    const pdf = req.file.buffer;
    const data = await modelPay.findById(req.params.idPay);
    const user = await modelUser.findById(data.idUser);
    sendInvoice(user.email, `Recibo pago`, data, pdf);
    res.status(200).send({ message: "Se ha enviado el correo" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error del servidor", error });
  }
};

const sendInvoice = async (receiver, subject, data, pdf) => {
  try {
    const content = `
      <div style="padding: 16px;">
        <h3>Recibo de pago</h3>
        <p>Plataforma: ${data.typePay}</p>
        <p>Status: <b>"PAGADO"</b></p>
        <p>Monto Pagado: <b>${data.total}</b></p>
        <p>Adjuntamos la nota de venta en PDF en este mismo correo</p>
        <br />
        <div style="display: flex;justify-content: center;align-items: center; height: 60px; width: 200px;">
            <img src="https://cursos-uniline.s3.us-west-1.amazonaws.com/unilineAzul.png" alt="unilie logo" style="max-width: 100%;max-height: 100%;" />
        </div>
      </div>
    `;
    const attachments = [
      {
        filename: "Recibo pago.pdf",
        content: pdf,
        contentType: "application/pdf",
      },
    ];
    await sendEmail(receiver, subject, content, "Uniline", attachments);
  } catch (error) {
    console.log(error);
  }
};

module.exports = payCtrl;

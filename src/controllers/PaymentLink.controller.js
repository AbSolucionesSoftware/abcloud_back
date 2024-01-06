const paymentLinkCtrl = {};
const PaymentLinkModel = require("../models/PaymenLinks");
const modelPackages = require("../models/Packages");
const modelCourse = require("../models/Course");
const modelUser = require("../models/User");
const modelPay = require("../models/Pay");
const modelInscription = require("../models/Inscription");
const reuserFunction = require("../middleware/reuser");
const Stripe = require("stripe");
const paypal = require("paypal-rest-sdk");
const moment = require("moment-timezone");
const { sendEmail } = require("../middleware/sendEmail");
moment.tz.setDefault("America/Mexico_City");
const stripe = new Stripe(process.env.LLAVE_SECRETA_STRIPE);

// Configura las credenciales de tu cuenta de PayPal
paypal.configure({
  mode: "sandbox", // Cambia a 'live' en producción
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_SECRET,
});

paymentLinkCtrl.getProducts = async (req, res) => {
  try {
    if (req.query.public) {
      filter.publication = req.query.public;
    }
    const courses = await modelCourse.find({
      idProfessor: req.params.idTeacher,
      publication: true,
    });
    const packs = await modelPackages
      .find({
        idProfessor: req.params.idTeacher,
        archived: false,
      })
      .populate("courses.course");

    res.status(200).json({ courses, packs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error del servidor", error });
  }
};

paymentLinkCtrl.getUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const users = await modelUser.aggregate([
      {
        $limit: 50,
      },
      {
        $match: {
          $or: [
            { name: { $regex: ".*" + search + ".*", $options: "i" } },
            { email: { $regex: ".*" + search + ".*", $options: "i" } },
            { phone: { $regex: ".*" + search + ".*", $options: "i" } },
          ],
        },
      },
      {
        $sort: { name: 1 },
      },
    ]);
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error del servidor", error });
  }
};

paymentLinkCtrl.SendPdfEmail = async (req, res) => {
  try {
    if (!req.file) res.status(404).send({ message: "No se recibio archivo" });
    const pdf = req.file.buffer;
    const data = await PaymentLinkModel.findById(req.params.idPaymentLink);
    sendInvoice(data.user?.email, `Enlace de pago`, data, pdf);
    res.status(200).send({ message: "Se ha enviado el correo" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error del servidor", error });
  }
};

paymentLinkCtrl.getPaymentLinks = async (req, res) => {
  try {
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      sort: { createdAt: -1 },
      populate: [{ path: "idPay" }],
    };
    const paymentLinks = await PaymentLinkModel.paginate(null, options);
    res.status(200).json({ message: "success", response: paymentLinks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error del servidor", error });
  }
};

paymentLinkCtrl.getPaymentLink = async (req, res) => {
  try {
    const paymentLink = await PaymentLinkModel.findById(
      req.params.idPaymentLink
    );
    res.status(200).json({ message: "success", response: paymentLink });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error del servidor", error });
  }
};

paymentLinkCtrl.getPaymentLinkStripeDetail = async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(
      req.params.idStripe
    );
    res.status(200).json({ message: "success", response: session });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error del servidor", error });
  }
};

paymentLinkCtrl.getPaymentLinkPaypalDetail = async (req, res) => {
  try {
    paypal.payment.get(req.params.idPaypal, function (error, payment) {
      if (error) {
        console.log(error);
        res.status(404).json({ message: error.response?.message });
      } else {
        res.status(200).json({ message: "success", response: payment });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error del servidor", error });
  }
};

paymentLinkCtrl.createStripeLink = async (req, res) => {
  try {
    const { body } = req;
    // Crear una factura en Stripe
    let newPaymentLink = new PaymentLinkModel({
      ...body,
      idProduct: body.idProduct || null,
      statusPay: false,
      total: body.price,
      amount: Math.round(100 * parseFloat(body.price)),
    });
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: body.currency,
            product_data: {
              name: body.product,
              description: body.description,
            },
            unit_amount: Math.round(100 * parseFloat(body.price)), // Monto en centavos
          },
          quantity: body.quantity,
        },
      ],
      mode: "payment",
      success_url: `${process.env.APP_URI}/paymentlink/success/${newPaymentLink._id}`,
      cancel_url: `${process.env.APP_URI}/paymentlink/failed/${newPaymentLink._id}`,
    });
    newPaymentLink.paymentID = session.id;
    newPaymentLink.url = session.url;

    const response = await newPaymentLink.save();
    res.status(200).json({ message: "success", data: response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error del servidor", error });
  }
};

paymentLinkCtrl.createPaypalLink = async (req, res) => {
  try {
    const { body } = req;
    let newPaymentLink = new PaymentLinkModel({
      ...body,
      statusPay: false,
      total: body.price,
      amount: Math.round(100 * parseFloat(body.price)),
    });
    const paypalData = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: `${process.env.APP_URI}/paymentlink/success/${newPaymentLink._id}`,
        cancel_url: `${process.env.APP_URI}/paymentlink/failed/${newPaymentLink._id}`,
      },
      transactions: [
        {
          item_list: {
            items: [
              {
                name: body.product,
                price: body.price,
                currency: body.currency.toUpperCase(),
                quantity: 1,
              },
            ],
          },
          amount: {
            currency: body.currency.toUpperCase(),
            total: body.price,
          },
          description: body.description,
        },
      ],
    };
    paypal.payment.create(paypalData, async function (error, payment) {
      if (error) {
        throw error;
      } else {
        // Encuentra el enlace de aprobación del pago
        let url = "";
        for (let i = 0; i < payment.links.length; i++) {
          if (payment.links[i].rel === "approval_url") {
            url = payment.links[i].href;
          }
        }
        newPaymentLink.paymentID = payment.id;
        newPaymentLink.url = url;

        const response = await newPaymentLink.save();
        res.status(200).json({ message: "success", data: response });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error del servidor", error });
  }
};

paymentLinkCtrl.finishPaymentSuccess = async (req, res) => {
  try {
    const { idPaymentLink } = req.params;
    //obtener paymentlinkbd
    const paymentLink = await PaymentLinkModel.findById(idPaymentLink);
    const { typePayment, typeService, paymentID, user } = paymentLink;
    //actualizar su status
    await PaymentLinkModel.findByIdAndUpdate(idPaymentLink, {
      statusPay: true,
    });

    //1 obtener cursos
    let cursos = [];
    if (typeService.toLowerCase() === "curso") {
      const curso = await modelCourse.findById(paymentLink.idProduct);
      cursos.push({
        priceCourse: curso.priceCourse.price,
        pricePromotionCourse: curso.priceCourse.promotionPrice,
        persentagePromotion: curso.priceCourse.persentagePromotion,
        idCourse: curso._id,
        promotion: false,
      });
    }
    if (typeService.toLowerCase() === "pack") {
      const data = await modelPackages
        .findById(paymentLink.idProduct)
        .populate("courses.course");
      data.courses.forEach((curso) => {
        cursos.push({
          priceCourse: curso.prices.price,
          pricePromotionCourse: curso.prices.promotionPrice,
          persentagePromotion: curso.prices.persentagePromotion,
          idCourse: curso.courseId,
          promotion: false,
        });
      });
    }
    //crear pago bd
    let pagoData = {
      idUser: user.idUser || null,
      nameUser: user.name,
      typePay: typePayment.toLowerCase(),
      statusPay: true,
      comment: "Realizado",
      isService: false,
      typeService,
      total: paymentLink.total,
      amount: Math.round(100 * parseFloat(paymentLink.total)),
      courses: cursos,
    };

    if (typePayment === "STRIPE") pagoData.stripeObject = paymentID;
    if (typePayment === "PAYPAL") pagoData.payPalPayment = paymentID;

    const newPay = new modelPay(pagoData);
    await newPay.save(async (err, paymentDB) => {
      if (err) {
        res.status(500).json({ message: "Ups, algo paso", err });
      } else {
        if (!paymentDB.courses.length) {
          sendBuyWithoutCourse(user, paymentLink);//ver que envio
          res.status(200).json({ message: "Proceso finalizado" });
          return;
        }
        paymentDB.courses.map(async (course) => {
          const inscriptionBase = await modelInscription.findOne({
            idCourse: course.idCourse,
            idUser: user?.idUser,
          });
          const cursoData = await modelCourse.findById(course.idCourse);
          if (!inscriptionBase) {
            const newInscription = new modelInscription({
              idCourse: course.idCourse,
              idUser: user?.idUser,
              codeKey: "",
              code: false,
              priceCourse: course.priceCourse,
              freeCourse: false,
              promotionCourse: course.pricePromotionCourse,
              persentagePromotionCourse: course.persentagePromotion,
              studentAdvance: "0",
              ending: false,
              numCertificate: reuserFunction.generateNumCertifictate(10),
              coupon_discount: null,
            });
            await newInscription.save();
            sendCursoBuy(user, cursoData);
          }
        });
        res.status(200).json({ message: "Proceso finalizado" });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error del servidor", error });
  }
};

const sendInvoice = async (receiver, subject, data, pdf) => {
  try {
    const content = `
      <div style="padding: 16px;">
        <h3>Enlace de pago ${data.typePayment} para ${data.product}</h3>
        <p style="width: 100%;word-wrap: break-word;">ID de pago: ${data.paymentID}</p>
        <p style="width: 100%;word-wrap: break-word;">
          <a href="${data.url}" target="_blank">Pagar aquí</a>
        </p>
        <p>Adjuntamos la nota de venta en PDF en este mismo correo</p>
        <br />
        <div style="display: flex;justify-content: center;align-items: center; height: 60px; width: 200px;">
            <img src="https://cursos-uniline.s3.us-west-1.amazonaws.com/unilineAzul.png" alt="unilie logo" style="max-width: 100%;max-height: 100%;" />
        </div>
      </div>
    `;
    const attachments = [
      {
        filename: "Nota de pago.pdf",
        content: pdf,
        contentType: "application/pdf",
      },
    ];
    await sendEmail(receiver, subject, content, "Uniline", attachments);
  } catch (error) {
    console.log(error);
  }
};

const sendCursoBuy = async (user, curso) => {
  const nombre = user.name.split(" ");
  try {
    const htmlContentUser = `
      <div>
        <h3>Hola, ${nombre[0]}</h3>               
        ${curso?.startMessage || `Bienvenido al curso ${curso.title}`}
        <br />
        <p>Cualquier duda o aclaración al 5213171297626</p>
        <div style="display: flex;justify-content: center;align-items: center; height: 60px; width: 200px;">
            <img src="https://cursos-uniline.s3.us-west-1.amazonaws.com/unilineAzul.png" alt="unilie logo" style="max-width: 100%;max-height: 100%;" />
        </div>
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

const sendBuyWithoutCourse = async (user, datapayment) => {
  const nombre = user.name.split(" ");
  try {
    const htmlContentUser = `
      <div>
        <h3>Hola, ${nombre[0]}</h3>               
        ${`Su compra fue exitosa: ${datapayment.product}`}
        <p style="width: 100%;word-wrap: break-word;">ID de pago: ${
          datapayment.paymentID
        }</p>
        <br />
        <p>Cualquier duda o aclaración al 5213171297626</p>
        <div style="display: flex;justify-content: center;align-items: center; height: 60px; width: 200px;">
            <img src="https://cursos-uniline.s3.us-west-1.amazonaws.com/unilineAzul.png" alt="unilie logo" style="max-width: 100%;max-height: 100%;" />
        </div>
      </div>
    `;
    await sendEmail(
      user.email,
      `Compra en Uniline: ${datapayment.product}`,
      htmlContentUser,
      "Uniline"
    );
  } catch (error) {
    console.log(error);
  }
};

module.exports = paymentLinkCtrl;

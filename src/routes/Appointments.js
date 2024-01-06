const { Router } = require("express");
const router = Router();
const auth = require("../middleware/auth");

const {
  getAppointment,
  createAppointment,
  createTestAppointment,
  getTestAppoinments,
  createPay,
  confirmPay,
  cancelPay,
  PaypalPay
} = require("../controllers/Appointment.controllers");

router.route("/").post(createAppointment).get(getAppointment);
router.route("/test").post(createTestAppointment).get(getTestAppoinments);

router.route("/payment/payment_intent").post(createPay);
router.route("/payment/confirm/:idPay").post(confirmPay);
router.route("/payment/cancel/:idPay").post(cancelPay);
router.route("/payment/paypal/confirm").post(PaypalPay);

module.exports = router;
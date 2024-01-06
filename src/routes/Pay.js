const { Router } = require("express");
const router = Router();
const auth = require("../middleware/auth");
const multer = require('multer');
const upload = multer();
const {
  createPay,
  confirmPay,
  getPay,
  pauWithPayPal,
  createInscriptionAfterConfirm,
  updateStatusPay,
  SendPdfEmail
} = require("../controllers/Pay.controllers");

router.route("/generate/").post(auth, createPay);

router.route("/confirm/:idPay").put(auth, confirmPay);

router
  .route("/confirm/createInscription")
  .post(auth, createInscriptionAfterConfirm);

router.route("/cancel/:idPay").post(auth, updateStatusPay);

router.route("/:idPay").get(auth, getPay);

router.route("/confirm/paypal/").post(auth, pauWithPayPal);

router.route("/send/:idPay").post(auth, upload.single('pdf'), SendPdfEmail);

module.exports = router;

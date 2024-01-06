const { Router } = require("express");
const router = Router();
const auth = require("../middleware/auth");
const multer = require('multer');

const {
  getProducts,
  getUsers,
  getPaymentLinkStripeDetail,
  getPaymentLinkPaypalDetail,
  SendPdfEmail,
  getPaymentLink,
  getPaymentLinks,
  createStripeLink,
  createPaypalLink,
  finishPaymentSuccess,
} = require("../controllers/PaymentLink.controller");
const upload = multer();

router.route("/").get(auth, getPaymentLinks);
router.route("/:idPaymentLink").get(getPaymentLink);
router.route("/products/:idTeacher").get(auth, getProducts);
router.route("/users/get").get(auth, getUsers);
router.route("/send/:idPaymentLink").post(auth, upload.single('pdf'), SendPdfEmail);
router.route("/success/finishprocess/:idPaymentLink").post(finishPaymentSuccess);

//stripe
router.route("/stripe/create").post(auth, createStripeLink);
router.route("/stripe/paymentlink/:idStripe").get(auth, getPaymentLinkStripeDetail);

//paypal
router.route("/paypal/create").post(auth, createPaypalLink);
router.route("/paypal/paymentlink/:idPaypal").get(auth, getPaymentLinkPaypalDetail);

module.exports = router;

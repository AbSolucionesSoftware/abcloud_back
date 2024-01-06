const {Router} = require('express');
const router = Router();

const {
    getCertificate,
 } = require('../controllers/Certificate.controllers.js');

router.route('/verify/:numberCertificate').get(getCertificate);


module.exports = router;
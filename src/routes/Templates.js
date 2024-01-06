const {Router} = require('express');
const router = Router();
const auth = require('../middleware/auth');

const { 
    createNewTemplate,
    updateTemplate,
    updateOrder,
    deleteTemplate,
    uploadFileMultiple,
    getTemplatesHome,
    getTemplatesAdmin,
 } = require('../controllers/Templates.controllers');

router.route('/home').get(getTemplatesHome);

router.route('/admin').post(auth,uploadFileMultiple, createNewTemplate).get(auth, getTemplatesAdmin);

router.route('/admin/:idTemplate').put(auth, uploadFileMultiple, updateTemplate).delete(auth,deleteTemplate);

router.route('/admin/order').put(auth, updateOrder);

module.exports = router;
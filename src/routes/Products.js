const {Router} = require('express');
const router = Router();
const auth = require('../middleware/auth');

const { 
    createProduct,
    deleteProduct,
    editProduct,
    getProducts,
    getAllProductsConsultoring
 } = require('../controllers/Products.controllers');

 router.route('/consultoring/').get(getAllProductsConsultoring);

router.route('/:idProfessor').post(auth,createProduct).get(getProducts);

router.route('/action/:idProduct').put(auth,editProduct).delete(auth,deleteProduct);

module.exports = router;
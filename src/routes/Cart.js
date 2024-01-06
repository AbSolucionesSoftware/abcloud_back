const {Router} = require('express');
const router = Router();
const auth = require('../middleware/auth');

const { aggregateCourse,getCartCourse,deleteCourse, deleteCart, createCartPack, deletePackCart } = require('../controllers/Cart.controllers'); 

router.route('/:idUser').post(auth,aggregateCourse).get(getCartCourse).delete(auth,deleteCart);

router.route('/pack/:idUser').post(auth,createCartPack);

router.route('/:idUser/delete/:idCurse').delete(auth,deleteCourse);

router.route('/:idUser/delete/pack/:idPackage').delete(auth,deletePackCart);

module.exports = router;
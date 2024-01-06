const {Router} = require('express');
const router = Router();
const auth = require('../middleware/auth');

const { 
    getPackageByID,
    getAllPackages,
    getPackagesProfessor,
    uploadFile,
    createPackage,
    updatePackage,
 } = require('../controllers/Packages.controllers');

router.route('/').get(getAllPackages);

router.route('/paquete/:slug').get(getPackageByID);

router.route('/:idProfessor').post(auth,uploadFile,createPackage).get(auth,getPackagesProfessor);

router.route('/update/:idPackage').put(auth,uploadFile,updatePackage);

module.exports = router;
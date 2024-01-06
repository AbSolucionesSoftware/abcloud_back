const {Router} = require('express');
const router = Router();
const auth = require('../middleware/auth');

const { 
    createBanner,
    deleteBanner,
    editBanner,
    uploadFile,
    editOrderBanner,
    getBanners,
    editImageBannerDesktop,
    uploadImagenDevicesBanner,
    deleteImageBannerDevices,
 } = require('../controllers/Banner.controllers');

router.route('/').post(auth,uploadFile,createBanner).get(getBanners);

router.route('/:idBanner').put(auth,editBanner).delete(auth,deleteBanner);

router.route('/image_desktop/:idBanner').put(auth,uploadFile,editImageBannerDesktop);

router.route('/image_devices/:idBanner').put(auth, uploadFile, uploadImagenDevicesBanner).delete(auth,deleteImageBannerDevices);

router.route('/banner/reorder').put(auth,editOrderBanner);

module.exports = router;
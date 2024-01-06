const {Router} = require('express');
const router = Router();
const auth = require('../middleware/auth');

const { 
    createNotification,
    deleteNotification,
    editNotification,
    uploadFile,
    createModal,
    uploadFileMultiple,
    getNotifications,
    getNotificationsAdmin,
    getNotificationsTeacher,
    sendNotification,
    createAsModal
 } = require('../controllers/Notification.controllers');

router.route('/:idUser').post(auth,uploadFile,createNotification).get(getNotifications);

router.route('/modal/:idUser').post(auth,uploadFileMultiple, createModal);

router.route('/:idNotification').put(auth, uploadFile, editNotification, createAsModal).delete(auth,deleteNotification);

router.route('/:idNotification/modal').put(auth, createAsModal);

router.route('/send/:idNotification').put(auth, sendNotification);

router.route('/get/admin').get(auth, getNotificationsAdmin);

router.route('/teacher/:idTeacher/:idCourse').get(auth, getNotificationsTeacher);


module.exports = router;
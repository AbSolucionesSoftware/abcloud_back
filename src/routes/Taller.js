const { Router } = require("express");
const router = Router();
const auth = require("../middleware/auth");
const {
    uploadFile,
    getTaller,
    editTaller,
    publicTaller,
    createUsersTaller,
    getUsersTaller,
    deleteUsersTaller,
    uploadFileTaller,
    uploadFileTallerMaestro,
    createAprendizaje,
    createSendEmail
} = require("../controllers/Taller.controllers");

router.route("/:idCourse").put(editTaller);



router.route("/getCourse/:slug").get(getTaller);

router.route('/agregateAprendizajes/:idCourse').put(createAprendizaje);

router.route("/publicTaller/:idCourse").put(publicTaller);

router.route("/imagenTaller/:idCourse").put(uploadFile, uploadFileTaller);//FOTO DEL TALLER

router.route("/imagenTallerMaestro/:idCourse").put(uploadFile, uploadFileTallerMaestro); //FOTO DEL PROFESOR

router.route("/usersTaller/:idCourse").get(getUsersTaller).post(createUsersTaller); 

router.route("/deleteUsersTaller/:idUserTaller").delete(deleteUsersTaller);

router.route("/generateMail").post(createSendEmail);

module.exports = router;
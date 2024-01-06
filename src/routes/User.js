const { Router } = require("express");
const router = Router();
const auth = require("../middleware/auth");

const {
  createUser,
  createTeacher,
  getUser,
  signInUser,
  signOutUser,
  editUser,
  uploadFile,
  userFirebaseSign,
  resetPasswordUserSession,
  generateCodeResetPassword,
  verifyResetPassword,
  getTeachers,
  registerTeacherUser,
  getUsers,
  deleteInscriptionCourse
} = require("../controllers/User.controllers");

router.route("/firebase").post(userFirebaseSign);

router.route("/").post(createUser).get(auth, getUsers);

router.route("/:idUser/teacher").put(createTeacher);

router.route("/:idUser").get(getUser).put(auth, uploadFile, editUser);

router.route("/signIn").post(signInUser);

router.route("/signOut").post(signOutUser);

router.route("/reset/password/:idUser").put(auth, resetPasswordUserSession);

router.route("/generate/reset/pass").post(generateCodeResetPassword);

router.route("/verify/:keyBlackList").put(verifyResetPassword);

router.route("/action/teacher/").get(auth,getTeachers).post(auth,registerTeacherUser);

router.route("/inscription/remove/:idInscription").delete(auth,deleteInscriptionCourse);

module.exports = router;

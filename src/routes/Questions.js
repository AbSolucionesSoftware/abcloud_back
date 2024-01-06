const { Router } = require("express");
const router = Router();
const auth = require("../middleware/auth");

const {
  getQuestions,
  createQuestion,
  editQuestion,
  deleteQuestion,
  addAnswerToQuestion,
  editAnswerToQuestion,
  deleteAnswerToQuestion,
  AnswersUserCourseUniline,
  AllAnswersUser
} = require("../controllers/Questions.controllers");

router.route("/").post(auth,createQuestion).get(getQuestions);

router
  .route("/:idQuestion")
  .put(auth,editQuestion)
  .delete(auth,deleteQuestion);

router
  .route("/:idQuestion/answer/:idAnswer")
  .post(auth,addAnswerToQuestion)
  .put(auth,editAnswerToQuestion)
  .delete(auth,deleteAnswerToQuestion);

router.route("/user/answers/all").get(auth,AllAnswersUser);

router.route("/answers/course/:idCourse/user/:idUser").post(auth,AnswersUserCourseUniline)

module.exports = router;

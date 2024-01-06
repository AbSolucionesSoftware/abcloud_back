const { Router } = require("express");
const router = Router();
const auth = require("../middleware/auth");

const {
  createCommentCourse,
  getCommentsCourse,
  editCommentCourse,
  deleteCommentCourse,
  createAnswerCommentCourse,
  editAnswerCommentCourse,
  deleteAnswerCommentCourse,
  aggregateLikesComment,
  aggregateDislikesComment,
  aggregateLikesCommentAnswer,
  aggregateDislikesCommentAnswer,
  createAnswerToComment,
  editAnswerToComment,
  deleteAnswerToComment,
  getAnswerToComment,
  createReaction,
  getReactions,
  getQualificationCourse
} = require("../controllers/Comment.controllers");

//comentarios a comentarios de calificacion

router.route("/answerQualification/create/:idCourse/:idUser/:idComment").post(auth, createAnswerToComment);
router.route("/answerQualification/edit/:idUser/:idAnswer").put(auth, editAnswerToComment);
router.route("/answerQualification/delete/:idUser/:idAnswer").delete(auth, deleteAnswerToComment);
router.route("/answerQualification/get/:idComment").get(getAnswerToComment);
router.route("/qualification/get/:idCourse").get(getQualificationCourse);

//reaciones a comentarios/respuestas
router.route("/reaction/create/:idCourse/:idUser/:idComment").post(auth, createReaction);
router.route("/reaction/get/:idComment/:idUser").get(getReactions);

router.route("/course/:idCourse").get(getCommentsCourse);

router.route("/:idComment").put(editCommentCourse).delete(deleteCommentCourse);

//comentarios de curso (dashboard)

router.route("/:idCourse/user/:idUser").post(auth, createCommentCourse);

router.route("/course/:idCourse").get(getCommentsCourse);

router.route("/:idComment").put(editCommentCourse).delete(deleteCommentCourse);

router.route('/:idComment/answer/:idUser/new-answer/').post(createAnswerCommentCourse);

router.route('/:idComment/user/answer/:idAnswer/edit-answer/').put(editAnswerCommentCourse).delete(deleteAnswerCommentCourse);

router.route('/:idComment/like').put(aggregateLikesComment);

router.route('/:idComment/dislike').put(aggregateDislikesComment);

router.route('/:idComment/answer/:idAnswer/like').put(aggregateLikesCommentAnswer);

router.route('/:idComment/answer/:idAnswer/dislike').put(aggregateDislikesCommentAnswer);

module.exports = router;

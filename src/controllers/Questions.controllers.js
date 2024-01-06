const questionCtrl = {};
const QuestionModel = require("../models/Question");
const AnswersModel = require("../models/Answers");
const AnswersModelResponseModel = require("../models/AnswesUserCourse");
const inscriptionCourse = require("../models/Inscription");
const UserModel = require("../models/User");
const CourseModel = require("../models/Course");

questionCtrl.getQuestions = async (req, res) => {
  try {
    const questions = await QuestionModel.find();
    let data = [];
    for (let i = 0; i < questions.length; i++) {
      const ansQuestion = await AnswersModel.find().where({
        idQuestion: questions[i]._id,
      }).sort({createdAt: -1});
      data.push({
        question: questions[i],
        answers: ansQuestion,
      });
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

questionCtrl.createQuestion = async (req, res) => {
  try {
    const newQuestion = new QuestionModel(req.body);
    const questions = await QuestionModel.find();
    newQuestion.preference = questions.length + 1;
    await newQuestion.save();
    res.status(200).json({
      message: "Pregunta agregada.",
    });
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

questionCtrl.editQuestion = async (req, res) => {
  try {
    const idQuestion = req.params.idQuestion;
    const questionBase = await QuestionModel.findById(idQuestion);
    if (!questionBase)
      return req.status(404).json({
        message: "Esta pregunta no existe.",
      });
    await QuestionModel.findByIdAndUpdate(idQuestion, req.body);
    res.status(200).json({ message: "Pregunta editada." });
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

questionCtrl.deleteQuestion = async (req, res) => {
  try {
    const idQuestion = req.params.idQuestion;
    const questionBase = await QuestionModel.findById(idQuestion);
    if (!questionBase)
      return req.status(404).json({
        message: "Esta pregunta no existe.",
      });
    await QuestionModel.findByIdAndDelete(idQuestion);
    const answers = await AnswersModel.find().where({ idQuestion: idQuestion });
    if (answers.length > 0) {
      answers.map(async (a) => await AnswersModel.findByIdAndDelete(a.id));
    }
    res.status(200).json({
      message: "Pregunta eliminada",
    });
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

questionCtrl.addAnswerToQuestion = async (req, res) => {
  try {
    // const idAnswer = req.params.idAnswer;
    const idQuestion = req.params.idQuestion;
    const data = await AnswersModel.find();
    const newAnswer = new AnswersModel(req.body);
    newAnswer.preference = data && data.length > 0 ? data.length + 1 : 1;
    newAnswer.idQuestion = idQuestion;
    await newAnswer.save();
    res.status(200).json({
      message: "Respuesta agregada.",
    });
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

questionCtrl.editAnswerToQuestion = async (req, res) => {
  try {
    const idAnswer = req.params.idAnswer;
    const answerData = await AnswersModel.findById(idAnswer);
    if (!answerData)
      return res.status(404).json({
        message: "Respuesta no encontrada",
      });
    await AnswersModel.findByIdAndUpdate(idAnswer, req.body);
    res.status(200).json({
      message: "Respuesta editada.",
    });
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

questionCtrl.deleteAnswerToQuestion = async (req, res) => {
  try {
    const idAnswer = req.params.idAnswer;
    const answerData = await AnswersModel.findById(idAnswer);
    if (!answerData)
      return res.status(404).json({
        message: "Respuesta no encontrada",
      });
    await AnswersModel.findByIdAndDelete(idAnswer, req.body);
    res.status(200).json({
      message: "Respuesta eliminada.",
    });
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

questionCtrl.AnswersUserCourseUniline = async (req, res) => {
  try {
    const idUser = req.params.idUser;
    const idCourse = req.params.idCourse;
    const dataPro = await Promise.all([
      await AnswersModelResponseModel.find().where({
        idUser: idUser,
        idCurso: idCourse,
      }),
      await inscriptionCourse.findOne().where({
        idCourse: idCourse,
        idUser: idUser,
      }),
      await UserModel.findById(idUser),
      await CourseModel.findById(idCourse),
    ]);
    if (
      !dataPro &&
      dataPro.length <= 0 &&
      !dataPro[1] &&
      !dataPro[2] &&
      !dataPro[3]
    )
      return res.status(404).json({ message: "No encontrado" });
    const data = req.body;
    // data.map( a => console.table(a))
    if (dataPro[0].length > 0 || dataPro[1].questionUniline)
      return res.status(500).json({ message: "Encuentas ya contestada" });
    const aswersAll = data.map((answer) =>
      new AnswersModelResponseModel({
        idQuestion: answer.idQuestion,
        idCurso: answer.idCurso,
        answer: answer.answer,
        textQuestion: answer.textQuestion,
        idUser,
        nameCurso: dataPro[3].title,
        nameUser: dataPro[2].name,
        ageUser: dataPro[2].age,
        emailUser: dataPro[2].email,
        professionUser: dataPro[2].profession,
        phoneUser: dataPro[2].phone,
      }).save()
    );
    await Promise.all([
      ...aswersAll,
      inscriptionCourse.findByIdAndUpdate(dataPro[1]._id, {
        questionUniline: true,
      }),
    ]);
    res.status(200).json({ message: "success" });
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

questionCtrl.AllAnswersUser = async (req, res) => {
  try {
    const search = req.query.search;
    console.log(search);
    if (!search)
      return res.status(200).json(await AnswersModelResponseModel.find());
    const match = [
      { nameCurso: { $regex: ".*" + search + ".*", $options: "i" } },
      { nameUser: { $regex: ".*" + search + ".*", $options: "i" } },
      { ageUser: { $regex: ".*" + search + ".*", $options: "i" } },
      { emailUser: { $regex: ".*" + search + ".*", $options: "i" } },
      { phoneUser: { $regex: ".*" + search + ".*", $options: "i" } },
      { professionUser: { $regex: ".*" + search + ".*", $options: "i" } },
      { textQuestion: { $regex: ".*" + search + ".*", $options: "i" } },
      { answer: { $regex: ".*" + search + ".*", $options: "i" } },
    ];
    const searchDB = await AnswersModelResponseModel.aggregate([
      { $match: { $or: match } },
    ]);
    return res.status(200).json(searchDB);
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

module.exports = questionCtrl;

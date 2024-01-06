const commentCtrl = {};
const modelComment = require("../models/Comment");
const ModelCommentCourse = require("../models/CommentCourse");
const sendEmail = require("../middleware/sendEmail");
const modelCourse = require("../models/Course");
const modelUser = require("../models/User");
const ModelAnswerQ = require("../models/ReplyCommentCourse");
const ModelReaction = require("../models/Reactions");
const InscriptionModel = require("../models/Inscription");
const moment = require("moment");
const mongoose = require("mongoose");

commentCtrl.getCommentsCourse = async (req, res) => {
  try {
    const { idTopic = "" } = req.query;
    var match = {};
    if (idTopic) {
      match = { idCourse: req.params.idCourse, idTopic: idTopic };
    } else {
      match = { idCourse: req.params.idCourse };
    }
    const comment = await modelComment
      .find(match)
      .populate("idUser idCourse")
      .populate({ path: "answers.idUser", model: "user" })
      .sort({ createdAt: -1 });
    res.status(200).json(comment);
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

async function enviarCorreo(usuario, curso, comentario, type) {
  try {
    moment.locale("es");

    const htmlContentUser = `
            <br/>
            <h5 style="font-family: sans-serif; margin: 15px 15px;">
            ${
              type === "comentario"
                ? `Tines un nuevo comentario en ${curso.title} `
                : `Tines una nueva respuesta de ${usuario.name}`
            }
            </h5>
            <h5 style="font-family: sans-serif; margin: 15px 15px;">
                ${usuario.name} espera tu respuesta
            </h5>
            <div>
                <div
                    style="
                    -webkit-box-shadow: -3px 4px 21px 0px rgba(0,0,0,0.75);
                    -moz-box-shadow: -3px 4px 21px 0px rgba(0,0,0,0.75);
                    box-shadow: -3px 4px 21px 0px rgba(0,0,0,0.75);"
                >   
                    <div style="display: flex;">
                        <div>
                            <h5 style="font-family: sans-serif; margin: 15px 15px;">
                                ${usuario.name}
                            </h5>
                            <h5 style="font-family: sans-serif; margin: 15px 15px;" >
                                ${moment().format("D MMMM YYYY")}
                            </h5>
                        </div>
                    </div>
                    <br />
                    <div style="margin: 15px 15px;">
                        "${comentario}"
                    </div>
                    <br/>
                    <div style="margin: 15px 15px;">
                        <a rel="noreferrer" target="_blank" href="https://uniline.online/dashboard/${
                          curso.slug
                        }" >
                            <button
                                style="
                                    text-decoration: none;
                                    padding: 5px;
                                    font-weight: 600;
                                    font-size: 15px;
                                    color: #ffffff;
                                    background-color: #1883ba;
                                    border-radius: 5px;
                                    border: 2px solid #0016b0;
                                "
                            >
                                Responder
                            </button>
                        </a>
                    </div>
                </div>
            </div>
        `;
    if (type === true) {
      await sendEmail.sendEmail(
        curso.idProfessor.email,
        "Tienes un nuevo comentario en tu curso",
        htmlContentUser,
        "Uniline"
      );
    } else {
      const profesor = await modelUser.findById(curso.idCourse.idProfessor);
      await sendEmail.sendEmail(
        profesor.email,
        "Tienes una nueva repuesta a un comentario",
        htmlContentUser,
        "Uniline"
      );
    }
  } catch (error) {
    console.log(error);
  }
}

async function enviarCorreoRespuesta(usuario, curso, comentario) {
  try {
    moment.locale("es");

    const htmlContentUser = `
            <br/>
            <h5 style="font-family: sans-serif; margin: 15px 15px;">
                Hay una nueva respuesta en el comentario del curso ${
                  curso.idCourse.title
                }
            </h5>
            <div>
                <div
                    style="
                    -webkit-box-shadow: -3px 4px 21px 0px rgba(0,0,0,0.75);
                    -moz-box-shadow: -3px 4px 21px 0px rgba(0,0,0,0.75);
                    box-shadow: -3px 4px 21px 0px rgba(0,0,0,0.75);"
                >   
                    <div style="display: flex;">
                        <div>
                            <h5 style="font-family: sans-serif; margin: 15px 15px;">
                                ${usuario.name}
                            </h5>
                            <h5 style="font-family: sans-serif; margin: 15px 15px;" >
                                ${moment().format("D MMMM YYYY")}
                            </h5>
                        </div>
                    </div>
                    <br />
                    <div style="margin: 15px 15px;">
                        "${comentario}"
                    </div>
                    <br/>
                    <div style="margin: 15px 15px;">
                        <a rel="noreferrer" target="_blank" href="https://uniline.online/dashboard/${
                          curso.idCourse.slug
                        }" >
                            <button
                                style="
                                    text-decoration: none;
                                    padding: 5px;
                                    font-weight: 600;
                                    font-size: 15px;
                                    color: #ffffff;
                                    background-color: #1883ba;
                                    border-radius: 5px;
                                    border: 2px solid #0016b0;
                                "
                            >
                                Responder
                            </button>
                        </a>
                    </div>
                </div>
            </div>
        `;
    const profesor = await modelUser.findById(curso.idCourse.idProfessor);
    await sendEmail.sendEmail(
      profesor.email,
      "Respondieron al comentario que comentaste",
      htmlContentUser,
      "Uniline"
    );
  } catch (error) {
    console.log(error);
  }
}

commentCtrl.createCommentCourse = async (req, res) => {
  try {
    const newComment = new modelComment(req.body);

    const curso = await modelCourse
      .findById(req.params.idCourse)
      .populate("idProfessor");
    const usuario = await modelUser.findById(req.params.idUser);
    await enviarCorreo(usuario, curso, req.body.comment, true);

    newComment.idCourse = req.params.idCourse;
    newComment.idUser = req.params.idUser;
    newComment.likes = 0;
    newComment.dislikes = 0;
    await newComment.save();
    res.status(200).json({ message: "Comentario agregado." });
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

commentCtrl.editCommentCourse = async (req, res) => {
  try {
    const { comment } = req.body;
    await modelComment.findByIdAndUpdate(req.params.idComment, {
      comment: comment,
    });
    res.status(200).json({ message: "Comentario editado" });
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

commentCtrl.deleteCommentCourse = async (req, res) => {
  try {
    const deleteComent = await modelComment.findById(req.params.idComment);
    if (deleteComent) {
      await modelComment.findByIdAndDelete(req.params.idComment);
      res.status(200).json({ message: "Comentario eliminado" });
    } else {
      res.status(200).json({ message: "Este comentario no existe. " });
    }
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

commentCtrl.createAnswerCommentCourse = async (req, res) => {
  try {
    const { comment } = req.body;
    const usuario = await modelUser.findById(req.params.idUser);
    const curso = await modelComment
      .findById(req.params.idComment)
      .populate("idCourse");
    const profesor = await modelUser.findById(curso.idCourse.idProfessor);
    const comentario = await modelComment
      .findById(req.params.idComment)
      .populate("idUser");

    let respuestas = comentario.answers;
    let usuariosAnswers = [];
    let result = [];
    let resultadosIds = [];
    // if (comentario.idUser._id === profesor._id ) {
    //     await enviarCorreoRespuesta(user, curso, comment);
    // }else{
    //     // correo al usuario creador y al; profesor
    // }

    // for (let i = 0; i < respuestas.length; i++) {
    //     usuariosAnswers.push(respuestas[i].idUser.toString())
    // };

    // usuariosAnswers.forEach((item)=>{
    //     if(!result.includes(item)){
    //         result.push(item);
    //         resultadosIds.push({item});
    //     }
    // });

    // console.log(resultadosIds);

    // for (let i = 0; i < resultadosIds.length; i++) {
    //     const element = resultadosIds[i];
    //     const user = await modelUser.findById(element.item);
    //     if (comentario.idUser._id === profesor._id ) {

    //     }else{
    //         // await enviarCorreoRespuesta(user, curso, comment);
    //     }
    // }

    await modelComment.updateOne(
      {
        _id: req.params.idComment,
      },
      {
        $addToSet: {
          answers: [
            {
              comment: comment,
              idUser: req.params.idUser,
              createComment: new Date(),
              editComment: new Date(),
              likes: 0,
              dislikes: 0,
            },
          ],
        },
      },
      async (err, response) => {
        if (err) {
          res
            .status(500)
            .json({ message: "Ups, algo al agregar respuesta.", err });
        } else {
          if (!response) {
            res.status(404).json({ message: "Error al guardar" });
          } else {
            res.status(200).json({ message: "Comentario agregado." });
          }
        }
      }
    );
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

commentCtrl.editAnswerCommentCourse = async (req, res) => {
  try {
    const commentBase = await modelComment.findById(req.params.idComment);
    const answer = commentBase.answers.filter(
      (x) => x._id == req.params.idAnswer
    );
    answer.map(async (answer) => {
      const { comment } = req.body;
      await modelComment.updateOne(
        {
          "answers._id": req.params.idAnswer,
        },
        {
          $set: {
            "answers.$": {
              comment: comment,
              idUser: answer.idUser,
              likes: answer.likes,
              dislikes: answer.dislikes,
              createComment: answer.createComment,
              editComment: new Date(),
            },
          },
        },
        async (err, response) => {
          if (err) {
            res
              .status(500)
              .json({ message: "Ups algo paso al actualizar", err });
          } else {
            if (!response) {
              res
                .status(404)
                .json({ message: "Ups, algo paso al actualizar." });
            } else {
              res.status(200).json({ message: "Comentario actualizado." });
            }
          }
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

commentCtrl.deleteAnswerCommentCourse = async (req, res) => {
  try {
    await modelComment.updateOne(
      {
        _id: req.params.idComment,
      },
      {
        $pull: {
          answers: {
            _id: req.params.idAnswer,
          },
        },
      },
      (err, response) => {
        if (err) {
          res.status(500).json({ message: "Ups, algo paso en la base", err });
        } else {
          if (!response) {
            res.status(404).json({ message: "Algo paso al eliminar" });
          } else {
            res.status(200).json({ message: "Comentario eliminado." });
          }
        }
      }
    );
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

commentCtrl.aggregateLikesComment = async (req, res) => {
  try {
    const commentBase = await modelComment.findById(req.params.idComment);
    var likesBase = parseInt(commentBase.likes);
    await modelComment.findByIdAndUpdate(req.params.idComment, {
      likes: likesBase + 1,
    });
    res.status(200).json({ message: "Like agregado." });
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

commentCtrl.aggregateDislikesComment = async (req, res) => {
  try {
    const commentBase = await modelComment.findById(req.params.idComment);
    var dislikesBase = parseInt(commentBase.dislikes);
    await modelComment.findByIdAndUpdate(req.params.idComment, {
      dislikes: dislikesBase + 1,
    });
    res.status(200).json({ message: "Dislike agregado." });
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

commentCtrl.aggregateLikesCommentAnswer = async (req, res) => {
  try {
    const commentBase = await modelComment.findById(req.params.idComment);
    const answer = commentBase.answers.filter(
      (x) => x._id == req.params.idAnswer
    );
    answer.map(async (answer) => {
      var likeMore = parseInt(answer.likes) + 1;
      await modelComment.updateOne(
        {
          "answers._id": req.params.idAnswer,
        },
        {
          $set: {
            "answers.$": {
              comment: answer.comment,
              idUser: answer.idUser,
              likes: likeMore,
              dislikes: answer.dislikes,
              createComment: answer.createComment,
              editComment: new Date(),
            },
          },
        },
        async (err, response) => {
          if (err) {
            res
              .status(500)
              .json({ message: "Ups algo paso al actualizar", err });
          } else {
            if (!response) {
              res
                .status(404)
                .json({ message: "Ups, algo paso al actualizar." });
            } else {
              res.status(200).json({ message: "Comentario actualizado." });
            }
          }
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

commentCtrl.aggregateDislikesCommentAnswer = async (req, res) => {
  try {
    const commentBase = await modelComment.findById(req.params.idComment);
    const answer = commentBase.answers.filter(
      (x) => x._id == req.params.idAnswer
    );
    answer.map(async (answer) => {
      var disLikeMore = parseInt(answer.dislikes) + 1;
      await modelComment.updateOne(
        {
          "answers._id": req.params.idAnswer,
        },
        {
          $set: {
            "answers.$": {
              comment: answer.comment,
              idUser: answer.idUser,
              likes: answer.likes,
              dislikes: disLikeMore,
              createComment: answer.createComment,
              editComment: new Date(),
            },
          },
        },
        async (err, response) => {
          if (err) {
            res
              .status(500)
              .json({ message: "Ups algo paso al actualizar", err });
          } else {
            if (!response) {
              res
                .status(404)
                .json({ message: "Ups, algo paso al actualizar." });
            } else {
              res.status(200).json({ message: "Comentario actualizado." });
            }
          }
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

/* calificacines y comentaris curso */

//Fórmula usada: (100 / totalComents ) * V1 = (100 / 2) * 2

commentCtrl.getQualificationCourse = async (req, res) => {
  try {
    const { idCourse } = req.params;
    const commentCourse = await ModelCommentCourse.aggregate([
      {
        $match: { idCourse: mongoose.Types.ObjectId(idCourse) },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          five: {
            $sum: {
              $cond: [
                {
                  $gte: ["$qualification", 5],
                },
                1,
                0,
              ],
            },
          },
          four: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$qualification", 4] },
                    { $lt: ["$qualification", 5] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          three: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$qualification", 3] },
                    { $lt: ["$qualification", 4] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          two: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$qualification", 2] },
                    { $lt: ["$qualification", 3] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          one: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$qualification", 1] },
                    { $lt: ["$qualification", 2] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          zero: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$qualification", 0] },
                    { $lt: ["$qualification", 1] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);
    res.status(200).json({ commentCourse });
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

/* respuessta a comentarios de calificacion del curso */

commentCtrl.getAnswerToComment = async (req, res) => {
  try {
    const { idComment } = req.params;
    const { page, limit } = req.query;

    const options = {
      page,
      limit,
      populate: [{ path: "idUser" }, { path: "idCourse" }],
    };

    const answer = await ModelAnswerQ.paginate(
      {
        idComment: mongoose.Types.ObjectId(idComment),
      },
      options
    );

    res.status(200).json(answer);
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

commentCtrl.createAnswerToComment = async (req, res) => {
  try {
    const { idUser, idComment, idCourse } = req.params;
    //verificar que usuario este inscrito al curso
    const inscription = await InscriptionModel.findOne({
      idCourse,
      idUser,
    });
    if (!inscription) throw new Error("No esta inscrito en este curso");
    if (!req.body.answer) throw new Error("Tu respuesta no puede ir vacía");

    let newAnswer = new ModelAnswerQ({
      idComment,
      idCourse,
      idUser,
      answer: req.body.answer,
    });
    await newAnswer.save();

    const curso = await modelCourse.findById(idCourse).populate("idProfessor");
    const usuario = await modelUser.findById(idUser);

    newAnswer.idCourse = curso;
    newAnswer.idUser = usuario;
    newAnswer.createdAt = moment().locale("es-mx").format();

    if(usuario._id.equals(curso.idProfessor._id)){
      await enviarCorreoRespuestaVistaCurso(usuario, curso, req.body.answer);
    }
    res.status(200).json({ message: "Listo!", answer: newAnswer });
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

commentCtrl.editAnswerToComment = async (req, res) => {
  try {
    const { idUser, idAnswer } = req.params;
    const answerDB = await ModelAnswerQ.find({ _id: idAnswer, idUser });
    const { answer } = req.body;

    if (!answerDB) throw new Error("Tu respuesta no fue encontrada");
    if (!answer) throw new Error("No puedes enviar una respuesta vacía");
    let result = await ModelAnswerQ.findByIdAndUpdate(idAnswer, {
      answer,
    }).populate("idUser idCourse");
    result.answer = answer;
    res
      .status(200)
      .json({ message: "Listo, respuesta actualizada", answer: result });
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

commentCtrl.deleteAnswerToComment = async (req, res) => {
  try {
    const { idUser, idAnswer } = req.params;
    const answerDB = await ModelAnswerQ.find({ _id: idAnswer, idUser });

    if (!answerDB) throw new Error("Tu respuesta no encontrada");
    await ModelReaction.deleteMany({ idComment: idAnswer });
    await ModelAnswerQ.findByIdAndDelete(idAnswer);
    //ELIMINAR LAS REACCIONES
    res.status(200).json({ message: "Listo, tu respuesta fue eliminada" });
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

/* reacciones a del curso */

commentCtrl.getReactions = async (req, res) => {
  try {
    const { idComment, idUser } = req.params;
    let match = {
      idComment: mongoose.Types.ObjectId(idComment),
    };
    if (idUser !== "null") match.idUser = mongoose.Types.ObjectId(idUser);

    const userReaction = await ModelReaction.findOne(match);
    const reactions = await ModelReaction.aggregate([
      { $match: { idComment: mongoose.Types.ObjectId(idComment) } },
      {
        $group: {
          _id: null,
          loveit: {
            $sum: { $cond: [{ $eq: ["$reaction", "LOVEIT"] }, 1, 0] },
          },
          like: { $sum: { $cond: [{ $eq: ["$reaction", "LIKE"] }, 1, 0] } },
          dislike: {
            $sum: { $cond: [{ $eq: ["$reaction", "DISLIKE"] }, 1, 0] },
          },
        },
      },
    ]);
    let user_reaction = null;
    if (userReaction) user_reaction = userReaction.reaction;
    res.status(200).json({ reactions, user_reaction });
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

commentCtrl.createReaction = async (req, res) => {
  try {
    const { idUser, idComment, idCourse } = req.params;
    //verificar que usuario este inscrito al curso
    const inscription = await InscriptionModel.findOne({
      idCourse,
      idUser,
    });
    if (!inscription) throw new Error("No esta inscrito en este curso");
    const { reaction } = req.body;
    let user_reaction = reaction;
    //verificar la reaccion
    const reactionDB = await ModelReaction.findOne({ idComment, idUser });
    //si no tiene, se crea,
    if (!reactionDB) {
      const newReaction = new ModelReaction({
        reaction,
        idComment,
        idUser,
      });
      await newReaction.save();
    } else {
      if (reaction === reactionDB.reaction) {
        //si es la misma, se elimina,
        user_reaction = null;
        await ModelReaction.findByIdAndDelete(reactionDB._id);
      } else {
        //si es diferente, se edita
        await ModelReaction.findByIdAndUpdate(reactionDB._id, { reaction });
      }
    }
    //hacer el conteo nuevamente y enviar
    const reactions = await ModelReaction.aggregate([
      { $match: { idComment: mongoose.Types.ObjectId(idComment) } },
      {
        $group: {
          _id: null,
          loveit: {
            $sum: { $cond: [{ $eq: ["$reaction", "LOVEIT"] }, 1, 0] },
          },
          like: { $sum: { $cond: [{ $eq: ["$reaction", "LIKE"] }, 1, 0] } },
          dislike: {
            $sum: { $cond: [{ $eq: ["$reaction", "DISLIKE"] }, 1, 0] },
          },
        },
      },
    ]);
    res.status(200).json({ message: "Listo!", reactions, user_reaction });
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

async function enviarCorreoRespuestaVistaCurso(usuario, curso, comentario) {
  try {
    moment.locale("es");

    const htmlContentUser = `
            <br/>
            <h4 style="font-family: sans-serif; margin: 15px 15px;">
            ${`${usuario.name} respondió a tu comentario en "${curso.title}"`}
            </h4>
            <div>
                <div>   
                    <h5 style="font-family: sans-serif; margin: 4px 16px;">
                        ${usuario.name}
                    </h5>
                    <h5 style="font-family: sans-serif; margin: 4px 16px;" >
                        ${moment().format("D MMMM YYYY")}
                    </h5>
                    <div style="margin: 4px 16px; font-size: 18px;">
                        ${comentario}
                    </div>
                    <br/>
                    <div style="margin: 15px 15px;">
                        <a rel="noreferrer" target="_blank" href="https://uniline.online/curso/${
                          curso.slug
                        }" >
                            <button
                                style="
                                    text-decoration: none;
                                    padding: 5px 16px;
                                    font-weight: 600;
                                    font-size: 15px;
                                    color: #ffffff;
                                    background-color: #4e00a0;
                                    border-radius: 3px;
                                    border: 2px solid #4e00a0;
                                "
                            >
                                Ver en UNILINE
                            </button>
                        </a>
                    </div>
                </div>
            </div>
        `;
    await sendEmail.sendEmail(
      usuario.email,
      "Tienes una nueva repuesta a un comentario",
      htmlContentUser,
      "Uniline"
    );
  } catch (error) {
    console.log(error);
  }
}

module.exports = commentCtrl;

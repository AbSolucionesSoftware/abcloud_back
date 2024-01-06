const notificationCtrl = {};
const modelUser = require("../models/User");
const modelCourse = require("../models/Course");
const modelInscription = require("../models/Inscription");
const uploadFileAws = require("../middleware/awsFile");
const NotificationModel = require("../models/Notification");
const moment = require("moment");
const FCMNotificationCtrl = require("../middleware/FcmSend");

notificationCtrl.uploadFile = async (req, res, next) => {
  try {
    await uploadFileAws.upload(req, res, function (err) {
      if (err) {
        res.status(500).json({ message: err });
      }
      return next();
    });
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

notificationCtrl.uploadFileMultiple = async (req, res, next) => {
  try {
    await uploadFileAws.uploadMultiple(req, res, function (err) {
      if (err) {
        res.status(500).json({ message: err });
      }
      return next();
    });
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

notificationCtrl.getNotifications = async (req, res) => {
  try {
    const notifications = await NotificationModel.aggregate([
      {
        $sort: { date_send: -1 },
      },
      {
        $match: {
          $or: [{ sended: true }, { isModal: true }],
        },
      },
    ]);
    const inscriptions = await modelInscription.find({
      idUser: req.params.idUser,
    });

    //comparar inscripciones con las notificaciones
    //sacar solor ids para comparar
    const notsCourse = notifications.map((res) => res.id_course);
    const userCourse = inscriptions.map((res) => res.idCourse);
    //descartar el curso que no existe y saca el que existe en notifications model
    const notsExist = [];
    userCourse.forEach((element) => {
      if (notsCourse.indexOf(element.toString()) !== -1) {
        notsExist.push(element.toString());
      }
    });
    //obtener las notificaciones que son para el usuario
    const userNots = notifications.filter(
      (nots) => notsExist.indexOf(nots.id_course) !== -1
    );
    //obtener las notificaciones generales
    const notsGeneral = notifications.filter((nots) => !nots.id_course);

    const finalNotifications = [...userNots, ...notsGeneral].sort(
      (a, b) => moment(b.date_send) - moment(a.date_send)
    );
    res.status(200).json(finalNotifications);
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

notificationCtrl.getNotificationsAdmin = async (req, res) => {
  try {
    const notifications = await NotificationModel.find({ admin: true }).sort({
      create_date: -1,
    });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

notificationCtrl.getNotificationsTeacher = async (req, res) => {
  try {
    const notifications = await NotificationModel.find({
      id_teacher: req.params.idTeacher,
      id_course: req.params.idCourse,
      admin: false,
    }).sort({
      create_date: -1,
    });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

notificationCtrl.createModal = async (req, res) => {
  const {
    title,
    description,
    url,
    id_course,
    id_teacher,
    teacher_name,
  } = req.body;
  try {
    let images = false;

    if (req.files.length > 1) {
      images = true;
    }
    const newNotification = new NotificationModel({
      title,
      description,
      url,
      image: images ? req.files[0].location : "",
      key_image: images ? req.files[0].key : "",
      image_devices: images ? req.files[1].location : "",
      key_image_devices: images ? req.files[1].key : "",
      id_course,
      id_teacher,
      teacher_name,
      admin: true,
      sended: true,
      general: true,
      isModal: true,
      date_send: moment().locale("es-mx").format(),
      create_date: moment().locale("es-mx").format(),
    });

    //si se es esviada crear la push
    let notificationToSend = {
      title: newNotification.title,
      description: newNotification.description,
      image: newNotification.image,
      url: newNotification.url,
      id_course: newNotification.id_course,
      id_teacher: newNotification.id_teacher,
      teacher_name: newNotification.teacher_name,
      key_image: newNotification.key_image,
      image_devices: newNotification.image_devices,
      key_image_devices: newNotification.key_image_devices,
      sended: newNotification.sended,
      admin: newNotification.admin,
      general: newNotification.general,
      isModal: newNotification.isModal,
      date_send: newNotification.date_send,
    };
    await sendNotification(notificationToSend);
    await NotificationModel.updateMany({ isModal: false });
    await newNotification.save();
    if (newNotification.sended) {
      res.status(200).json({ message: "Modal enviado" });
    } else {
      res.status(200).json({ message: "Modal guardado" });
    }
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

notificationCtrl.createNotification = async (req, res) => {
  const {
    title,
    description,
    url,
    id_course,
    admin,
    general,
    sended,
    id_teacher,
    teacher_name,
    isModal,
  } = req.body;
  try {
    const newNotification = new NotificationModel({
      title,
      description,
      url,
      image: req.file ? req.file.location : "",
      key_image: req.file ? req.file.key : "",
      id_course,
      id_teacher,
      teacher_name,
      admin: admin === "true" ? true : false,
      sended: sended === "true" ? true : false,
      general: general === "true" ? true : false,
      isModal: isModal === "true" ? true : false,
      date_send: sended === "true" ? moment().locale("es-mx").format() : "",
      create_date: moment().locale("es-mx").format(),
    });

    //si se es esviada crear la push
    let notificationToSend = {
      title: newNotification.title,
      description: newNotification.description,
      image: newNotification.image,
      url: newNotification.url,
      id_course: newNotification.id_course,
      id_teacher: newNotification.id_teacher,
      teacher_name: newNotification.teacher_name,
      key_image: newNotification.key_image,
      sended: newNotification.sended,
      admin: newNotification.admin,
      general: newNotification.general,
      isModal: newNotification.isModal,
      date_send: newNotification.date_send,
    };
    if (newNotification.sended) {
      await sendNotification(notificationToSend);
    }

    await newNotification.save();
    if (newNotification.sended) {
      res.status(200).json({ message: "Notificación enviada" });
    } else {
      res.status(200).json({ message: "Notificación guardada" });
    }
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

notificationCtrl.editNotification = async (req, res) => {
  let edit_data = { ...req.body };
  edit_data.sended = edit_data.sended === "true";
  edit_data.admin = edit_data.admin === "true";
  edit_data.general = edit_data.general === "true";
  edit_data.date_send =
    edit_data.sended === "true" ? moment().locale("es-mx").format() : "";

  try {
    const notificationBase = await NotificationModel.findById(
      req.params.idNotification
    );
    if (notificationBase) {
      if (req.file) {
        //si hay imagen que editar
        if (notificationBase.key_image) {
          uploadFileAws.eliminarImagen(notificationBase.key_image);
        }
        const { key, location } = req.file;
        edit_data.image = location;
        edit_data.key_image = key;
      } else {
        //si no hay imagen y existe en aws, eliminar
        if (notificationBase.key_image) {
          uploadFileAws.eliminarImagen(notificationBase.key_image);
        }
        edit_data.image = "";
        edit_data.key_image = "";
      }
    } else {
      res.status(404).json({ message: "Esta notificación no existe" });
    }

    //si sended es TRUE enviar correo
    let notificationToSend = {
      title: notificationBase.title,
      description: notificationBase.description,
      image: notificationBase.image,
      url: notificationBase.url,
      id_course: notificationBase.id_course,
      id_teacher: notificationBase.id_teacher,
      teacher_name: notificationBase.teacher_name,
      key_image: notificationBase.key_image,
      sended: edit_data.sended,
      admin: edit_data.admin,
      general: edit_data.general,
      isModal: edit_data.isModal,
      date_send: edit_data.date_send,
    };
    if (edit_data.sended) {
      await sendNotification(notificationToSend);
    }

    await NotificationModel.findByIdAndUpdate(notificationBase._id, edit_data);
    if (edit_data.sended) {
      res.status(200).json({ message: "Notificación enviada" });
    } else {
      res.status(200).json({ message: "Notificación guardada" });
    }
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

notificationCtrl.createAsModal = async (req, res) => {
  try {
    const notificationBase = await NotificationModel.findById(
      req.params.idNotification
    );
    //si sended es TRUE enviar correo
    await NotificationModel.findByIdAndUpdate(notificationBase._id, {
      isModal: !notificationBase.isModal,
      sended: false,
      date_send: "",
    });
    await NotificationModel.updateMany(
      { _id: { $ne: notificationBase._id } },
      { isModal: false }
    );
    res.status(200).json({ message: "Actualizado" });
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

notificationCtrl.sendNotification = async (req, res) => {
  try {
    //enviar notificacion
    const notification = await NotificationModel.findById(
      req.params.idNotification
    );
    let notificationToSend = {
      title: notification.title,
      description: notification.description,
      image: notification.image,
      url: notification.url,
      id_course: notification.id_course,
      id_teacher: notification.id_teacher,
      teacher_name: notification.teacher_name,
      key_image: notification.key_image,
      sended: notification.sended,
      admin: notification.admin,
      general: notification.general,
      isModal: notification.isModal,
      date_send: notification.date_send,
    };
    await sendNotification(notificationToSend);
    await NotificationModel.findByIdAndUpdate(req.params.idNotification, {
      sended: true,
      date_send: moment().locale("es-mx").format(),
    });
    res.status(200).json({ message: "Notificación enviada" });
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

notificationCtrl.deleteNotification = async (req, res) => {
  try {
    const notificationBase = await NotificationModel.findById(
      req.params.idNotification
    );
    if (!notificationBase) {
      res.status(404).json({ message: "Este notification no existe.", error });
    } else {
      //eliminar imagen del bucker
      if (notificationBase.key_image) {
        uploadFileAws.eliminarImagen(notificationBase.key_image);
      }
      if (notificationBase.key_image_devices) {
        uploadFileAws.eliminarImagen(notificationBase.key_image_devices);
      }
      await NotificationModel.findByIdAndDelete(notificationBase._id);
      res.status(200).json({ message: "Notificación eliminada" });
    }
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

async function sendNotification(notification) {
  if (notification.general) {
    //para publico general
    //traer usuarios con token existentes
    const users = await modelUser.find({
      messagingTokens: { $exists: true, $not: { $size: 0 } },
    });
    //sacar array de tokens
    let tokens = [];
    users.forEach((user) => {
      user.messagingTokens.forEach((token) => {
        tokens.push(token.token);
      });
    });
    //sacar slug si es que redirecciona a un curso
    const isSlug = notification.url.split("/curso/");
    notification.isSlug = isSlug.length === 2 ? isSlug[1] : isSlug[0];
    let dataCurso = null;
    if (isSlug.length > 1) {
      dataCurso = await modelCourse
        .findOne({ slug: isSlug[1] })
        .populate("idProfessor");
      notification.dataCurso = dataCurso;
    }
    await FCMNotificationCtrl.sendFCMNotification(tokens, notification);
  } else {
    //usuarios de un curso
    const inscrpUsers = await modelInscription.find(
      { idCourse: notification.id_course },
      { idUser: 1 }
    );
    //sacar solo ids de ambos arrays
    const usersInsc = inscrpUsers.map((res) => res.idUser.toString());
    //obtener solo los usuarios con tokens
    const users = await modelUser.find({
      messagingTokens: { $exists: true, $not: { $size: 0 } },
    });
    //array de usuarios finales
    const finalUsers = users.filter(
      (user) => usersInsc.indexOf(user._id.toString()) !== -1
    );
    //sacar solo sus tokens
    const tokens = [];
    finalUsers.forEach((user) => {
      user.messagingTokens.forEach((token) => {
        tokens.push(token.token);
      });
    });
    //sacar slug si es que redirecciona a un curso
    const isSlug = notification.url.split("/curso/");
    notification.isSlug = isSlug.length === 2 ? isSlug[1] : isSlug[0];
    //obtener datos del curso
    const curso = await modelCourse
      .findById(notification.id_course)
      .populate("idProfessor");
    notification.dataCurso = curso;

    await FCMNotificationCtrl.sendFCMNotification(tokens, notification);
  }
}

module.exports = notificationCtrl;

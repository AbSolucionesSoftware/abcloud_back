const notificationCtrl = {};
const modelCourse = require("../models/Course");
const uploadFileAws = require("../middleware/awsFile");
const TemplatesModel = require("../models/HomeTemplates");
const {
  getLatestCourses,
  getCursosByCategory,
} = require("./Course.controllers");
const { getBanners } = require("./Banner.controllers");

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

notificationCtrl.getTemplatesHome = async (req, res, next) => {
  try {
    const templatesBD = await TemplatesModel.find().sort({ order_template: 1 });
    if (templatesBD.length) {
        console.log(templatesBD);
    } else {
    //cursos recientes
    const latest = await getLatestCourses(req, res, next, true);
    //cursos x categorias
    const byCategory = await getCursosByCategory(req, res, next, true);
    //banner
    const banner = await getBanners(req, res, next, true);
    res.status(200).json({
      latest,
      byCategory,
      banner,
    });
    }
    //res.status(200).json("array");
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

notificationCtrl.getTemplatesAdmin = async (req, res) => {
  try {
    const templates = await TemplatesModel.find().sort({
      order_template: 1,
    });
    const courses = await modelCourse.find({ publication: true });
    const categories = await modelCourse.aggregate([
      {
        $match: { publication: true },
      },
      {
        $group: { _id: "$category"}
      },
      {
        $project: { _id: 0, category: "$_id" }
      },
      { $sort: { category: 1 } },
    ]);
    res.status(200).json({ templates, courses, categories });
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

notificationCtrl.createNewTemplate = async (req, res) => {
  try {
    let images = false;
    const { body } = req;
    if (req.files.length > 1) {
      images = true;
    }

    //get order
    const templates = await TemplatesModel.find();
    let order_template = templates.length + 1;

    const newTemplate = new TemplatesModel({
      show_title: JSON.parse(body.show_title),
      title: body.title,
      show_banner: JSON.parse(body.show_banner),
      banner: images ? req.files[0].location : "", //en el front poner esta imagen como pos 0
      banner_key: images ? req.files[0].key : "",
      show_cards: JSON.parse(body.show_cards),
      data: body.data, // siempre llegara => "PACK", "CATEGORY", "OFFER", "FREE", "CURSOS"
      category: body.category,
      courses: JSON.parse(body.courses),
      order_template,
      image_on_cards: images ? req.files[1].location : "",
      image_on_cards_key: images ? req.files[1].key : "",
      only_cards: body.only_cards,
      image_orientation: body.image_orientation, // => "LEFT", "CENTER", "RIGHT"
      url_redirection: body.url_redirection,
    });
    await newTemplate.save();
    res.status(200).json({ message: "Listo!" });
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

notificationCtrl.updateTemplate = async (req, res) => {
  try {
    let = { images_actions, ...dataUpdated } = { ...req.body };
    dataUpdated.courses = JSON.parse(dataUpdated.courses);
    dataUpdated.show_title = JSON.parse(dataUpdated.show_title);
    dataUpdated.show_banner = JSON.parse(dataUpdated.show_banner);
    dataUpdated.show_cards = JSON.parse(dataUpdated.show_cards);

    const { idTemplate } = req.params;
    const { files } = req;

    if (images_actions.length > 0 && files.length === images_actions.length) {
      images_actions.forEach((action, index) => {
        if (action.type === "UPDATE") {
          uploadFileAws.eliminarImagen(action.key_image);
          if (index === 1) {
            dataUpdated.banner = files[0].location;
            dataUpdated.banner_key = files[0].key;
          } else {
            dataUpdated.image_on_cards = files[0].location;
            dataUpdated.image_on_cards_key = files[0].key;
          }
        } else {
          // action.type === "DELETE"
          uploadFileAws.eliminarImagen(action.key_image);
          if (index === 1) {
            dataUpdated.banner = "";
            dataUpdated.banner_key = "";
          } else {
            dataUpdated.image_on_cards = "";
            dataUpdated.image_on_cards_key = "";
          }
        }
      });
    }
    await TemplatesModel.findByIdAndUpdate(idTemplate, { dataUpdated });
    res.status(200).json({ message: "Cambios realizados" });
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

notificationCtrl.updateOrder = async (req, res) => {
  try {
    const arrayOrder = req.body;
    arrayOrder.forEach(async (template, index) => {
      await TemplatesModel.findByIdAndUpdate(template._id, {
        order_template: index + 1,
      });
    });
    res.status(200).json({ message: "Cambios realizados" });
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

notificationCtrl.deleteTemplate = async (req, res) => {
  try {
    const templatesBD = await TemplatesModel.find();
    const templateBase = await TemplatesModel.findById(req.params.idTemplate);
    if (!templateBase) {
      res.status(404).json({ message: "Esto ya no existe.", error });
    } else {
      //eliminar imagenes del bucket
      if (templateBase.banner_key) {
        uploadFileAws.eliminarImagen(templateBase.banner_key);
      }
      if (templateBase.image_on_cards_key) {
        uploadFileAws.eliminarImagen(templateBase.image_on_cards_key);
      }
      //eliminar de la base de datos
      await TemplatesModel.findByIdAndDelete(templateBase._id);
      //reordenar templates
      templatesBD.forEach(async (template, index) => {
        await TemplatesModel.findByIdAndUpdate(template._id, {
          order_template: index + 1,
        });
      });
      res.status(200).json({ message: "Listo!" });
    }
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

module.exports = notificationCtrl;

const categoriesCtrl = {};
const mongoose = require("mongoose");
const modelCategories = require("../models/Categories");
const modelCourses = require("../models/Course");
const modelInscription = require("../models/Inscription");
const modelCommentCourse = require("../models/CommentCourse");

categoriesCtrl.getCategories = async (req, res) => {
  try {
    const categories = await modelCategories.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

categoriesCtrl.getCategoriesNavbar = async (req, res) => {
  try {
    const categos = await modelCourses.aggregate([
      {
        $match: { publication: true },
      },
      /** Group on `category + subCategory` & push item's to `items` array */
      {
        $group: {
          _id: { category: "$category", subCategory: "$subCategory" },
          items: { $push: "$item" },
        },
      },
      /** Group on `category` field & push objects({subCategory:...,items:...}) to `subcategories` field */
      {
        $group: {
          _id: "$_id.category",
          subcategories: {
            $push: { subCategory: "$_id.subCategory", items: "$items" },
          },
        },
      },
      /** remove `_id` field & add `category` field & project `subcategories` field */
      {
        $project: { _id: 0, category: "$_id", subcategories: 1 },
      },
      { $sort: { category: 1 } },
    ]);
    res.status(200).json(categos);
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

categoriesCtrl.getCategoriesFilter = async (req, res) => {
  try {
    const { category, subcategory } = req.query;
    const and_filter = [
      {
        publication: true,
      },
    ];
    let subcategorias = [];
    if (category) {
      and_filter.push({ category });
      subcategorias = await modelCourses.aggregate([
        {
          $match: { category, publication: true },
        },
        {
          $group: { _id: "$subCategory" },
        },
        {
          $project: {
            _id: 0,
            subCategory: "$_id",
          },
        },
        { $sort: { subCategory: 1 } },
      ]);
    }
    if (subcategory) {
      and_filter.push({ subCategory: subcategory });
    }
    const categorias = await modelCourses.aggregate([
      {
        $match: {
          $and: and_filter,
        },
      },
    ]);

    const courses = await modelCourses.populate(categorias, "idProfessor");
    let coursesFinal = [];
    for (i = 0; i < courses.length; i++) {
      let courseActual = {
        course: courses[i],
        numInscription: "",
        numCalification: "",
      };
      const numScription = await modelInscription.countDocuments({
        idCourse: courses[i]._id,
      });
      courseActual.numInscription = numScription - 1;
      const numCalificationCourse = await modelCommentCourse.countDocuments({
        idCourse: courses[i]._id,
      });
      courseActual.numCalification = numCalificationCourse;
      coursesFinal.push(courseActual);
    }
    res.status(200).json({ cursos: coursesFinal, subcategorias });
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

categoriesCtrl.agregateCategorie = async (req, res) => {
  try {
    const { categorie } = req.body;
    const existente = await modelCategories.findOne({
      categorie: { $regex: categorie, $options: "i" },
    });
    if (existente) {
      res.status(404).json({ message: "Esta categoria ya existe" });
      return;
    }
    const newCategories = new modelCategories(req.body);
    await newCategories.save();
    res.status(200).json({ message: "Categoria agregada" });
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

categoriesCtrl.createSubcategories = async (req, res) => {
  try {
    const { subCategorie } = req.body;
    const { id_categorie } = req.params;
    const existente = await modelCategories.findOne({
      _id: id_categorie,
      "subCategories.subCategorie": { $regex: subCategorie, $options: "i" },
    });
    if (existente) {
      res.status(404).json({ message: "Esta subcategoria ya existe" });
      return;
    }
    const result = await modelCategories.updateOne(
      {
        _id: mongoose.Types.ObjectId(id_categorie),
      },
      { $addToSet: { subCategories: { subCategorie } } }
    );
    if (result.nModified) {
      res.status(200).json({ message: "Subcategoria creada" });
    } else {
      res.status(500).json({ message: "Hubo un error al actualizar" });
    }
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

categoriesCtrl.editCategories = async (req, res) => {
  try {
    const { id_categorie } = req.params;
    const { categorie } = req.body;
    //obtener el nombre de la categoria anterior
    const old_category = await modelCategories.findById(id_categorie);
    //buscar los cursos donde tengan esta categoria y acturalizarlos
    const cursos_existentes = await modelCourses.find({
      category: old_category.categorie,
    });

    let cursos_con_subcategotias = false;
    let subcategorias_editadas = false;

    if (cursos_existentes.length > 0) {
      cursos_con_subcategotias = true;
      const cursos_updated = await modelCourses.updateMany(
        { category: old_category.categorie },
        { $set: { category: categorie } }
      );
      if (cursos_updated.nModified) subcategorias_editadas = true;
    }
    if (cursos_con_subcategotias && subcategorias_editadas === false) {
      res.status(500).json({
        message:
          "Hubo un error al actualizar categorias en los cursos actuales",
      });
      return;
    }
    const result = await modelCategories.findByIdAndUpdate(
      id_categorie,
      req.body
    );
    if (!result) {
      res.status(500).json({
        message: "Hubo un error al actualizar categoria",
      });
      return;
    }
    res.status(200).json({ message: "Categoria actualizada" });
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

categoriesCtrl.editSubcategories = async (req, res) => {
  try {
    const { id_categorie, id_subcategorie } = req.params;
    const { subCategorie } = req.body;
    //obtener el nombre de la categoria anterior
    const category = await modelCategories.findById(id_categorie);
    const subcategory = category.subCategories.filter(
      (res) => res._id.toString() === id_subcategorie.toString()
    );
    if (subcategory.length === 0) {
      res.status(404).json({ message: "Subcategoria no encontrada" });
      return;
    }
    //buscar los cursos donde tengan esta categoria y acturalizarlos
    const cursos_existentes = await modelCourses.find({
      category: category.categorie,
      subCategory: subcategory[0].subCategorie,
    });

    let cursos_con_subcategotias = false;
    let subcategorias_editadas = false;

    if (cursos_existentes.length > 0) {
      cursos_con_subcategotias = true;
      const cursos_updated = await modelCourses.updateMany(
        {
          category: category.categorie,
          subCategory: subcategory[0].subCategorie,
        },
        { $set: { subCategory: subCategorie } }
      );
      if (cursos_updated.nModified) subcategorias_editadas = true;
    }

    if (cursos_con_subcategotias && subcategorias_editadas === false) {
      res.status(500).json({
        message:
          "Hubo un error al actualizar subcategorias en los cursos actuales",
      });
      return;
    }

    const result = await modelCategories.updateOne(
      {
        _id: mongoose.Types.ObjectId(id_categorie),
        "subCategories._id": mongoose.Types.ObjectId(id_subcategorie),
      },
      { $set: { "subCategories.$.subCategorie": subCategorie } }
    );
    if (result.nModified) {
      res.status(200).json({ message: "Subcategoria actualizada" });
    } else {
      res.status(500).json({ message: "Hubo un error al actualizar" });
    }
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

categoriesCtrl.deleteCategories = async (req, res) => {
  try {
    const { id_categorie } = req.params;
    //obtener el nombre de la categoria anterior
    const category = await modelCategories.findById(id_categorie);
    //buscar cursos con esa categoria
    const courses = await modelCourses.find({ category: category.categorie });
    if (courses.length > 0) {
      res.status(404).json({
        message: `No se puede realizar esta acción, esta categoria se esta usando en ${courses.length} cursos`,
      });
      return;
    }
    if (category) {
      await modelCategories.findByIdAndDelete(id_categorie);
      res.status(200).json({ message: "Categoria eliminada" });
    } else {
      res.status(404).json({ message: "Categoria no existe" });
    }
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

categoriesCtrl.deleteSubcategories = async (req, res) => {
  try {
    const { id_categorie, id_subcategorie } = req.params;
    //obtener el nombre de la categoria anterior
    const category = await modelCategories.findById(id_categorie);
    const subcategory = category.subCategories.filter(
      (res) => res._id.toString() === id_subcategorie.toString()
    );
    if (subcategory.length === 0) {
      res.status(404).json({ message: "Subcategoria no encontrada" });
      return;
    }
    const courses = await modelCourses.find({
      category: category.categorie,
      subCategory: subcategory[0].subCategorie,
    });
    if (courses.length > 0) {
      res.status(404).json({
        message: `No se puede realizar esta acción, esta subcategoria se esta usando en ${courses.length} cursos`,
      });
      return;
    }
    const result = await modelCategories.updateOne(
      {
        _id: mongoose.Types.ObjectId(id_categorie),
      },
      {
        $pull: {
          subCategories: {
            _id: mongoose.Types.ObjectId(id_subcategorie),
          },
        },
      }
    );
    if (result.nModified) {
      res.status(200).json({ message: "Categoria eliminada" });
    } else {
      res
        .status(500)
        .json({ message: "Hubo un error al eliminar subcategoria" });
    }
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

module.exports = categoriesCtrl;

const packCourseCtrl = {};
const modelPackages = require("../models/Packages");
const uploadFileAws = require("../middleware/awsFile");

packCourseCtrl.uploadFile = async (req, res, next) => {
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

packCourseCtrl.getPackageByID = async (req, res) => {
  try {
    const packCourse = await modelPackages
      .findOne({slug: req.params.slug})
      .populate("courses.course idProfessor");
    res.status(200).json(packCourse);
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

packCourseCtrl.getAllPackages = async (req, res) => {
  try {
    const coursePackages = await modelPackages
      .find({
        archived: false,
        active: true,
      })
      .populate("courses.course idProfessor")
      .sort({ createdAt: -1 });
    res.status(200).json(coursePackages);
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

packCourseCtrl.getPackagesProfessor = async (req, res) => {
  try {
    const coursePackages = await modelPackages
      .find({
        idProfessor: req.params.idProfessor,
        archived: false,
      })
      .populate("courses.course")
      .sort({ createdAt: -1 });
    const coursePackagesArchived = await modelPackages
      .find({
        idProfessor: req.params.idProfessor,
        archived: true,
      })
      .populate("courses.course");
    res.status(200).json({
      packages: coursePackages,
      packagesArchived: coursePackagesArchived,
    });
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

packCourseCtrl.createPackage = async (req, res) => {
  try {
    let input = { ...req.body };

    input.active = JSON.parse(input.active);
    input.courses = JSON.parse(input.courses);
    input.pricePack = JSON.parse(input.pricePack);
    input.archived = false;

    if (req.file) {
      input.image = req.file.location;
      input.key_image = req.file.key;
    }
    const newPackage = new modelPackages(input);
    await newPackage.save();
    res.status(200).json("Nuevo paquete de cursos creado!");
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

packCourseCtrl.updatePackage = async (req, res) => {
  try {
    const package = await modelPackages.findById(req.params.idPackage);
    if (package) {
      const editedFields = { ...req.body };

      if (editedFields.active)
        editedFields.active = JSON.parse(editedFields.active);
      if (editedFields.courses)
        editedFields.courses = JSON.parse(editedFields.courses);
      if (editedFields.pricePack)
        editedFields.pricePack = JSON.parse(editedFields.pricePack);
      if (editedFields.archived)
        editedFields.archived = JSON.parse(editedFields.archived);
      //verificar si hay nueva imagen
      if (req.file) {
        //eliminar la anterior y poner la nueva
        if (package.key_image) {
          uploadFileAws.eliminarImagen(package.key_image);
        }
        const { key, location } = req.file;
        editedFields.image = location;
        editedFields.key_image = key;
      } else if (!editedFields.imagen && editedFields.key_image) {
        //si elimino la imagen y no subio otra, eliminar de aws
        uploadFileAws.eliminarImagen(editedFields.key_image);
        editedFields.key_image = "";
        editedFields.image = "";
      }
      await modelPackages.findByIdAndUpdate(req.params.idPackage, editedFields);
      res.status(200).json("Paquete de cursos actualizado");
    } else {
      res.status(404).json("Este paquete de cursos no existe");
    }
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

module.exports = packCourseCtrl;

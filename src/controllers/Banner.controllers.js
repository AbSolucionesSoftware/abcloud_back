const courseCtrl = {};
const modelCourse = require("../models/Course");
const uploadFileAws = require("../middleware/awsFile");
const BannerModel = require("../models/Banner");

courseCtrl.uploadFile = async (req, res, next) => {
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

courseCtrl.getBanners = async (req, res, next, callback = false) => {
  //callback se usa para control interno, para saber si esta funcion se esta llamando desde otra y retornar solo el array/objeto
  try {
    const banners = await BannerModel.find().sort({order_number: 1});
    const courses = await modelCourse.find({ publication: true });
    if(callback){
      return {banners, courses }
    }
    res.status(200).json({ banners, courses });
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

courseCtrl.createBanner = async (req, res) => {
  const { course_ref, course_name, order_number } = req.body;
  const { key, location } = req.file;
  try {
    const newBanner = new BannerModel({
      image_desktop: location,
      key_desktop: key,
      course_ref,
      course_name,
      order_number: parseInt(order_number),
    });
    await newBanner.save();
    res.status(200).json({ message: "Banner Guardado." });
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

courseCtrl.editBanner = async (req, res) => {
  try {
    const bannerBase = await BannerModel.findById(req.params.idBanner);
    if (bannerBase) {
      const dataBanner = req.body;
      await BannerModel.findByIdAndUpdate(req.params.idBanner, dataBanner);
      res.status(200).json({ message: "Banner editado" });
    } else {
      res.status(504).json({ message: "Este banner no existe" });
    }
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

courseCtrl.uploadImagenDevicesBanner = async (req, res) => {
  try {
    const bannerBase = await BannerModel.findById(req.params.idBanner);
    if (bannerBase) {
      const { location, key } = req.file;
      if (bannerBase.key_devices) {
        uploadFileAws.eliminarImagen(bannerBase.key_devices);
      }
      const dataBanner = {
        image_devices: location,
        key_devices: key,
      };

      await BannerModel.findByIdAndUpdate(bannerBase._id, dataBanner);
      res.status(200).json({ message: "Banner para dispositivos guardado" });
    } else {
      res.status(504).json({ message: "Este banner no existe", error });
    }
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

courseCtrl.editImageBannerDesktop = async (req, res) => {
  try {
    const bannerBase = await BannerModel.findById(req.params.idBanner);
    if (bannerBase) {
      if (req.file) {
        if (bannerBase.key_desktop) {
          uploadFileAws.eliminarImagen(bannerBase.key_desktop);
        }
        const { key, location } = req.file;
        const dataBanner = {
          image_desktop: location,
          key_desktop: key,
        };
        await BannerModel.findByIdAndUpdate(bannerBase._id, dataBanner);
        res.status(200).json({ message: "Imagen actualizada." });
      } else {
        res.status(404).json({ message: "Es necesario una imagen." });
      }
    } else {
      res.status(404).json({ message: "El banner no existe." });
    }
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

courseCtrl.deleteImageBannerDevices = async (req, res) => {
  try {
    const banner = await BannerModel.findById(req.params.idBanner);
    if (!banner) {
      res.status(404).json({ message: "Este banner no existe.", error });
    } else {
      //eliminar imagen del bucker
      uploadFileAws.eliminarImagen(banner.key_devices);
      await BannerModel.findByIdAndUpdate(banner._id, {
        image_devices: "",
        key_devices: "",
      });
      res.status(200).json({ message: "Imagen eliminada" });
    }
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

courseCtrl.deleteBanner = async (req, res) => {
  try {
    const banner = await BannerModel.findById(req.params.idBanner);
    if (!banner) {
      res.status(404).json({ message: "Este banner no existe.", error });
    } else {
      //eliminar imagen del bucker
      uploadFileAws.eliminarImagen(banner.key_desktop);
      //si hay imagen devices eliminar
      if (banner.key_devices) uploadFileAws.eliminarImagen(banner.key_devices);
      await BannerModel.findByIdAndDelete(banner._id);
      //reordenar banners
      const banners = await BannerModel.find();
      banners.map(async (banner, index) => {
        await BannerModel.findByIdAndUpdate(banner._id, {
          order_number: index + 1,
        });
      });
      res.status(200).json({ message: "Banner eliminado" });
    }
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

courseCtrl.editOrderBanner = async (req, res) => {
  try {
    const arrayOrder = req.body;
    arrayOrder.map(async (banner, index) => {
      await BannerModel.findByIdAndUpdate(banner._id, {
        order_number: index + 1,
      });
    });
    res.status(200).json({ message: "Cambios realizados" });
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

module.exports = courseCtrl;

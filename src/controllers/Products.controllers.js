const courseCtrl = {};
const ProductModel = require("../models/Product");

courseCtrl.getProducts = async (req, res) => {
  try {
    const products = await ProductModel.find({
      idProfessor: req.params.idProfessor,
    }).sort({ createdAt: 1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};
courseCtrl.getAllProductsConsultoring = async (req, res) => {
  try {
    const products = await ProductModel.find({
      type: "CONSULTORIA",
    }).sort({ name: 1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

courseCtrl.createProduct = async (req, res) => {
  try {
    const newProduct = new ProductModel({
      ...req.body,
      idProfessor: req.params.idProfessor,
    });
    await newProduct.save();
    res.status(200).json({ message: "Producto Guardado" });
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

courseCtrl.editProduct = async (req, res) => {
  try {
    await ProductModel.findByIdAndUpdate(req.params.idProduct, { ...req.body });
    res.status(200).json({ message: "Producto editado" });
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

courseCtrl.deleteProduct = async (req, res) => {
  try {
    await ProductModel.findByIdAndDelete(req.params.idProduct);
    res.status(200).json({ message: "Producto eliminado" });
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

module.exports = courseCtrl;

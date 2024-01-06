const cartCtrl = {};
const modelCart = require("../models/Cart");
const modelUser = require("../models/User");

cartCtrl.createCartPack = async (req, res) => {
  try {
    const { idPackage } = req.body;
    const userBase = await modelCart.findOne({ idUser: req.params.idUser });
    if (userBase) {
      await modelCart.updateOne(
        {
          _id: userBase._id,
        },
        {
          $addToSet: {
            packsCourses: [
              {
                package: idPackage,
              },
            ],
          },
        },
        async (err, response) => {
          if (err) {
            res.status(500).json({
              message: "Ups, algo paso al agregar esto a carrito.",
              err,
            });
          } else {
            if (!response) {
              res.status(404).json({ message: "Error al agregar." });
            } else {
              res.status(200).json({ message: "Curso agregado." });
            }
          }
        }
      );
    } else {
      res.status(404).json({ message: "Usuario no encontrado." });
    }
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

cartCtrl.aggregateCourse = async (req, res) => {
  try {
    const { idCourse } = req.body;
    const userBase = await modelCart.findOne({ idUser: req.params.idUser });
    if (userBase) {
      await modelCart.updateOne(
        {
          _id: userBase._id,
        },
        {
          $addToSet: {
            courses: [
              {
                course: idCourse,
              },
            ],
          },
        },
        async (err, response) => {
          if (err) {
            res
              .status(500)
              .json({ message: "Ups, algo paso al agregar curso.", err });
          } else {
            if (!response) {
              res.status(404).json({ message: "Error al agregar." });
            } else {
              res.status(200).json({ message: "Curso agregado." });
            }
          }
        }
      );
    } else {
      res.status(404).json({ message: "Usuario no encontrado." });
    }
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

cartCtrl.deletePackCart = async (req, res) => {
  try {
    const userBase = await modelCart.findOne({ idUser: req.params.idUser });
    if (userBase) {
      await modelCart.updateOne(
        {
          _id: userBase._id,
        },
        {
          $pull: {
            packsCourses: {
              package: req.params.idPackage,
            },
          },
        },
        async (err, response) => {
          if (err) {
            res
              .status(500)
              .json({ message: "Ups, algo paso al eliminar esto.", err });
          } else {
            if (!response) {
              res.status(404).json({ message: "Error al eliminar." });
            } else {
              res.status(200).json({ message: "Curso eliminado." });
            }
          }
        }
      );
    } else {
      res.status(404).json({ message: "Usuario no encontrado." });
    }
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

cartCtrl.deleteCourse = async (req, res) => {
  try {
    const userBase = await modelCart.findOne({ idUser: req.params.idUser });
    if (userBase) {
      await modelCart.updateOne(
        {
          _id: userBase._id,
        },
        {
          $pull: {
            courses: {
              course: req.params.idCurse,
            },
          },
        },
        async (err, response) => {
          if (err) {
            res
              .status(500)
              .json({ message: "Ups, algo paso al eliminar curso.", err });
          } else {
            if (!response) {
              res.status(404).json({ message: "Error al eliminar." });
            } else {
              res.status(200).json({ message: "Curso eliminado." });
            }
          }
        }
      );
    } else {
      res.status(404).json({ message: "Usuario no encontrado." });
    }
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

cartCtrl.getCartCourse = async (req, res) => {
  try {
    const cartUser = await modelCart
      .findOne({ idUser: req.params.idUser })
      .populate("idUser courses.course")
      .populate({
        path: "packsCourses",
        populate: {
          path: "package",
          populate: {
            path: "courses idProfessor",
            populate: {
              path: "course",
              populate: {
                path: "idProfessor",
              }
            }
          }
        },
      });
    if (cartUser) {
      let newCart = cartUser;
      let courses = [];
      let courseNew = {};
      for (i = 0; i < cartUser.courses.length; i++) {
        courseNew = cartUser.courses[i].course;
        const user = await modelUser.findById(
          cartUser.courses[i].course.idProfessor
        );
        courseNew.idProfessor = user;
      }
      newCart.coursess = courses;
      res.status(200).json(newCart);
    } else {
      res.status(500).json({ message: "El usuario no existe." });
    }
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

cartCtrl.deleteCart = async (req, res) => {
  try {
    const cartBase = await modelCart.findOne({ idUser: req.params.idUser });
    if (cartBase) {
      cartBase.courses.map(async (course) => {
        await modelCart.updateOne(
          {
            _id: cartBase._id,
          },
          {
            $pull: {
              courses: {
                _id: course._id,
              },
            },
          }
        );
      });
      cartBase.packsCourses.map(async (pack) => {
        await modelCart.updateOne(
          {
            _id: cartBase._id,
          },
          {
            $pull: {
              packsCourses: {
                _id: pack._id,
              },
            },
          }
        );
      });
      res.status(200).json({ message: "Carrito eliminado." });
    } else {
      req.status(404).json({ message: "Usuario no encontrado." });
    }
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

module.exports = cartCtrl;

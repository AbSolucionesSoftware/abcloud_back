const userCtrl = {};
const modelUser = require("../models/User");
const bcrypt = require("bcrypt-nodejs");
const jwt = require("jsonwebtoken");
const uploadFile = require("../middleware/awsFile");
const modelCart = require("../models/Cart");
const blackListPass = require("../models/BlackListPassword");
const reuserfunction = require("../middleware/reuser");
const sendEmail = require("../middleware/sendEmail");
const modelBlackList = require("../models/BlackListPassword");
const modelCourse = require("../models/Course");
const modelInscription = require("../models/Inscription");
const moment = require("moment");

userCtrl.uploadFile = async (req, res, next) => {
  uploadFile.upload(req, res, function (err) {
    if (err) {
      console.log(err.message || 'Something went wrong uploading image aws')
      return res.status(500).json({ message: err.message || 'Something went wrong uploading image aws' });
    }
    return next();
  });
};

userCtrl.createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      repeatPassword,
      acceptPolicies,
      messagingToken,
    } = req.body;

    const userBase = await modelUser.findOne({ email });

    if (userBase) {
      res.status(400).json({ message: "Este correo ya está registrado." });
      return;
    }

    const newUser = new modelUser();

    if (acceptPolicies) {
      if (!password || !repeatPassword) {
        res.status(404).json({ message: "The password is required." });
      } else {
        if (password === repeatPassword) {
          bcrypt.hash(password, null, null, function (err, hash) {
            if (err) {
              res
                .status(500)
                .json({ message: "Error encrypting the password.", err });
            } else {
              newUser.name = name;
              newUser.email = email;
              newUser.policies = true;
              newUser.type = "Estudiante";
              newUser.sessiontype = "ApiRest";
              newUser.password = hash;
              newUser.admin = false;

              let messagingTokens = [];
              if (messagingToken) {
                messagingTokens.push({
                  token: messagingToken,
                });
              }

              newUser.messagingTokens = messagingTokens;
              newUser.save(async (err, userStored) => {
                if (err) {
                  res.status(500).json({
                    message: "Ups, algo paso al registrar el usuario",
                    err,
                  });
                } else {
                  if (!userStored) {
                    res
                      .status(404)
                      .json({ message: "Error al crear el usuario" });
                  } else {
                    const cart = new modelCart({
                      idUser: userStored._id,
                    });
                    await cart.save();
                    const token = jwt.sign(
                      {
                        email: newUser.email,
                        name: newUser.name,
                        imagen: newUser.urlImage ? newUser.urlImage : null,
                        _id: newUser._id,
                        sessiontype: newUser.sessiontype,
                        rol: newUser.type,
                      },
                      process.env.AUTH_KEY
                    );
                    res.json({ token });
                  }
                }
              });
            }
          });
        } else {
          res.status(500).json({ message: "The passwords are not the same." });
        }
      }
    } else {
      res.status(500).json({ message: "The policies is required." });
    }
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

userCtrl.createTeacher = async (req, res) => {
  try {
    const { type } = req.body;
    const idUser = req.params.idUser;
    const userBase = await modelUser.findById(idUser);
    const newTeacher = userBase;

    newTeacher.type = type;
    newTeacher.admin = false;
    await modelUser.findByIdAndUpdate(idUser, newTeacher);
    const userUpdate = await modelUser.findById(idUser);
    const token = jwt.sign(
      {
        email: userUpdate.email,
        name: userUpdate.name,
        imagen: userUpdate.urlImage ? userUpdate.urlImage : null,
        _id: userUpdate._id,
        sessiontype: userUpdate.sessiontype,
        rol: userUpdate.type,
      },
      process.env.AUTH_KEY
    );
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

userCtrl.getUser = async (req, res) => {
  try {
    const userBase = await modelUser.findById(req.params.idUser);
    if (userBase) {
      res.status(200).json(userBase);
    } else {
      res.status(500).json({ messege: "Este usuario no existe" });
    }
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

userCtrl.editUser = async (req, res) => {
  try {
    if (req.body.password) {
      res.status(500).json({ message: "Error de datos enviados." });
    } else {
      const userBase = await modelUser.findById(req.params.idUser);
      const { messagingTokens, ...updateUser } = req.body;
      if (userBase) {
        if (req.file) {
          updateUser.keyImage = req.file.key;
          updateUser.urlImage = req.file.location;
          if (userBase.keyImage) {
            uploadFile.eliminarImagen(userBase.keyImage);
          }
        } else {
          if (userBase.keyImage) {
            updateUser.keyImage = userBase.keyImage;
            updateUser.urlImage = userBase.urlImage;
          }
        }
        await modelUser.findByIdAndUpdate(req.params.idUser, updateUser);

        const userUpdate = await modelUser.findById(req.params.idUser);
        const token = jwt.sign(
          {
            email: userUpdate.email,
            name: userUpdate.name,
            imagen: userUpdate.urlImage ? userUpdate.urlImage : null,
            _id: userUpdate._id,
            sessiontype: userUpdate.sessiontype,
            rol: userUpdate.type,
            admin: userUpdate.admin,
          },
          process.env.AUTH_KEY
        );
        res.status(200).json({ token });
      } else {
        res.status(500).json({ message: "Este usuario no existe" });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

userCtrl.courseUser = async (req, res) => {
  try {
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

userCtrl.signInUser = async (req, res) => {
  try {
    const { email, password, messagingToken } = req.body;
    console.log(messagingToken);
    const userBase = await modelUser.findOne({ email: email });
    if (userBase) {
      if (userBase.sessiontype === "Firebase") {
        res.status(504).json({
          message: "Este usuario inicio sesion con Google o Facebook.",
        });
      } else {
        if (!bcrypt.compareSync(password, userBase.password)) {
          res
            .status(404)
            .json({ message: "Usuario o contraseña incorrectos." });
        } else {
          let messagingTokens = [];
          if (userBase.messagingTokens && userBase.messagingTokens.length > 0) {
            messagingTokens = [...userBase.messagingTokens];
          }
          if (messagingToken) {
            if (messagingTokens.length > 0) {
              const exist = userBase.messagingTokens.filter(
                (msg) => messagingToken === msg.token
              );
              if (!exist.length) {
                messagingTokens.push({ token: messagingToken });
              }
            } else {
              messagingTokens.push({
                token: messagingToken,
              });
            }
          }
          await modelUser.findByIdAndUpdate(userBase._id, {
            last_sesion: moment().locale("es-mx").format(),
            messagingTokens,
          });
          const token = jwt.sign(
            {
              email: userBase.email,
              name: userBase.name,
              imagen: userBase.urlImage ? userBase.urlImage : null,
              _id: userBase._id,
              sessiontype: userBase.sessiontype,
              rol: userBase.type,
              admin: userBase.admin,
            },
            process.env.AUTH_KEY
          );
          //token
          res.json({ token });
        }
      }
    } else {
      res.status(404).json({ message: "Este usuario no existe." });
    }
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

userCtrl.signOutUser = async (req, res) => {
  try {
    const { idUser, messagingToken } = req.body;
    const userBase = await modelUser.findById(idUser);
    if (userBase) {
      if (messagingToken) {
        let userTokens = userBase.messagingTokens;
        if (userTokens && userTokens.length > 0) {
          const newTokens = userBase.messagingTokens.filter(
            (msg) => messagingToken !== msg.token
          );
          await modelUser.findByIdAndUpdate(userBase, {
            messagingTokens: newTokens,
          });
          res.status(200).json({ message: "Token eliminado" });
        } else {
          res.status(200).json({ message: "No hay tokens en este usuario" });
        }
      } else {
        res.status(200).json({ message: "No se mando ningun token" });
      }
    } else {
      res.status(404).json({ message: "No existe este usuario" });
    }
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

userCtrl.generateCodeResetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const newRecuperacion = new blackListPass({
      email: email,
      code: reuserfunction.generateCode(30),
      verify: false,
    });

    await newRecuperacion.save();
    const urlReset = `https://www.uniline.online/reset_password/${newRecuperacion.code}`;
    const htmlContentUser = `
                <div>                    
                    <h3 style="font-family: sans-serif; margin: 15px 15px;">Solicitaste un cambio de contraseña</h3>
                    <h4 style="font-family: sans-serif; margin: 15px 15px;">Puedes utilizar el siguiente enlace para restablecer la contraseña:</h4>
                    <h4 style="font-family: sans-serif; margin: 15px 15px;"><b>IMPORTANTE:</b>Si restableces tu contraseña y tu cuenta era de Google o Facebook ya no podrás iniciar sesion con esos metodos, tendrás que iniciar sesion con tu correo y contraseña</h4>
					              <a href="${urlReset}">${urlReset}</a>
                    <div style=" max-width: 550px; height: 100px;">
                        <p style="padding: 10px 0px;">Al utilizar este codigo ya no podra utilizarse de nuevo.</p>
                    </div>
				</div>`;

    await sendEmail.sendEmail(
      email,
      "Recuperacion",
      htmlContentUser,
      "Uniline"
    );
    res.status(200).json({ message: "Correo enviado." });
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

userCtrl.verifyResetPassword = async (req, res) => {
  try {
    const blackListBase = await modelBlackList.findOne({
      code: req.params.keyBlackList,
    });
    if (blackListBase) {
      if (blackListBase.verify) {
        res.status(505).json({
          message: "Este codigo ya fue usado para cambiar la contrasena.",
        });
      } else {
        const { password, repeatPassword } = req.body;
        const userBase = await modelUser.findOne({
          email: blackListBase.email,
        });
        if (userBase) {
          /* if(userBase.sessiontype === "Firebase"){
            res.status(500).json({message: "Este usuario no tiene este privilegio ya que inicio sesion con Google o Facebook."});
          }else{
            
          } */
          if (!password && !repeatPassword) {
            res.status(500).json({ message: "Las contasenas no existen." });
          } else {
            if (password === repeatPassword) {
              bcrypt.hash(password, null, null, async function (err, hash) {
                if (err) {
                  res.status(500).json({
                    message: "Error al encriptar la contraseña.",
                    err,
                  });
                } else {
                  await modelUser.findByIdAndUpdate(userBase._id, {
                    password: hash,
                    sessiontype: "ApiRest",
                  });
                  await modelBlackList.findByIdAndUpdate(blackListBase._id, {
                    verify: true,
                  });
                  const token = jwt.sign(
                    {
                      email: userBase.email,
                      name: userBase.name,
                      imagen: userBase.urlImage ? userBase.urlImage : null,
                      _id: userBase._id,
                      sessiontype: userBase.sessiontype,
                      rol: userBase.type,
                      admin: userBase.admin,
                    },
                    process.env.AUTH_KEY
                  );
                  res.status(200).json({ token });
                }
              });
            } else {
              res
                .status(404)
                .json({ message: "Las constrasenas no son iguales." });
            }
          }
        } else {
          res.status(404).json({ message: "Este usuario no existe." });
        }
      }
    } else {
      req.status(404).json({ message: "Este codigo no existe." });
    }
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
  }
};

userCtrl.userFirebaseSign = async (req, res) => {
  try {
    const { email, name, messagingToken } = req.body;
    console.log(messagingToken);
    if (!email || !name) {
      res.status(500).json({ message: "Algo fallo" });
    } else {
      const userBase = await modelUser.findOne({ email: email });
      if (userBase) {
        if (userBase.sessiontype === "Firebase") {
          if (!bcrypt.compareSync(email, userBase.password)) {
            res
              .status(500)
              .json({ message: "Usuario o contraseña incorrectos." });
          } else {
            let messagingTokens = [];
            if (
              userBase.messagingTokens &&
              userBase.messagingTokens.length > 0
            ) {
              messagingTokens = [...userBase.messagingTokens];
            }
            if (messagingToken) {
              if (messagingTokens.length > 0) {
                const exist = userBase.messagingTokens.filter(
                  (msg) => messagingToken === msg.token
                );
                if (!exist.length) {
                  messagingTokens.push({ token: messagingToken });
                }
              } else {
                messagingTokens.push({
                  token: messagingToken,
                });
              }
            }

            await modelUser.findByIdAndUpdate(userBase._id, {
              last_sesion: moment().locale("es-mx").format(),
              messagingTokens,
            });
            const token = jwt.sign(
              {
                email: userBase.email,
                name: userBase.name,
                imagen: userBase.urlImage,
                _id: userBase._id,
                sessiontype: userBase.sessiontype,
                rol: userBase.type,
                admin: userBase.admin,
              },
              process.env.AUTH_KEY
            );
            //token
            res.json({ token });
          }
        } else {
          res.status(500).json({
            message: "Este usuario tiene que iniciar sesion directamente.",
          });
        }
      } else {
        const newUser = new modelUser();
        bcrypt.hash(email, null, null, function (err, hash) {
          if (err) {
            res.status(500).json({ message: "Parece que paso un error.", err });
          } else {
            newUser.name = name;
            newUser.email = email;
            newUser.policies = true;
            newUser.admin = false;
            newUser.type = "Estudiante";
            newUser.sessiontype = "Firebase";
            newUser.password = hash;
            newUser.save(async (err, userStored) => {
              if (err) {
                res.status(404).json({
                  message: "Ups, algo paso al registrar el usuario",
                  err,
                });
              } else {
                if (!userStored) {
                  res
                    .status(404)
                    .json({ message: "Error al crear el usuario" });
                } else {
                  const cart = new modelCart({
                    idUser: userStored._id,
                  });
                  await cart.save();
                  const token = jwt.sign(
                    {
                      email: newUser.email,
                      name: newUser.name,
                      imagen: newUser.urlImage ? newUser.urlImage : null,
                      _id: newUser._id,
                      sessiontype: newUser.sessiontype,
                      rol: newUser.type,
                      admin: newUser.admin,
                    },
                    process.env.AUTH_KEY
                  );
                  res.json({ token });
                }
              }
            });
          }
        });
      }
    }
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

userCtrl.resetPasswordUserSession = async (req, res) => {
  try {
    const { currentPassword, password, repeatPassword } = req.body;
    const userBase = await modelUser.findById(req.params.idUser);
    const newUser = userBase;
    if (userBase) {
      if (userBase.sessiontype === "Firebase") {
        res.status(504).json({ message: "Usuario no valido." });
      } else {
        if (password === repeatPassword) {
          if (!bcrypt.compareSync(currentPassword, userBase.password)) {
            res.status(404).json({ message: "Contraseña incorrecta" });
          } else {
            bcrypt.hash(password, null, null, function (err, hash) {
              if (err) {
                res
                  .status(500)
                  .json({ message: "Error al encriptar la contraseña.", err });
              } else {
                newUser.password = hash;
                newUser.save(async (err, userStored) => {
                  if (err) {
                    res.status(500).json({
                      message: "Ups, algo paso al registrar el usuario.",
                      err,
                    });
                  } else {
                    if (!userStored) {
                      res
                        .status(404)
                        .json({ message: "Error al crear el usuario" });
                    } else {
                      res
                        .status(200)
                        .json({ message: "Contraseña actualizada." });
                    }
                  }
                });
              }
            });
          }
        } else {
          res.status(504).json({ message: "Las contraseñas no son iguales." });
        }
      }
    } else {
      res.status(504).json({ message: "Este usuario no existe." });
    }
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

userCtrl.registerTeacherUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      repeatPassword,
      acceptPolicies = true,
    } = req.body;
    const newUser = new modelUser();

    if (acceptPolicies) {
      if (!password || !repeatPassword) {
        res.status(404).json({ message: "The password is required." });
      } else {
        if (password === repeatPassword) {
          bcrypt.hash(password, null, null, function (err, hash) {
            if (err) {
              res
                .status(500)
                .json({ message: "Error encrypting the password.", err });
            } else {
              newUser.name = name;
              newUser.email = email;
              newUser.policies = true;
              newUser.type = "Maestro";
              newUser.sessiontype = "ApiRest";
              newUser.password = hash;
              newUser.admin = false;
              newUser.save(async (err, userStored) => {
                if (err) {
                  res.status(500).json({
                    message: "Ups, algo paso al registrar el usuario",
                    err,
                  });
                } else {
                  if (!userStored) {
                    res
                      .status(404)
                      .json({ message: "Error al crear el usuario" });
                  } else {
                    const cart = new modelCart({
                      idUser: userStored._id,
                    });
                    await cart.save();
                    const token = jwt.sign(
                      {
                        email: newUser.email,
                        name: newUser.name,
                        imagen: newUser.urlImage ? newUser.urlImage : null,
                        _id: newUser._id,
                        sessiontype: newUser.sessiontype,
                        rol: newUser.type,
                      },
                      process.env.AUTH_KEY
                    );
                    res.json({ token });
                  }
                }
              });
            }
          });
        } else {
          res.status(500).json({ message: "The passwords are not the same." });
        }
      }
    } else {
      res.status(500).json({ message: "The policies is required." });
    }
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

userCtrl.getTeachers = async (req, res) => {
  try {
    const teachers = await modelUser.aggregate([
      {
        $match: {
          $or: [{ admin: { $exists: false } }, { admin: false }],
          $and: [{ type: "Maestro" }],
        },
      },
    ]);
    let arrayFinal = [];
    for (i = 0; i < teachers.length; i++) {
      const userConts = await modelCourse.countDocuments({
        idProfessor: teachers[i]._id,
      });
      arrayFinal.push({
        teacher: teachers[i],
        courses: userConts,
      });
    }
    res.status(200).json(arrayFinal);
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

userCtrl.getUsers = async (req, res) => {
  const { search } = req.query;
  try {
    const users = await modelUser.aggregate([
      {
        $match: {
          $or: [
            { name: { $regex: ".*" + search + ".*", $options: "i" } },
            { email: { $regex: ".*" + search + ".*", $options: "i" } },
            { phone: { $regex: ".*" + search + ".*", $options: "i" } },
          ],
        },
      },
      {
        $lookup: {
          from: "inscriptions",
          let: { user: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$idUser", { $toObjectId: "$$user" }] }],
                },
              },
            },
            {
              $lookup: {
                from: "courses",
                let: { course: "$idCourse" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [{ $eq: ["$_id", { $toObjectId: "$$course" }] }],
                      },
                    },
                  },
                ],
                as: "course",
              },
            },
          ],
          as: "inscriptions",
        },
      },
    ]);
    res.status(200).json(users);
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

userCtrl.deleteInscriptionCourse = async (req, res) => {
  try {
    if (req.params.idInscription) {
      await modelInscription.findByIdAndDelete(req.params.idInscription);
      res.status(200).json({ message: "Usuario eliminado del curso." });
    } else {
      res.status(404).json({ message: "No hay inscripcion por borrar." });
    }
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

module.exports = userCtrl;

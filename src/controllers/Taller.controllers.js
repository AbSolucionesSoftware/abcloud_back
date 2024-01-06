const userTallerCtrl = {};
const modelCourse = require("../models/Course");
const modelUserTaller = require("../models/UserTaller");
const uploadFile = require("../middleware/awsFile");
const sendEmail = require("../middleware/sendEmail");

userTallerCtrl.uploadFile = async (req, res, next) => {
    try {
      await uploadFile.upload(req, res, function (err) {
        if (err) {
          res.status(500).json({ message: err });
        }
        return next();
      });
    } catch (error) {
      res.status(500).json({ message: error });
      console.log(error);
    }
};//CARGAR IMAGENES

userTallerCtrl.createTaller = async (req, res) => {
    try {
        
        const course = await modelCourse.findById(req.params.idCourse);
        const newTaller = req.body;
        
        await modelCourse.findByIdAndUpdate(req.params.idCourse, {taller: newTaller});

        res.status(200).json({message: "Taller agregado."});

    } catch (error) {
        res.status(500).json({message: "Error del servidor"}, error);
        console.log(error);
    }
};//LISTA RUTA CON CODIGO SIN IMAGEN

userTallerCtrl.getTaller = async (req, res) => {
    try {
        const taller = await modelCourse.find({slug: req.params.slug});
        res.status(200).json(taller);
      } catch (error) {
        res.status(505).json({ message: "Error del servidor", error });
        console.log(error);
      }
}; //LISTA RUTA CON CODIGO

userTallerCtrl.editTaller = async (req, res) => {
    const {
        nameTaller,
        descripcionTaller,
        nameMaestro,
        descripcionMaestro,
        infoCorreo,
        linksCorreo,
        fechaInicio,
        fechaFin,
        horaInicio,
        horaFin,
        sesiones,
        duracionSesion,
    } = req.body;

    await modelCourse.updateOne({_id: req.params.idCourse}, {$set: {
                'taller.nameTaller': nameTaller,
                'taller.fechaInicio': fechaInicio,
                'taller.fechaFin': fechaFin,
                'taller.horaInicio': horaInicio,
                'taller.horaFin': horaFin,
                'taller.sesiones': sesiones,
                'taller.duracionSesion': duracionSesion,
                'taller.descripcionTaller': descripcionTaller,
                'taller.nameMaestro': nameMaestro,
                'taller.descripcionMaestro': descripcionMaestro,
                'taller.infoCorreo': infoCorreo,
                'taller.linksCorreo': linksCorreo
            }
        }
    );
    res.status(200).json({message: "Taller actualizado"});
};//LISTA RUTA CON CODIGO SIN IMAGEN

userTallerCtrl.publicTaller = async (req, res) => {
    try {
        const { publicTaller } = req.body;
        await modelCourse.updateOne({_id: req.params.idCourse}, { $set: { "taller.publicTaller": publicTaller } });
        res.status(200).json({message: "Cambio realizado"});
    } catch (error) {
        res.status(500).json({message: "Error del server", error})
        console.log(error);
    }
};//LISTA RUTA CON CODIGO

userTallerCtrl.createAprendizaje = async (req, res) => {
    const {
        aprendizajesTaller
    } = req.body;
    
    await modelCourse.updateOne({_id: req.params.idCourse}, {$set: {
                'taller.aprendizajesTaller': aprendizajesTaller
            }
        }
    );
    res.status(200).json({message: "Taller actualizado"});
}//LISTA RUTA CON CODIGO

userTallerCtrl.uploadFileTaller = async (req, res) => {
    try {
        const courseBase = await modelCourse.findById(req.params.idCourse);
        const editImagen = {};
        if (courseBase.taller) {
            if (req.file) {
                if (courseBase.taller.keyImageTaller) {
                    uploadFile.eliminarImagen(courseBase.taller.keyImageTaller);
                }
                editImagen.keyImageTaller = req.file.key;
                editImagen.urlImageTaller = req.file.location;
                
                await modelCourse.updateOne({_id: req.params.idCourse}, {$set: {
                    'taller.keyImageTaller': editImagen.keyImageTaller,
                    'taller.urlImageTaller': editImagen.urlImageTaller
                }});

                res.status(200).json({ message: "Imagen agregada." });
            } else {
                res.status(404).json({ message: "Es necesario una imagen." });
            }
        } else {
        res.status(404).json({ message: "El curso no existe." });
        }
    } catch (error) {
        res.status(505).json({ message: "Error del servidor", error });
        console.log(error);
    }
};//FOTO DEL TALLER REVISAR EN EL FRENTE

userTallerCtrl.uploadFileTallerMaestro = async (req, res) => {
    try {
        const courseBase = await modelCourse.findById(req.params.idCourse);
        const editImagen = {};
        if (courseBase.taller) {
            if (req.file) {
                if (courseBase.taller.keyImageMaestro) {
                    uploadFile.eliminarImagen(courseBase.taller.keyImageMaestro);
                }
                editImagen.keyImageMaestro = req.file.key;
                editImagen.urlImageMaestro = req.file.location;
                
                await modelCourse.updateOne({_id: req.params.idCourse}, {$set: {
                    'taller.keyImageMaestro': editImagen.keyImageMaestro,
                    'taller.urlImageMaestro': editImagen.urlImageMaestro
                }});

                res.status(200).json({ message: "Imagen agregada." });
            } else {
                res.status(404).json({ message: "Es necesario una imagen." });
            }
        } else {
        res.status(404).json({ message: "El curso no existe." });
        }
    } catch (error) {
        res.status(505).json({ message: "Error del servidor", error });
        console.log(error);
    }
}; //FOTO DEL MAESTRO REVISAR EN EL FRENTE
  

userTallerCtrl.createUsersTaller = async (req, res) => {
    try {
        const newUserTaller = new modelUserTaller(req.body);

        const existente = await modelUserTaller.findOne({emailUser: req.body.emailUser});
        if(existente){
            res.status(404).json({ message: 'Este usuario ya está registrado en este taller' });
            return
        }

        newUserTaller.idCourse = req.params.idCourse;

        await newUserTaller.save((err, response) => {
            if (err) {
                res.status(500).json({ message: 'Error de servidor', err });
            } else {
                if (!response) {
                    res.status(404).json({ message: 'Usuario no existente' });
                } else {
                    res.status(200).json({ message: 'Usuario registrado'});
                }
            }
        });
        
    } catch (error) {
        res.status(500).json({message: "Error del servidor"}, error);
        console.log(error);
    }
};//LISTA RUTA CON CODIGO

userTallerCtrl.getUsersTaller = async (req, res) => {
    try {
        const usuariosTaller = await modelUserTaller.find({idCourse: req.params.idCourse}).sort({createdAt: -1});
        res.status(200).json(usuariosTaller);
    } catch (error) {
        res.status(500).json({message: "Error del servidor"}, error);
        console.log(error);
    }

};//LISTA RUTA CON CODIGO

userTallerCtrl.deleteUsersTaller = async (req, res) => {
    try {
        await modelUserTaller.findByIdAndDelete(req.params.idUserTaller);
        res.status(200).json({message: "Usuario eliminado."});
    } catch (error) {
        
    }
};//LISTA RUTA CON CODIGO

userTallerCtrl.createSendEmail = async (req, res) => {
    try {
        const { emailUser, message, linksCorreo,  nameUser } = req.body;

        let enlaces = ``;

        for (let i = 0; i < linksCorreo.length; i++) {
            enlaces += `
                <p>${linksCorreo[i].tituloEnlace}</p>
                <p>
                    <a rel="noreferrer" target="_blank" href="${linksCorreo[i].enlace}" >
                        ${linksCorreo[i].enlace}
                    </a>
                </p>
            `
        };

        const htmlContentUser = `
            <div>                    
                <h3 style="font-family: sans-serif; margin: 15px 15px;">Gracias por inscribirte a nuestro Taller ${nameUser}</h3>
                <div>
                    ${message}
                    ${enlaces}
                </div>
            </div>
        `;

        
        await sendEmail.sendEmail(
            emailUser,
            "Registro Taller",
            htmlContentUser,
            "Uniline Registro Taller"
        );
        res.status(200).json({ message: 'Correo enviado ' });
    } catch (error) {
    res.status(500).json({ message: error });
    console.log(error);
    }
};//LISTA RUTA CON CODIGO

module.exports = userTallerCtrl;
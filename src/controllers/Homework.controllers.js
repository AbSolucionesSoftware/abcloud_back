const homeworkCtrl = {};
const modelHomework = require('../models/HomeWork');
const uploadFileAws = require('../middleware/awsFile');

homeworkCtrl.uploadFile = async (req,res,next) => {
    try {
        await uploadFileAws.uploadFile(req, res, function (err) {
            if (err) {
              res.status(500).json({ message: err });
            }
            return next();
          });
    } catch (error) {
        res.status(505).json({ message: "Error del servidor", error });
        console.log(error);
    }
}

homeworkCtrl.createHomework = async (req,res) => {
    try {
        /* const { qualificationHomework } = req.body; */
        /* const { qualificationHomework } = req.body;  */
        const createHomework = new modelHomework();
        if(req.file){
            createHomework.homeworkFileKey = req.file.key;
            createHomework.homeworkFileUrl = req.file.location;
            createHomework.idUser = req.params.idUser;
            createHomework.idCourse = req.params.idCourse;
            await createHomework.save(async function(err, HomeWork){
                if(err){
                    res.status(404).json({message: "Error de registro.",err})
                }else{
                    if(!HomeWork){
                        res.status(404).json({message: "La tarea no fue encontrada."})
                    }else{
                        res.status(200).json({message: "Tarea subida correctamente.", HomeWork})
                    }
                }
            });
        }else{
            res.status(404).json({message: "La tarea no fue encontrada.", info: { body: req.body, file: req.file }});    
        }
    } catch (error) {
        res.status(505).json({ message: "Error del servidor", error });
        console.log(error);
    }
}

homeworkCtrl.qualificationHomeworkteacher = async (req,res) => {
    try {
        const {qualificationHomework} = req.body;
        await modelHomework.findByIdAndUpdate(req.params.idHomework,{qualificationHomework});
        res.status(200).json({message: "Tarea calificada."})
    } catch (error) {
        res.status(505).json({ message: "Error del servidor", error });
        console.log(error);
    }
}

homeworkCtrl.getHomeworks = async (req,res) => {
    try {
        const homeworks = await modelHomework.find({idCourse: req.params.idCourse}).populate('idUser idCourse');
        res.status(200).json(homeworks);
    } catch (error) {
        res.status(505).json({ message: "Error del servidor", error });
        console.log(error);
    }
}

homeworkCtrl.getHomeworkUser = async (req,res) => {
    try {
        const homeworks = await modelHomework.findOne({idUser: req.params.idUser, idCourse: req.params.idCourse});
        // console.log(homeworks);
        res.status(200).json(homeworks);
    } catch (error) {
        res.status(505).json({ message: "Error del servidor", error });
        console.log(error);
    }
}

homeworkCtrl.deleteHomeworks = async (req,res) => {
    try {
        const homework = await modelHomework.findById(req.params.idHomework);
        if(homework){
            await modelHomework.findByIdAndDelete(req.params.idHomework);
            res.status(200).json({message: "Tarea eliminada."})
        }else{
            res.status(404).json({message: "Esta tarea no existe."})
        }
    } catch (error) {
        res.status(505).json({ message: "Error del servidor", error });
        console.log(error);
    }
}


module.exports = homeworkCtrl;
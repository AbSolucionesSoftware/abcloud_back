const courseCtrl = {};
const modelInscription = require("../models/Inscription");

//certificados 

courseCtrl.getCertificate = async (req, res) => {
  try {
    const { numberCertificate } = req.params;
    const certificate = await modelInscription
      .findOne({ numCertificate: numberCertificate })
      .populate("idCourse idUser");
    if (!certificate) {
      {
        res.status(400).json({ message: "Este certificado no existe" });
      }
      return;
    }
    const result = {
        certificate_number: certificate.numCertificate,
        user: certificate.idUser.name,
        course: certificate.idCourse.title,
        finish_date: certificate.endDate

    }
    res.status(200).json(result);
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

module.exports = courseCtrl;

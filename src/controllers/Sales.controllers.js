const salesTeacherCtrl = {};
const payModel = require("../models/Pay");
const modelInscription = require("../models/Inscription");
const moment = require("moment");

salesTeacherCtrl.getSalesTeacher = async (req, res) => {
  try {
    const field = req.query.field ? req.query.field : "";
    const search = req.query.search ? req.query.search : "";
    const options = {
      page: req.query.page ? req.query.page : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 10,
      sort: { createdAt: -1 },
      populate: [
        { path: "idUser" },
        { path: "courses.idCourse", model: "course" },
        { path: "idService" },
      ],
    };
    const paginatedResults = await payModel.paginate(
      field
        ? field === "nameUser"
          ? { nameUser: { $regex: ".*" + search + ".*", $options: "i" } }
          : { [field]: search }
        : null,
      options
    );
    res.status(200).json(paginatedResults);
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

salesTeacherCtrl.getDivididedCountsSalesTeacher = async (req, res) => {
  try {
    const totalPays = payModel.countDocuments();
    /* const totalPaysSuccess = payModel.countDocuments({ statusPay: true }); */
    const failedsPays = payModel.countDocuments({ statusPay: false });
    /* const paypalPays = payModel.countDocuments({
      statusPay: true,
      typePay: "paypal",
    }); */
    /* const stripePays = payModel.countDocuments({
      statusPay: true,
      typePay: "stripe",
    }); */

    const totalPaysSuccess = payModel.aggregate([
      {
        $match: { statusPay: true },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$total" } },
          count: { $sum: 1 },
        },
      },
    ]);

    const paypalPays = payModel.aggregate([
      {
        $match: { statusPay: true, typePay: "paypal" },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$total" } },
          count: { $sum: 1 },
        },
      },
    ]);

    const stripePays = payModel.aggregate([
      {
        $match: { statusPay: true, typePay: "stripe" },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$total" } },
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      totalPays: await totalPays,
      totalPaysSuccess: await totalPaysSuccess,
      failedsPays: await failedsPays,
      paypalPays: await paypalPays,
      stripePays: await stripePays,
    };
    res.status(200).json(result);
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

salesTeacherCtrl.getSalesToExport = async (req, res) => {
  try {
    const fechaActual = new Date();
    const fechaInicial = req.query.value
      ? moment().subtract(req.query.value, "week").utc().format()
      : "";
    let payments = [];
    if (!fechaInicial) {
      payments = await payModel
        .find({ statusPay: true })
        .populate([
          { path: "idUser" },
          { path: "courses.idCourse", model: "course" },
        ])
        .sort({ createdAt: -1 });
    } else {
      payments = await payModel.aggregate([
        {
          $sort: { createdAt: -1 },
        },
        {
          $match: {
            $and: [
              {
                createdAt: {
                  $gte: new Date(fechaInicial),
                  $lte: fechaActual,
                },
              },
              {
                statusPay: true,
              },
            ],
          },
        },
        {
          $lookup: {
            from: "courses",
            localField: "courses.idCourse",
            foreignField: "_id",
            as: "courses",
          },
        },
      ]);
    }
    res.status(200).json(payments);
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

salesTeacherCtrl.getOnlyCoursesSales = async (req, res) => {
  try {
    const options = {
      page: req.query.page,
      limit: req.query.limite,
    };
    const filtro = req.query.filter;
    const payments = modelInscription.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      {
        $lookup: {
          from: "pays",
          let: { course: "$idCourse", user: "$idUser", status: true },
          pipeline: [
            {
              $unwind: { path: "$courses" },
            },
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$courses.idCourse", { $toObjectId: "$$course" }] },
                    { $eq: ["$idUser", { $toObjectId: "$$user" }] },
                    { $eq: ["$statusPay", "$$status"] },
                  ],
                },
              },
            },
          ],
          as: "payment",
        },
      },
      {
        $lookup: {
          from: "courses",
          localField: "idCourse",
          foreignField: "_id",
          as: "idCourse",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "idUser",
          foreignField: "_id",
          as: "idUser",
        },
      },
      {
        $unwind: { path: "$payment" },
      },
      {
        $unwind: { path: "$idCourse" },
      },
      {
        $unwind: { path: "$idUser" },
      },
      {
        $match: {
          $or: [
            {
              "idCourse.title": { $regex: ".*" + filtro + ".*", $options: "i" },
            },
            { "idUser.name": { $regex: ".*" + filtro + ".*", $options: "i" } },
            {
              "coupon_discount.coupon_code": {
                $regex: ".*" + filtro + ".*",
                $options: "i",
              },
            },
          ],
          $and: [
            {
              code: false,
              freeCourse: false,
            },
          ],
        },
      },
    ]);
    const inscriptionsPopulated = await modelInscription.aggregatePaginate(
      payments,
      options
    );
    res.status(200).json(inscriptionsPopulated);
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

salesTeacherCtrl.getSalesCoursesToExport = async (req, res) => {
  try {
    const fechaActual = new Date();
    const fechaInicial = req.query.value
      ? moment().subtract(req.query.value, "week").utc().format()
      : "";
    let andFilter = {
      code: false,
      freeCourse: false,
    };
    if (fechaInicial) {
      andFilter.createdAt = {
        $gte: new Date(fechaInicial),
        $lte: fechaActual,
      }
    }
    const inscriptionPayments = await modelInscription.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      {
        $lookup: {
          from: "pays",
          let: { course: "$idCourse", user: "$idUser", status: true },
          pipeline: [
            {
              $unwind: { path: "$courses" },
            },
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$courses.idCourse", { $toObjectId: "$$course" }] },
                    { $eq: ["$idUser", { $toObjectId: "$$user" }] },
                    { $eq: ["$statusPay", "$$status"] },
                  ],
                },
              },
            },
          ],
          as: "payment",
        },
      },
      {
        $lookup: {
          from: "courses",
          localField: "idCourse",
          foreignField: "_id",
          as: "idCourse",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "idUser",
          foreignField: "_id",
          as: "idUser",
        },
      },
      {
        $unwind: { path: "$payment" },
      },
      {
        $unwind: { path: "$idCourse" },
      },
      {
        $unwind: { path: "$idUser" },
      },
      {
        $match: {
          $and: [andFilter],
        },
      },
    ]);
    res.status(200).json(inscriptionPayments);
  } catch (error) {
    res.status(505).json({ message: "Error del servidor", error });
    console.log(error);
  }
};

module.exports = salesTeacherCtrl;

const {Router} = require('express');
const router = Router();
const auth = require('../middleware/auth');

const { getSalesTeacher, getDivididedCountsSalesTeacher, getSalesToExport, getOnlyCoursesSales, getSalesCoursesToExport } = require('../controllers/Sales.controllers');

router.route('/:idTeacher').get(auth, getSalesTeacher);

router.route('/:idTeacher/courses').get(auth, getOnlyCoursesSales);

router.route('/graphics/:idTeacher').get(auth, getDivididedCountsSalesTeacher);

router.route('/export/:idTeacher').get(auth, getSalesToExport);

router.route('/export/courses/:idTeacher').get(auth, getSalesCoursesToExport);

module.exports = router;
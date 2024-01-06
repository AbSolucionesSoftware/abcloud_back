const { Router } = require("express");
const router = Router();
const auth = require("../middleware/auth");

const {
  agregateCategorie,
  createSubcategories,
  editSubcategories,
  getCategories,
  editCategories,
  deleteCategories,
  deleteSubcategories,
  getCategoriesNavbar,
  getCategoriesFilter,
} = require("../controllers/Categories.controllers");

router.route("/").post(auth, agregateCategorie).get(getCategories);

router.route("/navbar").get(getCategoriesNavbar);

router.route("/filter").get(getCategoriesFilter);

router
  .route("/:id_categorie")
  .put(auth, editCategories)
  .delete(auth, deleteCategories);

router.route("/subcategories/:id_categorie").post(auth, createSubcategories);

router
  .route("/subcategories/:id_categorie/:id_subcategorie")
  .put(auth, editSubcategories)
  .delete(auth, deleteSubcategories);

module.exports = router;

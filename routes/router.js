"user-strict";
const express = require("express");
const { loginUser, superAdminLogin } = require("../auth");
const {
  userAuthCheck,
  superUserAuthCheck,
  generalAuthCheck,
} = require("../middleware");
const {
  createProductCategory,
  getStores,
  updateStore,
  deleteStore,
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  assignPermissionToRole,
  getRolePermissions,
  removePermissionFromRole,
  getAllProductCategories,
  getProductCategoryById,
  updateProductCategory,
  deleteProductCategory,
  createStore,
  getAllPermissions,
  createProduct,
  getAllProducts,
  getProductById,
} = require("../controllers/index1");
const { encdec } = require("../utils/encdec");
const router = express.Router();
// login
router.post("/login-user", encdec, loginUser);
router.post("/login-super-user", encdec, superAdminLogin);
// store related api =========================================================================================
router.get("/get-store", superUserAuthCheck, getStores);
router.post("/create-store", superUserAuthCheck, encdec, createStore);
router.post("/update-store", superUserAuthCheck, encdec, updateStore);
router.post("/delete-store", superUserAuthCheck, encdec, deleteStore);
// role related api =======================================================================================
router.post("/create-role", superUserAuthCheck, encdec, createRole);
router.get("/get-role", generalAuthCheck, getAllRoles);
router.get("/get-role-by-id", generalAuthCheck, getRoleById);
router.post("/update-role", superUserAuthCheck, encdec, updateRole);
router.get("/delete-role", superUserAuthCheck, deleteRole);
// user related api ==============================================================================================
router.get("/get-user", superUserAuthCheck, getAllUsers);
router.get("/get-user-by-id", generalAuthCheck, getUserById);
router.post("/update-user-by-id", superUserAuthCheck, encdec, updateUser);
router.get("/delete-user", superUserAuthCheck, deleteUser);
// permission related api ======================================================================================
router.get("/get-type-of-permission", superUserAuthCheck, getAllPermissions);
router.get(
  "/assign-permission-to-role",
  superUserAuthCheck,
  assignPermissionToRole
);
router.get("/get-role-permission", superUserAuthCheck, getRolePermissions);
router.get(
  "/remove-permission-from-role",
  superUserAuthCheck,
  removePermissionFromRole
);
// category related api =================================================================================================
router.post("/create-product-category", userAuthCheck, createProductCategory);
router.get("/get-product-category", generalAuthCheck, getAllProductCategories);
router.get(
  "/get-product-category-by-id",
  generalAuthCheck,
  getProductCategoryById
);
router.post("/update-product-category", userAuthCheck, updateProductCategory);
router.get("/delete-product-category", userAuthCheck, deleteProductCategory);

// product related api's =====================================================================
router.post("/create-product", userAuthCheck, createProduct);
router.get("/get-all-products", userAuthCheck, getAllProducts);
router.get("/get-product-by-id", userAuthCheck, getProductById);
module.exports = router;

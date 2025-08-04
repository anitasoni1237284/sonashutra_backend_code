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
} = require("../controllers/index1");
const router = express.Router();
// login
router.post("/login-user", loginUser);
router.post("/login-super-user", superAdminLogin);
// store related api ===================================================== ===================================
router.get("/get-store", superUserAuthCheck, getStores);
router.post("/create-store", superUserAuthCheck, createStore);
router.post("/update-store", superUserAuthCheck, updateStore);
router.post("/delete-store", superUserAuthCheck, deleteStore);
// role related api =======================================================================================
router.post("/create-role", superUserAuthCheck, createRole);
router.get("/get-role", generalAuthCheck, getAllRoles);
router.get("/get-role-by-id", generalAuthCheck, getRoleById);
router.post("/update-role", superUserAuthCheck, updateRole);
router.get("/delete-role", superUserAuthCheck, deleteRole);
// user related api ==============================================================================================
router.get("/get-user", superUserAuthCheck, getAllUsers);
router.get("/get-user-by-id", generalAuthCheck, getUserById);
router.post("/update-user-by-id", superUserAuthCheck, updateUser);
router.get("/delete-user", superUserAuthCheck, deleteUser);
// permission related api ======================================================================================
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
module.exports = router;

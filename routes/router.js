"user-strict";
const express = require("express");
const { loginUser, superAdminLogin } = require("../auth");
const {
  userAuthCheck,
  superUserAuthCheck,
  generalAuthCheck,
  customerAuthCheck,
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
  updateProduct,
  deleteProduct,
  createProductImage,
  getProductImages,
  updateProductImage,
  deleteProductImage,
  createProductAttribute,
  getProductAttributes,
  createUnit,
  getAllUnits,
  updateUnit,
  deleteUnit,
  createProductAttributeValue,
  getProductAttributeValues,
  updateProductAttribute,
  updateProductAttributeValue,
  deleteProductAttribute,
  deleteProductAttributeValue,
  createUser,

} = require("../controllers/index1");
const { encdec } = require("../utils/encdec");
const { createInventory, getInventory, updateInventory } = require("../controllers/index2");
const { createCustomer, loginCustomer, getAllCustomers, getCustomersProfile, updateCustomer } = require("../controllers/customer");
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
router.post("/create-user",encdec, createUser);
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
router.post("/update-product", userAuthCheck, updateProduct);
router.get("/delete-product", userAuthCheck, deleteProduct);
// product image related api's ============================================================
router.post("/upload-product-image", userAuthCheck, createProductImage);
router.get("/get-product-image", userAuthCheck, getProductImages);
router.post("/update-product-image", userAuthCheck, updateProductImage);
router.get("/delete-product-image", userAuthCheck, deleteProductImage);
// unis related api's
router.post("/create-units", userAuthCheck, createUnit);
router.get("/get-all-units", userAuthCheck, getAllUnits);
router.post("/update-units", userAuthCheck, updateUnit);
router.get("/delete-units", userAuthCheck, deleteUnit);
// get attribute related api's ===========================================================================
router.post(
  "/create-product-attributes",
  userAuthCheck,
  createProductAttribute
);
router.get("/get-product-attributes", userAuthCheck, getProductAttributes);
router.post(
  "/update-product-attributes",
  userAuthCheck,
  updateProductAttribute
);
router.get("/delete-product-attributes", userAuthCheck, deleteProductAttribute);
// product attribute values related api's ===============================================
router.post(
  "/create-product-attribute-value",
  userAuthCheck,
  createProductAttributeValue
);
router.get(
  "/get-product-attribute-value",
  userAuthCheck,
  getProductAttributeValues
);
router.post(
  "/update-attribute-value",
  userAuthCheck,
  updateProductAttributeValue
);
router.get(
  "/delete-attribute-value",
  userAuthCheck,
  deleteProductAttributeValue
);
// inventory related ap's
router.post("/create-product-inventory", userAuthCheck, createInventory);
router.get("/get-product-inventory", userAuthCheck, getInventory);
router.post("/update-product-inventory", userAuthCheck, updateInventory);
// customer related api's
router.post("/create-customer", createCustomer);
router.post("/login-customer", loginCustomer);
router.get("/get-all-customer",userAuthCheck, getAllCustomers);
router.get("/get-customer-profile",customerAuthCheck, getCustomersProfile);
router.post("/update-customer-profile",customerAuthCheck, updateCustomer);
module.exports = router;

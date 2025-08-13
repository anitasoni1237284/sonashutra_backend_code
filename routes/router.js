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
const {
  createInventory,
  getInventory,
  updateInventory,
  createCustomerOrder,
  createDiscount,
  getAllDiscounts,
  updateDiscount,
  deleteDiscount,
  createProductDiscount,
  getAllProductDiscounts,
  updateProductDiscount,
  deleteProductDiscount,
  createTax,
  getAllTaxes,
  updateTax,
  deleteTax,
  createProductTax,
  getAllProductTaxes,
  updateProductTax,
  deleteProductTax,
  createPaymentMethod,
  getPaymentMethod,
} = require("../controllers/index2");
const {
  createCustomer,
  loginCustomer,
  getAllCustomers,
  getCustomersProfile,
  updateCustomer,
  createShippingAddress,
  setShippingAddressAsDefault,
  getShippingAddress,
} = require("../controllers/customer");
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
router.post("/create-user", encdec, createUser);
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
// discount related api's
router.post("/create-discount", userAuthCheck, createDiscount);
router.get("/get-discount", generalAuthCheck, getAllDiscounts);
router.post("/update-discount", userAuthCheck, updateDiscount);
router.get("/delete-discount", userAuthCheck, deleteDiscount);
// product discount related api's
router.post("/create-product-discount", userAuthCheck, createProductDiscount);
router.get("/get-product-discount", generalAuthCheck, getAllProductDiscounts);
router.post("/update-product-discount", userAuthCheck, updateProductDiscount);
router.get("/delete-product-discount", userAuthCheck, deleteProductDiscount);
// tax related api's
router.post("/create-tax", userAuthCheck, createTax);
router.get("/get-tax", userAuthCheck, getAllTaxes);
router.post("/update-tax", userAuthCheck, updateTax);
router.get("/delete-tax", userAuthCheck, deleteTax);

// create product tax
router.post("/create-product-tax", userAuthCheck, createProductTax);
router.get("/get-product-tax", userAuthCheck, getAllProductTaxes);
router.post("/update-product-tax", userAuthCheck, updateProductTax);
router.get("/delete-product-tax", userAuthCheck, deleteProductTax);
// create payment methods
router.post("/create-payment-method", userAuthCheck, createPaymentMethod);
router.get("/get-payment-method", userAuthCheck, getPaymentMethod);
// customer related api's
router.post("/create-customer", createCustomer);
router.post("/login-customer", loginCustomer);
router.get("/get-all-customer", userAuthCheck, getAllCustomers);
router.get("/get-customer-profile", customerAuthCheck, getCustomersProfile);
router.post("/update-customer-profile", customerAuthCheck, updateCustomer);
// add shipping address
router.post("/add-shipping-address", customerAuthCheck, createShippingAddress);
router.get("/set-shipping-address-as-default", customerAuthCheck, setShippingAddressAsDefault);
router.get("/get-shipping-address", customerAuthCheck, getShippingAddress);
// order related api's
router.post("/create-order", customerAuthCheck, createCustomerOrder);

module.exports = router;

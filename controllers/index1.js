const uploadToCloudinary = require("../config/cloudinay");
const { returnResponse } = require("../helper/helperResponse");
const { queryDb } = require("../helper/utilityHelper");
const { checkPermission } = require("../middleware");
const cloudinary = require("cloudinary").v2;
const bcrypt = require("bcrypt");
require("dotenv").config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.createStore = async (req, res, next) => {
  try {
    const {
      name,
      description,
      address,
      city,
      state,
      country,
      phone,
      email,
      created_at,
      updated_at,
    } = req.body;

    if (!name) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Name is required."));
    }

    const query = `
      INSERT INTO sn_store
        (name, description, address, city, state, country, phone, email, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const now = new Date();
    await queryDb(query, [
      name,
      description || null,
      address || null,
      city || null,
      state || null,
      country || null,
      phone || null,
      email || null,
      created_at || now,
      updated_at || now,
    ]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Store created successfully."));
  } catch (err) {
    next(err);
  }
};

exports.getStores = async (req, res, next) => {
  try {
    const query = `SELECT * FROM sn_store`;
    const result = await queryDb(query);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Stores fetched successfully.", result)
      );
  } catch (err) {
    next(err);
  }
};

exports.updateStore = async (req, res, next) => {
  try {
    const {
      store_id,
      name,
      description,
      address,
      city,
      state,
      country,
      phone,
      email,
      updated_at,
      status = 1,
    } = req.body;

    if (!store_id) {
      return res
        .status(201)
        .json(returnResponse(false, true, "store_id is required."));
    }

    const query = `
      UPDATE sn_store
      SET name = ?, description = ?, address = ?, city = ?, state = ?, country = ?,
          phone = ?, email = ?, updated_at = ?,status = ?
      WHERE store_id = ?
    `;

    const now = updated_at || new Date();

    await queryDb(query, [
      name,
      description || null,
      address || null,
      city || null,
      state || null,
      country || null,
      phone || null,
      email || null,
      now,
      status,
      store_id,
    ]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Store updated successfully."));
  } catch (err) {
    next(err);
  }
};

exports.deleteStore = async (req, res, next) => {
  try {
    const { store_id } = req.body;
    if (!store_id) {
      return res
        .status(201)
        .json(returnResponse(false, true, "store_id is required."));
    }

    const query = `DELETE FROM sn_store WHERE store_id = ?`;
    await queryDb(query, [store_id]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Store deleted successfully."));
  } catch (err) {
    next(err);
  }
};

// Role Controller
exports.createRole = async (req, res, next) => {
  try {
    const { roleName } = req.body;
    const query = "INSERT INTO sn_role (roleName) VALUES (?);";
    await queryDb(query, [roleName]);
    return res
      .status(200)
      .json(returnResponse(true, false, "Role created successfully."));
  } catch (e) {
    next(e);
  }
};

exports.getAllRoles = async (req, res, next) => {
  try {
    const query = "SELECT * FROM sn_role;";
    const result = await queryDb(query);
    return res
      .status(200)
      .json(returnResponse(true, false, "All roles fetched.", result));
  } catch (e) {
    next(e);
  }
};

exports.getRoleById = async (req, res, next) => {
  try {
    const { roleId } = req.query;
    if (!roleId)
      return res
        .status(201)
        .json(returnResponse(true, false, "roleId is required!"));
    const query = "SELECT * FROM sn_role WHERE roleId = ?;";
    const result = await queryDb(query, [roleId]);
    if (result.length === 0) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Role not found.", null));
    }
    return res
      .status(200)
      .json(
        returnResponse(true, false, "Role fetched successfully.", result[0])
      );
  } catch (e) {
    next(e);
  }
};

exports.updateRole = async (req, res, next) => {
  try {
    const { roleId, roleName } = req.body;
    if (!roleId || !roleName)
      return res
        .status(201)
        .json(returnResponse(true, false, "roleId and roleName is required!"));
    const query = "UPDATE sn_role SET roleName = ? WHERE roleId = ?;";
    await queryDb(query, [roleName, roleId]);
    return res
      .status(200)
      .json(returnResponse(true, false, "Role updated successfully.", null));
  } catch (e) {
    next(e);
  }
};

exports.deleteRole = async (req, res, next) => {
  try {
    const { roleId } = req.query;
    if (!roleId)
      return res
        .status(201)
        .json(returnResponse(true, false, "roleId is required!"));
    const query = "DELETE FROM sn_role WHERE roleId = ?;";
    await queryDb(query, [roleId]);
    return res
      .status(200)
      .json(returnResponse(true, false, "Role deleted successfully.", null));
  } catch (e) {
    next(e);
  }
};
// User Controller
exports.createUser = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(req.userId, "create_user");
    if (!hasPermission) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "You do not have permission to this action."
          )
        );
    }
    const {
      username,
      password,
      email,
      roleId,
      status = 1,
      store_id,
    } = req.body;
    const createdAt = new Date();
    const updatedAt = new Date();

    if (!store_id || !roleId || !username || !password || !email) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "store_id, roleId, username, password, email is required."
          )
        );
    }

    // Hash the password
    const saltRounds = Number(process.env.SALT_ROUND);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const query = `
      INSERT INTO sn_user 
      (username, password, email, roleId, status, createdAt, updatedAt, store_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;

    await queryDb(query, [
      username,
      hashedPassword, // Save hashed password
      email,
      roleId,
      status,
      createdAt,
      updatedAt,
      store_id,
    ]);

    return res
      .status(200)
      .json(returnResponse(true, false, "User created successfully."));
  } catch (e) {
    next(e);
  }
};
exports.getAllUsers = async (req, res, next) => {
  try {
    const query = `
      SELECT u.*, r.roleName 
      FROM sn_user u
      LEFT JOIN sn_role r ON u.roleId = r.roleId
      LEFT JOIN sn_store s ON u.store_id = s.store_id
      ;
    `;
    const result = await queryDb(query);
    return res
      .status(200)
      .json(returnResponse(true, false, "All users fetched.", result));
  } catch (e) {
    next(e);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res
        .status(201)
        .json(returnResponse(false, true, "userId is required."));
    }
    const query = `
      SELECT u.*, r.roleName 
      FROM sn_user u
      LEFT JOIN sn_role r ON u.roleId = r.roleId
      LEFT JOIN sn_store s ON u.store_id = s.store_id
      WHERE u.userId = ?;
    `;
    const result = await queryDb(query, [userId]);

    if (result.length === 0) {
      return res
        .status(201)
        .json(returnResponse(false, true, "User not found.", null));
    }

    return res
      .status(200)
      .json(
        returnResponse(true, false, "User fetched successfully.", result[0])
      );
  } catch (e) {
    next(e);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(req.userId, "update_user");
    if (!hasPermission) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "You do not have permission to this action."
          )
        );
    }
    const {
      userId,
      username,
      password,
      email,
      roleId,
      status = 1,
      store_id,
    } = req.body;
    if (!userId || !store_id || !roleId) {
      return res
        .status(201)
        .json(
          returnResponse(false, true, "userId,store_id,roleId is required.")
        );
    }
    const updatedAt = new Date();

    const query = `
      UPDATE sn_user 
      SET username = ?, password = ?, email = ?, roleId = ?, status = ?, updatedAt = ?,store_id = ?
      WHERE userId = ?;
    `;
    await queryDb(query, [
      username,
      password,
      email,
      roleId,
      status,
      updatedAt,
      store_id,
      userId,
    ]);

    return res
      .status(200)
      .json(returnResponse(true, false, "User updated successfully.", null));
  } catch (e) {
    next(e);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res
        .status(201)
        .json(returnResponse(false, true, "userId is required."));
    }
    const query = "DELETE FROM sn_user WHERE userId = ?;";
    await queryDb(query, [userId]);

    return res
      .status(200)
      .json(returnResponse(true, false, "User deleted successfully.", null));
  } catch (e) {
    next(e);
  }
};

// ======================= ROLE PERMISSION ===========================
exports.assignPermissionToRole = async (req, res, next) => {
  try {
    const { roleId, permissionId } = req.query;
    if (!roleId || !permissionId) {
      return res
        .status(201)
        .json(
          returnResponse(false, true, "roleId and permissionId is required.")
        );
    }
    const result = await queryDb(
      "INSERT INTO sn_role_permission (roleId, permissionId) VALUES (?, ?);",
      [roleId, permissionId]
    );
    return res
      .status(200)
      .json(
        returnResponse(true, false, "Permission assigned to role.", result)
      );
  } catch (e) {
    next(e);
  }
};

exports.getRolePermissions = async (req, res, next) => {
  try {
    const { roleId } = req.query;
    if (!roleId) {
      return res
        .status(201)
        .json(returnResponse(false, true, "roleId is required."));
    }
    const result = await queryDb(
      `SELECT rp.*, p.permissionName FROM sn_role_permission rp
       JOIN sn_permission p ON rp.permissionId = p.permissionId
       WHERE rp.roleId = ?;`,
      [roleId]
    );
    return res
      .status(200)
      .json(
        returnResponse(true, false, "Permissions for role fetched.", result)
      );
  } catch (e) {
    next(e);
  }
};

exports.removePermissionFromRole = async (req, res, next) => {
  try {
    const { roleId, permissionId } = req.query;
    if (!roleId || !permissionId) {
      return res
        .status(201)
        .json(
          returnResponse(false, true, "roleId and permissionId is required.")
        );
    }
    const result = await queryDb(
      "DELETE FROM sn_role_permission WHERE roleId = ? AND permissionId = ?;",
      [roleId, permissionId]
    );
    return res
      .status(200)
      .json(
        returnResponse(true, false, "Permission removed from role.", result)
      );
  } catch (e) {
    next(e);
  }
};

// Create Product Category
exports.createProductCategory = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(
      req.userId,
      "create_product_category"
    );

    if (!hasPermission) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "You do not have permission to create categories."
          )
        );
    }
    const { name, description } = req.body;
    const file = req?.files?.file;

    if (!name || !description) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Category name and description is required."
          )
        );
    }
    const q = "SELECT 1 FROM `sn_product_category` WHERE `name` = ? LIMIT 1;";
    const result = await queryDb(q, [name]);
    let imageUrl = null;
    if (result?.length > 0)
      return res
        .status(201)
        .json(returnResponse(false, true, "Category name already exists!"));
    if (file) {
      imageUrl = await uploadToCloudinary(file.data, "product_categories");
    }

    const query =
      "INSERT INTO sn_product_category (name, description, cat_image) VALUES (?, ?, ?)";
    await queryDb(query, [name, description, imageUrl]);
    console.log(imageUrl);
    return res
      .status(200)
      .json(returnResponse(true, false, "Category created successfully."));
  } catch (e) {
    console.log(e);
    next(e);
  }
};

// Get All Product Categories
exports.getAllProductCategories = async (req, res, next) => {
  try {
    const query = "SELECT * FROM sn_product_category";
    const result = await queryDb(query);
    return res
      .status(200)
      .json(returnResponse(true, false, "Categories fetched.", result));
  } catch (e) {
    next(e);
  }
};

// Get Product Category by ID
exports.getProductCategoryById = async (req, res, next) => {
  try {
    const { product_category_id } = req.query;
    if (!product_category_id) {
      return res
        .status(201)
        .json(returnResponse(false, true, "product_category_id is required."));
    }
    const query =
      "SELECT * FROM sn_product_category WHERE product_category_id = ?";
    const result = await queryDb(query, [product_category_id]);

    if (result.length === 0) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Category not found."));
    }

    return res
      .status(200)
      .json(returnResponse(true, false, "Category fetched.", result[0]));
  } catch (e) {
    next(e);
  }
};

// Update Product Category
exports.updateProductCategory = async (req, res, next) => {
  const hasPermission = await checkPermission(
    req.userId,
    "update_product_category"
  );
  if (!hasPermission) {
    return res
      .status(201)
      .json(
        returnResponse(
          false,
          true,
          "You do not have permission to this action."
        )
      );
  }

  try {
    const { product_category_id, name, description } = req.body;
    const file = req?.files?.file;

    if (!product_category_id || !name) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "product_category_id and name is required."
          )
        );
    }

    let imageUrl = null;

    if (file) {
      imageUrl = await uploadToCloudinary(file.data, "product_categories");
    }

    let query;
    let params;

    if (imageUrl) {
      query = `UPDATE sn_product_category 
               SET name = ?, description = ?, cat_image = ? 
               WHERE product_category_id = ?`;
      params = [name, description || null, imageUrl, product_category_id];
    } else {
      query = `UPDATE sn_product_category 
               SET name = ?, description = ? 
               WHERE product_category_id = ?`;
      params = [name, description || null, product_category_id];
    }

    await queryDb(query, params);

    return res
      .status(200)
      .json(returnResponse(true, false, "Category updated successfully."));
  } catch (e) {
    next(e);
  }
};
// Delete Product Category
exports.deleteProductCategory = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(
      req.userId,
      "delete_product_category"
    );
    if (!hasPermission) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "You do not have permission to this action."
          )
        );
    }
    const { product_category_id } = req.body;
    if (!product_category_id) {
      return res
        .status(201)
        .json(returnResponse(false, true, "product_category_id is required."));
    }
    const query =
      "DELETE FROM sn_product_category WHERE product_category_id = ?";
    await queryDb(query, [product_category_id]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Category deleted successfully."));
  } catch (e) {
    next(e);
  }
};
// Create Product
exports.createProduct = async (req, res, next) => {
  const store = req.storeId;
  try {
    const hasPermission = await checkPermission(req.userId, "create_product");
    if (!hasPermission) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "You do not have permission to this action."
          )
        );
    }

    const { name, description, price, product_category_id } = req.body;
    const files = req?.files?.file; // can be single or multiple
    if (!name || !price) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Name and Price are required."));
    }

    const created_at = new Date();
    const updated_at = new Date();
    const q = "SELECT 1 FROM `sn_product` WHERE `name` = ? LIMIT 1;";
    const results = await queryDb(q, [name]);
    if (results?.length > 0)
      return res
        .status(201)
        .json(returnResponse(false, true, "Product name already exists!"));

    // Step 1: Insert product
    const insertQuery = `
      INSERT INTO sn_product 
      (name, description, price, product_category_id, created_at, updated_at, store_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await queryDb(insertQuery, [
      name,
      description || null,
      price,
      product_category_id || null,
      created_at,
      updated_at,
      store,
    ]);

    const productId = result;

    // Step 2: Upload image(s) and insert into sn_product_image
    if (files) {
      const imageFiles = Array.isArray(files) ? files : [files];

      for (const file of imageFiles) {
        const imageUrl = await uploadToCloudinary(file.data, "product_images");
        const imageQuery = `
          INSERT INTO sn_product_image (p_product_id, p_image_url, p_created_at)
          VALUES (?, ?, ?)
        `;
        await queryDb(imageQuery, [productId, imageUrl, new Date()]);
      }
    }

    return res
      .status(200)
      .json(returnResponse(true, false, "Product created successfully."));
  } catch (e) {
    next(e);
  }
};

// Get All Products

exports.getAllProducts = async (req, res, next) => {
  try {
    const {
      category_id = null,
      search = "",
      start_date = "",
      end_date = "",
      page = 1,
      count = 10,
    } = req.query;
    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(count), 1);
    const offset = (pageNumber - 1) * pageSize;

    let countQuery = `SELECT COUNT(*) AS cnt FROM sn_product_details WHERE 1 `;
    let baseQuery = `
      SELECT * FROM sn_product_details WHERE 1 `;

    let reP = [];
    let reB = [];

    if (category_id) {
      countQuery += " AND product_category_id = ?";
      baseQuery += " AND product_category_id = ?";
      reP.push(Number(category_id));
      reB.push(Number(category_id));
    }

    // Date filter
    if (start_date && end_date) {
      const start = moment(start_date).format("YYYY-MM-DD");
      const end = moment(end_date).format("YYYY-MM-DD");
      countQuery += " AND DATE(created_at) BETWEEN ? AND ?";
      baseQuery += " AND DATE(created_at) BETWEEN ? AND ?";
      reP.push(start, end);
      reB.push(start, end);
    }

    // Search filter
    if (search) {
      const s = `%${search}%`;
      const searchCondition = `
        AND (
          name LIKE ? OR 
          description LIKE ? OR 
          price LIKE ?
        )`;
      countQuery += searchCondition;
      baseQuery += searchCondition;
      reP.push(s, s, s);
      reB.push(s, s, s);
    }

    baseQuery += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    reB.push(pageSize, offset);

    const totalRowsResult = await queryDb(countQuery, reP);
    const totalRows = Number(totalRowsResult?.[0]?.cnt) || 0;
    const result = await queryDb(baseQuery, reB);

    return res.status(200).json(
      returnResponse(
        false,
        true,
        {
          data: result,
          totalPage: Math.ceil(totalRows / pageSize),
          currPage: pageNumber,
        },
        "Products fetched."
      )
    );
  } catch (e) {
    next(e);
  }
};
// Get Product by ID
exports.getProductById = async (req, res, next) => {
  try {
    const { product_id } = req.query;
    if (!product_id) {
      return res
        .status(201)
        .json(returnResponse(false, true, "product_id are required."));
    }
    const query = "SELECT * FROM sn_product_details WHERE product_id = ?";
    const result = await queryDb(query, [product_id]);

    if (result.length === 0) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Product not found."));
    }
    return res
      .status(200)
      .json(returnResponse(true, false, "Product fetched.", result[0]));
  } catch (e) {
    next(e);
  }
};

// Update Product
exports.updateProduct = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(req.userId, "update_product");
    if (!hasPermission) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "You do not have permission to this action."
          )
        );
    }
    const { product_id, name, description, price, product_category_id } =
      req.body;
    if (!name || !price || !product_category_id || !product_id) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "product_category_id, price and category are required."
          )
        );
    }
    const updated_at = new Date();

    const query = `
      UPDATE sn_product 
      SET name = ?, description = ?, price = ?, product_category_id = ?, updated_at = ? 
      WHERE product_id = ?`;

    await queryDb(query, [
      name,
      description || null,
      price,
      product_category_id || null,
      updated_at,
      product_id,
    ]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Product updated successfully."));
  } catch (e) {
    next(e);
  }
};

// Delete Product
exports.deleteProduct = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(req.userId, "delete_product");
    if (!hasPermission) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "You do not have permission to this action."
          )
        );
    }
    const { product_id } = req.query;
    const query = "DELETE FROM sn_product WHERE product_id = ?";
    await queryDb(query, [product_id]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Product deleted successfully."));
  } catch (e) {
    next(e);
  }
};
// create product images
exports.createProductImage = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(
      req.userId,
      "upload_product_image"
    );
    if (!hasPermission) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "You do not have permission to this action."
          )
        );
    }
    const { product_id } = req.body;
    const files = req.files?.file;

    if (!files || files.length === 0) {
      return res
        .status(201)
        .json(
          returnResponse(false, true, "At least one image file is required.")
        );
    }

    const fileArray = Array.isArray(files) ? files : [files];

    const values = [];

    for (const file of fileArray) {
      const imageUrl = await uploadToCloudinary(file.data, "product_images");
      values.push([product_id, imageUrl]);
    }

    const query = `INSERT INTO sn_product_image (p_product_id, p_image_url) VALUES ?`;
    await queryDb(query, [values]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Product images uploaded successfully.")
      );
  } catch (e) {
    next(e);
  }
};

exports.getProductImages = async (req, res, next) => {
  try {
    const { product_id } = req.query;
    if (!product_id)
      return res
        .status(201)
        .json(returnResponse(false, true, "product_id is required."));
    const query = `SELECT * FROM sn_product_image WHERE p_product_id = ?`;
    const images = await queryDb(query, [product_id]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Images fetched successfully.", images)
      );
  } catch (e) {
    next(e);
  }
};

exports.updateProductImage = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(
      req.userId,
      "update_product_image"
    );
    if (!hasPermission) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "You do not have permission to this action."
          )
        );
    }
    const { image_id } = req.body;
    if (!image_id)
      return res
        .status(201)
        .json(returnResponse(false, true, "image_id is required."));
    const file = req.files?.file;

    if (!file) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Image file is required."));
    }

    const imageUrl = await uploadToCloudinary(file.data, "product_images");

    const query = `UPDATE sn_product_image SET p_image_url = ? WHERE p_product_id = ?`;
    await queryDb(query, [imageUrl, image_id]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Product image updated successfully."));
  } catch (e) {
    next(e);
  }
};

exports.deleteProductImage = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(
      req.userId,
      "delete_product_image"
    );
    if (!hasPermission) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "You do not have permission to this action."
          )
        );
    }
    const { image_id } = req.query;
    if (!image_id)
      return res
        .status(201)
        .json(returnResponse(false, true, "image_id is required."));
    const query = `DELETE FROM sn_product_image WHERE image_id = ?`;
    await queryDb(query, [image_id]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Product image deleted successfully."));
  } catch (e) {
    next(e);
  }
};
// units related api's
exports.createUnit = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(req.userId, "create_units");
    if (!hasPermission) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "You do not have permission to this action."
          )
        );
    }
    const { un_category, un_name, un_slug, un_description } = req.body;
    if (!un_category || !un_name || !un_slug) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Unit name and slug and un_category are required."
          )
        );
    }
    const q =
      "SELECT 1 FROM `sn_units` WHERE `un_name` = ? AND un_category = ? AND un_slug = ? LIMIT 1;";
    const result = await queryDb(q, [un_name, un_category, un_slug]);
    if (result?.length > 0)
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Same name and slug and attributes unit already exists!"
          )
        );

    const query = `
      INSERT INTO sn_units (un_category,un_name, un_slug, un_descriptoin, un_created_at)
      VALUES (?,?, ?, ?, NOW())
    `;
    await queryDb(query, [un_category, un_name, un_slug, un_description]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Unit created successfully."));
  } catch (e) {
    next(e);
  }
};
exports.getAllUnits = async (req, res, next) => {
  try {
    const { un_category } = req.query;
    if (!un_category)
      return res
        .status(201)
        .json(returnResponse(false, true, "un_category is required."));
    const query = `SELECT * FROM sn_units  LEFT JOIN sn_product_category ON product_category_id = un_category WHERE un_category = ? ORDER BY un_created_at DESC`;
    const result = await queryDb(query, [un_category]);
    return res
      .status(200)
      .json(returnResponse(true, false, "Units fetched successfully.", result));
  } catch (e) {
    next(e);
  }
};
exports.updateUnit = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(req.userId, "update_units");
    if (!hasPermission) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "You do not have permission to this action."
          )
        );
    }
    const { un_category, un_id, un_name, un_slug, un_description } = req.body;

    if (!un_id || !un_category) {
      return res
        .status(201)
        .json(
          returnResponse(false, true, "un_id and un_category is required.")
        );
    }

    const query = `
      UPDATE sn_units
      SET un_name = ?, un_slug = ?, un_descriptoin = ?,un_category = ?
      WHERE un_id = ?
    `;
    await queryDb(query, [
      un_name,
      un_slug,
      un_description,
      un_category,
      un_id,
    ]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Unit updated successfully."));
  } catch (e) {
    next(e);
  }
};
exports.deleteUnit = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(req.userId, "delete_units");
    if (!hasPermission) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "You do not have permission to this action."
          )
        );
    }
    const { un_id } = req.query;

    if (!un_id) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Unit ID is required."));
    }

    const query = `DELETE FROM sn_units WHERE un_id = ?`;
    await queryDb(query, [un_id]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Unit deleted successfully."));
  } catch (e) {
    next(e);
  }
};
// product attributes
exports.createProductAttribute = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(
      req.userId,
      "create_product_attribute"
    );
    if (!hasPermission) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "You do not have permission to this action."
          )
        );
    }
    const { name, category_id, unit_id = 0 } = req.body;
    if (!name || !category_id) {
      return res
        .status(201)
        .json(returnResponse(false, true, "name and category_id is required."));
    }
    const q =
      "SELECT 1 FROM `sn_product_attribute` WHERE `name` = ? AND category_id = ? LIMIT 1;";
    const result = await queryDb(q, [name, category_id]);
    if (result?.length > 0)
      return res
        .status(201)
        .json(returnResponse(false, true, "Attribute name already exists!"));

    const query = `
      INSERT INTO sn_product_attribute (name,category_id,unit_id)
      VALUES (?,?,?)
    `;

    await queryDb(query, [name, category_id, unit_id]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Product attribute created successfully.")
      );
  } catch (err) {
    next(err);
  }
};

exports.getProductAttributes = async (req, res, next) => {
  try {
    const query = `SELECT * FROM sn_product_attribute`;
    const result = await queryDb(query);

    return res
      .status(200)
      .json(
        returnResponse(
          true,
          false,
          "Product attributes fetched successfully.",
          result
        )
      );
  } catch (err) {
    next(err);
  }
};

exports.updateProductAttribute = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(
      req.userId,
      "update_product_attribute"
    );
    if (!hasPermission) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "You do not have permission to this action."
          )
        );
    }
    const { attribute_id, name, unit_id } = req.body;
    console.log(req.body);
    if (!attribute_id || !name) {
      return res
        .status(201)
        .json(
          returnResponse(false, true, "attribute_id and name is required.")
        );
    }

    const query = `
      UPDATE sn_product_attribute
      SET name = ?,
      unit_id = ?
      WHERE attribute_id = ?
    `;

    await queryDb(query, [name, unit_id, attribute_id]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Product attribute updated successfully.")
      );
  } catch (err) {
    next(err);
  }
};

exports.deleteProductAttribute = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(
      req.userId,
      "delete_product_attribute"
    );
    if (!hasPermission) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "You do not have permission to this action."
          )
        );
    }
    const { attribute_id } = req.query;
    if (!attribute_id) {
      return res
        .status(201)
        .json(returnResponse(false, true, "attribute_id is required."));
    }

    const query = `DELETE FROM sn_product_attribute WHERE attribute_id = ?`;
    await queryDb(query, [attribute_id]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Product attribute deleted successfully.")
      );
  } catch (err) {
    next(err);
  }
};
exports.createProductAttributeValue = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(
      req.userId,
      "create_product_attribute_value"
    );
    if (!hasPermission) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "You do not have permission to this action."
          )
        );
    }
    const { product_id, attribute_id, value } = req.body; // vlaue ->> ex: Size: Value=> XL,MD...,
    if (!product_id || !attribute_id) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "product_id and attribute_id are required."
          )
        );
    }
    const q =
      "SELECT 1 FROM `sn_product_attribute_value` WHERE `product_id` = ? AND attribute_id = ? AND value = ?  LIMIT 1;";
    const result = await queryDb(q, [product_id, attribute_id, value]);
    if (result?.length > 0)
      return res
        .status(201)
        .json(
          returnResponse(false, true, "Attribute AND Value already exists!")
        );

    const query = `
      INSERT INTO sn_product_attribute_value (product_id, attribute_id, value)
      VALUES (?, ?, ?)
    `;

    await queryDb(query, [product_id, attribute_id, value || null]);

    return res
      .status(200)
      .json(
        returnResponse(
          true,
          false,
          "Product attribute value created successfully."
        )
      );
  } catch (err) {
    next(err);
  }
};

exports.getProductAttributeValues = async (req, res, next) => {
  try {
    const { product_id, category_id } = req.query;

    let query = `SELECT * FROM sn_product_attributes WHERE 1=1 `;
    const params = [];

    if (product_id) {
      query += ` AND product_id = ?`;
      params.push(product_id);
    }
    if (category_id) {
      query += ` AND category_id = ?`;
      params.push(category_id);
    }

    const result = await queryDb(query, params);

    return res
      .status(200)
      .json(
        returnResponse(
          true,
          false,
          "Product attribute values fetched successfully.",
          result
        )
      );
  } catch (err) {
    next(err);
  }
};

exports.updateProductAttributeValue = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(
      req.userId,
      "update_product_attribute_value"
    );
    if (!hasPermission) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "You do not have permission to this action."
          )
        );
    }
    const { value_id, value } = req.body;
    if (!value_id || !value) {
      return res
        .status(201)
        .json(returnResponse(false, true, "value_id and value is required."));
    }

    const query = `
      UPDATE sn_product_attribute_value
      SET value = ?
      WHERE value_id = ?
    `;

    await queryDb(query, [value || null, value_id]);

    return res
      .status(200)
      .json(
        returnResponse(
          true,
          false,
          "Product attribute value updated successfully."
        )
      );
  } catch (err) {
    next(err);
  }
};

exports.deleteProductAttributeValue = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(
      req.userId,
      "delete_product_attribute_value"
    );
    if (!hasPermission) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "You do not have permission to this action."
          )
        );
    }
    const { value_id } = req.query;
    if (!value_id) {
      return res
        .status(201)
        .json(returnResponse(false, true, "value_id is required."));
    }

    const query = `DELETE FROM sn_product_attribute_value WHERE value_id = ?`;
    await queryDb(query, [value_id]);

    return res
      .status(200)
      .json(
        returnResponse(
          true,
          false,
          "Product attribute value deleted successfully."
        )
      );
  } catch (err) {
    next(err);
  }
};
// // ======================= Permissoin ========================
// exports.createPermission = async (req, res, next) => {
//   try {
//     const { permissionName } = req.body;

//     const query = `INSERT INTO sn_permission (permissionName) VALUES (?)`;
//     await queryDb(query, [permissionName]);

//     return res
//       .status(201)
//       .json(returnResponse(true, false, "Permission created successfully."));
//   } catch (e) {
//     next(e);
//   }
// };
exports.getAllPermissions = async (req, res, next) => {
  try {
    const query = `SELECT * FROM sn_permission`;
    const results = await queryDb(query);

    return res
      .status(200)
      .json(
        returnResponse(
          true,
          false,
          "Permissions fetched successfully.",
          results
        )
      );
  } catch (e) {
    next(e);
  }
};
// exports.getPermissionById = async (req, res, next) => {
//   try {
//     const { permissionId } = req.params;

//     const query = `SELECT * FROM sn_permission WHERE permissionId = ?`;
//     const results = await queryDb(query, [permissionId]);

//     if (results.length === 0) {
//       return res
//         .status(201)
//         .json(returnResponse(false, true, "Permission not found."));
//     }

//     return res
//       .status(200)
//       .json(
//         returnResponse(
//           true,
//           false,
//           "Permission fetched successfully.",
//           results[0]
//         )
//       );
//   } catch (e) {
//     next(e);
//   }
// };
// exports.updatePermission = async (req, res, next) => {
//   try {
//     const { permissionId, permissionName } = req.body;

//     const query = `UPDATE sn_permission SET permissionName = ? WHERE permissionId = ?`;
//     const result = await queryDb(query, [permissionName, permissionId]);

//     return res
//       .status(200)
//       .json(returnResponse(true, false, "Permission updated successfully."));
//   } catch (e) {
//     next(e);
//   }
// };
// exports.deletePermission = async (req, res, next) => {
//   try {
//     const { permissionId } = req.body;

//     const query = `DELETE FROM sn_permission WHERE permissionId = ?`;
//     await queryDb(query, [permissionId]);

//     return res
//       .status(200)
//       .json(returnResponse(true, false, "Permission deleted successfully."));
//   } catch (e) {
//     next(e);
//   }
// };

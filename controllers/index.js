const { returnResponse } = require("../helper/helperResponse");
const {
  queryDb,
  deCryptData,
  randomStrNumeric,
} = require("../helper/utilityHelper");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// =========================================================
//                  USER-FACING ENDPOINTS (sn_tr_*)
// =========================================================
// Member login function
exports.memberLogin = async (req, res, next) => {
  try {
    const { payload } = req.body;
    if (!payload)
      return res
        .status(201)
        .json(returnResponse(false, true, "payload is required!"));

    const decrypted = deCryptData(payload);
    if (!decrypted || typeof decrypted !== "object") {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            decrypted || "Invalid or missing payload data"
          )
        );
    }
    const { email, password } = deCryptData(payload);

    if (!email || !password) {
      return res
        .status(400) // 400 for a bad request
        .json(
          returnResponse(false, true, "Email and password are required.", null)
        );
    }

    // Query the regular users table
    const query =
      "SELECT user_id, password_hash FROM sn_tr_users WHERE email = ?;";
    const result = await queryDb(query, [email]);
    if (result.length === 0) {
      return res
        .status(401) // 401 for unauthorized
        .json(returnResponse(false, true, "Invalid email or password.", null));
    }

    const user = result?.[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res
        .status(401) // 401 for unauthorized
        .json(returnResponse(false, true, "Invalid email or password.", null));
    }
    // Passwords match, generate a JWT with user_id
    const token = jwt.sign(
      { user_id: user.user_id, type: "User" },
      process.env.JWT_SECRET,
      {
        expiresIn: 60 * 60 * 60,
      }
    );
    return res.status(200).json(
      returnResponse(true, false, "Login successful.", {
        token,
        type: "User",
      })
    );
  } catch (e) {
    next(e);
  }
};

// Admin login function
exports.adminLogin = async (req, res, next) => {
  try {
    const { payload } = req.body;
    if (!payload)
      return res
        .status(201)
        .json(returnResponse(false, true, "payload is required!"));

    const decrypted = deCryptData(payload);
    if (!decrypted || typeof decrypted !== "object") {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            decrypted || "Invalid or missing payload data"
          )
        );
    }
    const { email, password } = deCryptData(payload);
    if (!email || !password) {
      return res
        .status(400) // 400 for a bad request
        .json(
          returnResponse(false, true, "Email and password are required.", null)
        );
    }

    // Query the admin users table
    const query =
      "SELECT admin_id as user_id, password_hash,`role` FROM sn_mr_admin_users WHERE email = ?;";
    const result = await queryDb(query, [email]);
    if (result.length === 0) {
      return res
        .status(401) // 401 for unauthorized
        .json(returnResponse(false, true, "Invalid email or password.", null));
    }

    const user = result[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res
        .status(401) // 401 for unauthorized
        .json(returnResponse(false, true, "Invalid email or password.", null));
    }

    // Passwords match, generate a JWT with user_id and is_admin flag
    const token = jwt.sign(
      { user_id: user.user_id, type: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    return res.status(200).json(
      returnResponse(true, false, "Login successful.", {
        token,
        type: user.role,
      })
    );
  } catch (e) {
    next(e);
  }
};
// Users
// ---------------------------------------------------------
exports.createUser = async (req, res, next) => {
  try {
    const { payload } = req.body;
    if (!payload)
      return res
        .status(201)
        .json(returnResponse(false, true, "payload is required!"));

    const decrypted = deCryptData(payload);
    if (!decrypted || typeof decrypted !== "object") {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            decrypted || "Invalid or missing payload data"
          )
        );
    }
    const { name, email, password_hash, phone_number } = deCryptData(payload);
    if (!name || !email || !password_hash) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Name, email, and password are required.",
            null
          )
        );
    }
    // Hash the password using bcrypt with a salt round of 10
    const hashedPassword = await bcrypt.hash(password_hash, 10);
    const query =
      "INSERT INTO sn_tr_users (identity,name, email, password_hash, phone_number) VALUES (?, ?, ?, ?, ?);";
    await queryDb(query, [
      Date.now() + randomStrNumeric(5),
      name,
      email,
      hashedPassword,
      phone_number,
    ]);
    return res
      .status(200)
      .json(returnResponse(true, false, "User created successfully.", null));
  } catch (e) {
    next(e);
  }
};

exports.getUserProfile = async (req, res, next) => {
  try {
    const user_id = req.user_id;
    const query =
      "SELECT identity, name, email, phone_number, created_at FROM sn_tr_users WHERE user_id = ?;";
    const result = await queryDb(query, [user_id]);
    if (result.length === 0) {
      return res
        .status(201)
        .json(returnResponse(false, true, "User not found.", null));
    }
    return res
      .status(200)
      .json(returnResponse(true, false, "User profile fetched.", result[0]));
  } catch (e) {
    next(e);
  }
};

// Addresses
// ---------------------------------------------------------
exports.addAddress = async (req, res, next) => {
  try {
    const { payload } = req.body;
    if (!payload)
      return res
        .status(201)
        .json(returnResponse(false, true, "payload is required!"));

    const decrypted = deCryptData(payload);
    if (!decrypted || typeof decrypted !== "object") {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            decrypted || "Invalid or missing payload data"
          )
        );
    }
    const user_id = req.user_id;
    const { type, line1, line2, city, state, postal_code, country } =
      deCryptData(payload);
    if (!type || !line1 || !city || !state || !postal_code || !country) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Required fields missing.", null));
    }
    const query =
      "INSERT INTO sn_tr_addresses (user_id, type, line1, line2, city, state, postal_code, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?);";
    await queryDb(query, [
      user_id,
      type,
      line1,
      line2,
      city,
      state,
      postal_code,
      country,
    ]);
    return res
      .status(200)
      .json(returnResponse(true, false, "Address added successfully.", null));
  } catch (e) {
    next(e);
  }
};

exports.getUserAddresses = async (req, res, next) => {
  try {
    const user_id = req.user_id;
    const query =
      "SELECT `address_id`,`type`,`line1`,`line2`,`city`,`state`,`postal_code`,`country` FROM sn_tr_addresses WHERE user_id = ?;";
    const result = await queryDb(query, [user_id]);
    return res
      .status(200)
      .json(returnResponse(true, false, "User addresses fetched.", result));
  } catch (e) {
    next(e);
  }
};

// Products
// ---------------------------------------------------------
exports.getProducts = async (req, res, next) => {
  try {
    const query =
      'SELECT product_id, name, price, image_url FROM sn_tr_products WHERE status = "Active";';
    const result = await queryDb(query);
    return res
      .status(200)
      .json(
        returnResponse(true, false, "Products fetched successfully.", result)
      );
  } catch (e) {
    next(e);
  }
};

exports.getProductDetails = async (req, res, next) => {
  const { payload } = req.params;
  if (!payload)
    return res
      .status(201)
      .json(returnResponse(false, true, "payload is required!"));

  const decrypted = deCryptData(payload);
  if (!decrypted || typeof decrypted !== "object") {
    return res
      .status(201)
      .json(
        returnResponse(
          false,
          true,
          decrypted || "Invalid or missing payload data"
        )
      );
  }
  try {
    const { product_id } = deCryptData(payload);
    const query =
      'SELECT * FROM sn_tr_products WHERE product_id = ? AND status = "Active";';
    const result = await queryDb(query, [product_id]);
    if (result.length === 0) {
      return res
        .status(404)
        .json(
          returnResponse(false, true, "Product not found or inactive.", null)
        );
    }
    return res
      .status(200)
      .json(returnResponse(true, false, "Product details fetched.", result[0]));
  } catch (e) {
    next(e);
  }
};

// Categories
// ---------------------------------------------------------
exports.getCategories = async (req, res, next) => {
  try {
    const query = "SELECT * FROM sn_tr_categories;";
    const result = await queryDb(query);
    return res
      .status(200)
      .json(returnResponse(true, false, "Categories fetched.", result));
  } catch (e) {
    next(e);
  }
};

// Brands
// ---------------------------------------------------------
exports.getBrands = async (req, res, next) => {
  try {
    const query = "SELECT * FROM sn_tr_brands;";
    const result = await queryDb(query);
    return res
      .status(200)
      .json(returnResponse(true, false, "Brands fetched.", result));
  } catch (e) {
    next(e);
  }
};

// Cart
// ---------------------------------------------------------
exports.getCart = async (req, res, next) => {
  try {
    const user_id = req.user_id;
    const query = `
      SELECT ci.cart_item_id, ci.quantity, p.product_id, p.name, p.price, p.image_url
      FROM sn_tr_cart_items ci
      JOIN sn_tr_cart c ON c.cart_id = ci.cart_id
      JOIN sn_tr_products p ON p.product_id = ci.product_id
      WHERE c.user_id = ?;
    `;
    const result = await queryDb(query, [user_id]);
    return res
      .status(200)
      .json(returnResponse(true, false, "Cart items fetched.", result));
  } catch (e) {
    next(e);
  }
};

exports.addProductToCart = async (req, res, next) => {
  try {
    const user_id = req.user_id;
    const { product_id, quantity } = req.body;
    if (!product_id || !quantity) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Product ID and quantity are required.",
            null
          )
        );
    }

    // Check if user has a cart, create one if not
    let cart_query = "SELECT cart_id FROM sn_tr_cart WHERE user_id = ?;";
    let cart_result = await queryDb(cart_query, [user_id]);
    if (cart_result.length === 0) {
      const insert_cart_query = "INSERT INTO sn_tr_cart (user_id) VALUES (?);";
      const insert_cart_res = await queryDb(insert_cart_query, [user_id]);
      cart_result = [{ cart_id: insert_cart_res.insertId }];
    }
    const cart_id = cart_result[0].cart_id;

    // Check if product is already in cart
    const cart_item_query =
      "SELECT cart_item_id FROM sn_tr_cart_items WHERE cart_id = ? AND product_id = ?;";
    const cart_item_result = await queryDb(cart_item_query, [
      cart_id,
      product_id,
    ]);

    if (cart_item_result.length > 0) {
      // Update quantity if item exists
      const update_query =
        "UPDATE sn_tr_cart_items SET quantity = quantity + ? WHERE cart_item_id = ?;";
      await queryDb(update_query, [quantity, cart_item_result[0].cart_item_id]);
    } else {
      // Add new item to cart
      const insert_query =
        "INSERT INTO sn_tr_cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?);";
      await queryDb(insert_query, [cart_id, product_id, quantity]);
    }

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Product added to cart successfully.", null)
      );
  } catch (e) {
    next(e);
  }
};

exports.removeProductFromCart = async (req, res, next) => {
  try {
    const user_id = req.user_id;
    const { cart_item_id } = req.params;

    const query = `
      DELETE FROM sn_tr_cart_items WHERE cart_item_id = ? 
      AND cart_id IN (SELECT cart_id FROM sn_tr_cart WHERE user_id = ?);
    `;
    await queryDb(query, [cart_item_id, user_id]);
    return res
      .status(200)
      .json(returnResponse(true, false, "Product removed from cart.", null));
  } catch (e) {
    next(e);
  }
};

// Orders
// ---------------------------------------------------------
exports.placeOrder = async (req, res, next) => {
  try {
    const user_id = req.user_id;
    const { shipping_address_id, billing_address_id } = req.body;
    if (!shipping_address_id || !billing_address_id) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Shipping and billing addresses are required.",
            null
          )
        );
    }

    // Get cart items
    const cart_items_query = `
      SELECT ci.quantity, p.product_id, p.price
      FROM sn_tr_cart_items ci
      JOIN sn_tr_cart c ON c.cart_id = ci.cart_id
      JOIN sn_tr_products p ON p.product_id = ci.product_id
      WHERE c.user_id = ?;
    `;
    const cart_items = await queryDb(cart_items_query, [user_id]);
    if (cart_items.length === 0) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Cart is empty. Cannot place an order.",
            null
          )
        );
    }

    // Calculate total amount
    const total_amount = cart_items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Create a new order
    const order_query =
      "INSERT INTO sn_tr_orders (user_id, order_status, payment_status, shipping_address_id, billing_address_id, total_amount) VALUES (?, ?, ?, ?, ?, ?);";
    const order_result = await queryDb(order_query, [
      user_id,
      "Pending",
      "Pending",
      shipping_address_id,
      billing_address_id,
      total_amount,
    ]);
    const order_id = order_result.insertId;

    // Add items to order_items table and clear cart
    const cart_id_query = "SELECT cart_id FROM sn_tr_cart WHERE user_id = ?;";
    const cart_id_res = await queryDb(cart_id_query, [user_id]);
    const cart_id = cart_id_res[0].cart_id;

    for (const item of cart_items) {
      const order_item_query =
        "INSERT INTO sn_tr_order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?);";
      await queryDb(order_item_query, [
        order_id,
        item.product_id,
        item.quantity,
        item.price,
      ]);
    }

    await queryDb("DELETE FROM sn_tr_cart_items WHERE cart_id = ?;", [cart_id]);

    return res
      .status(201)
      .json(
        returnResponse(true, false, "Order placed successfully.", { order_id })
      );
  } catch (e) {
    next(e);
  }
};

exports.getUserOrders = async (req, res, next) => {
  try {
    const user_id = req.user_id;
    const query =
      "SELECT * FROM sn_tr_orders WHERE user_id = ? ORDER BY created_at DESC;";
    const result = await queryDb(query, [user_id]);
    return res
      .status(200)
      .json(returnResponse(true, false, "User orders fetched.", result));
  } catch (e) {
    next(e);
  }
};

// Coupons
// ---------------------------------------------------------
exports.applyCoupon = async (req, res, next) => {
  try {
    const { order_id, coupon_code } = req.body;
    if (!order_id || !coupon_code) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Order ID and coupon code are required.",
            null
          )
        );
    }

    // 1. Fetch the coupon and check validity
    const coupon_query =
      "SELECT * FROM sn_tr_coupons WHERE code = ? AND is_active = 1 AND GETDATE() BETWEEN valid_from AND valid_to AND max_uses > 0;";
    const coupon_result = await queryDb(coupon_query, [coupon_code]);
    if (coupon_result.length === 0) {
      return res
        .status(404)
        .json(returnResponse(false, true, "Invalid or expired coupon.", null));
    }
    const coupon = coupon_result[0];

    // 2. Fetch the order
    const order_query =
      "SELECT total_amount FROM sn_tr_orders WHERE order_id = ?;";
    const order_result = await queryDb(order_query, [order_id]);
    if (order_result.length === 0) {
      return res
        .status(404)
        .json(returnResponse(false, true, "Order not found.", null));
    }
    const order = order_result[0];
    let new_total_amount;

    // 3. Calculate new total amount based on discount type
    if (coupon.discount_type === "Percentage") {
      new_total_amount =
        order.total_amount - (order.total_amount * coupon.value) / 100;
    } else {
      // Flat discount
      new_total_amount = order.total_amount - coupon.value;
    }

    // Ensure the total amount doesn't go below zero
    new_total_amount = new_total_amount > 0 ? new_total_amount : 0;

    // 4. Update the order and decrement coupon usage
    // Note: In a production environment, this should be done inside a transaction
    // to ensure both updates succeed or fail together.
    const update_order_query =
      "UPDATE sn_tr_orders SET total_amount = ? WHERE order_id = ?;";
    await queryDb(update_order_query, [new_total_amount, order_id]);

    const update_coupon_query =
      "UPDATE sn_tr_coupons SET max_uses = max_uses - 1 WHERE coupon_id = ?;";
    await queryDb(update_coupon_query, [coupon.coupon_id]);

    return res.status(200).json(
      returnResponse(true, false, "Coupon applied successfully.", {
        new_total_amount,
      })
    );
  } catch (e) {
    next(e);
  }
};

// Payments (simplified)
// ---------------------------------------------------------
exports.processPayment = async (req, res, next) => {
  try {
    const { order_id, payment_method, transaction_id, amount } = req.body;
    if (!order_id || !payment_method || !transaction_id || !amount) {
      return res
        .status(201)
        .json(
          returnResponse(false, true, "All payment details are required.", null)
        );
    }
    const query =
      'INSERT INTO sn_tr_payments (order_id, payment_method, transaction_id, amount, payment_status, paid_at) VALUES (?, ?, ?, ?, "Paid", GETDATE());';
    await queryDb(query, [order_id, payment_method, transaction_id, amount]);

    // Update order payment status
    await queryDb(
      'UPDATE sn_tr_orders SET payment_status = "Paid" WHERE order_id = ?;',
      [order_id]
    );

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Payment processed successfully.", null)
      );
  } catch (e) {
    next(e);
  }
};

// Reviews
// ---------------------------------------------------------
exports.addReview = async (req, res, next) => {
  try {
    const user_id = req.user_id;
    const { product_id, rating, comment } = req.body;
    if (!product_id || !rating) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Product ID and rating are required.",
            null
          )
        );
    }
    const query =
      "INSERT INTO sn_tr_reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?);";
    await queryDb(query, [user_id, product_id, rating, comment]);
    return res
      .status(200)
      .json(returnResponse(true, false, "Review added successfully.", null));
  } catch (e) {
    next(e);
  }
};

exports.getProductReviews = async (req, res, next) => {
  try {
    const { product_id } = req.params;
    const query =
      "SELECT r.*, u.name as user_name FROM sn_tr_reviews r JOIN sn_tr_users u ON r.user_id = u.user_id WHERE r.product_id = ?;";
    const result = await queryDb(query, [product_id]);
    return res
      .status(200)
      .json(returnResponse(true, false, "Product reviews fetched.", result));
  } catch (e) {
    next(e);
  }
};

// =========================================================
//                   ADMIN ENDPOINTS (sn_mr_*)
// =========================================================

// Admin Product Management
// ---------------------------------------------------------
exports.createProduct = async (req, res, next) => {
  try {
    const admin_id = req.admin_id;
    const {
      name,
      description,
      price,
      stock_quantity,
      category_id,
      brand_id,
      image_url,
    } = req.body;
    if (!name || !price || !stock_quantity || !category_id || !brand_id) {
      return res
        .status(201)
        .json(
          returnResponse(false, true, "Required product details missing.", null)
        );
    }
    const query =
      'INSERT INTO sn_tr_products (name, description, price, stock_quantity, category_id, brand_id, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, "Active");';
    const result = await queryDb(query, [
      name,
      description,
      price,
      stock_quantity,
      category_id,
      brand_id,
      image_url,
    ]);
    const product_id = result.insertId;

    // Log the activity
    const log_query =
      'INSERT INTO sn_mr_product_activity_logs (admin_id, product_id, action) VALUES (?, ?, "Add");';
    await queryDb(log_query, [admin_id, product_id]);

    return res.status(201).json(
      returnResponse(true, false, "Product created successfully.", {
        product_id,
      })
    );
  } catch (e) {
    next(e);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const admin_id = req.admin_id;
    const { product_id } = req.params;
    const {
      name,
      description,
      price,
      stock_quantity,
      category_id,
      brand_id,
      image_url,
      status,
    } = req.body;

    const update_fields = [];
    const values = [];

    if (name) {
      update_fields.push("name = ?");
      values.push(name);
    }
    if (description) {
      update_fields.push("description = ?");
      values.push(description);
    }
    if (price) {
      update_fields.push("price = ?");
      values.push(price);
    }
    if (stock_quantity) {
      update_fields.push("stock_quantity = ?");
      values.push(stock_quantity);
    }
    if (category_id) {
      update_fields.push("category_id = ?");
      values.push(category_id);
    }
    if (brand_id) {
      update_fields.push("brand_id = ?");
      values.push(brand_id);
    }
    if (image_url) {
      update_fields.push("image_url = ?");
      values.push(image_url);
    }
    if (status) {
      update_fields.push("status = ?");
      values.push(status);
    }

    if (update_fields.length === 0) {
      return res
        .status(201)
        .json(returnResponse(false, true, "No fields to update.", null));
    }

    const query = `UPDATE sn_tr_products SET ${update_fields.join(
      ", "
    )} WHERE product_id = ?;`;
    await queryDb(query, [...values, product_id]);

    // Log the activity
    const log_query =
      'INSERT INTO sn_mr_product_activity_logs (admin_id, product_id, action) VALUES (?, ?, "Update");';
    await queryDb(log_query, [admin_id, product_id]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Product updated successfully.", null));
  } catch (e) {
    next(e);
  }
};

// Admin Order Management
// ---------------------------------------------------------
exports.getAllOrders = async (req, res, next) => {
  try {
    const query = "SELECT * FROM sn_tr_orders ORDER BY created_at DESC;";
    const result = await queryDb(query);
    return res
      .status(200)
      .json(returnResponse(true, false, "All orders fetched.", result));
  } catch (e) {
    next(e);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const admin_id = req.admin_id;
    const { order_id } = req.params;
    const { new_status, note } = req.body;
    if (!new_status) {
      return res
        .status(201)
        .json(returnResponse(false, true, "New status is required.", null));
    }

    const query =
      "UPDATE sn_tr_orders SET order_status = ? WHERE order_id = ?;";
    await queryDb(query, [new_status, order_id]);

    // Log the activity
    const log_query =
      "INSERT INTO sn_mr_order_activity_logs (admin_id, order_id, action, note) VALUES (?, ?, ?, ?);";
    await queryDb(log_query, [
      admin_id,
      order_id,
      `Status updated to ${new_status}`,
      note || "",
    ]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Order status updated.", null));
  } catch (e) {
    next(e);
  }
};

// Admin Inventory Management
// ---------------------------------------------------------
exports.updateInventory = async (req, res, next) => {
  try {
    const admin_id = req.admin_id;
    const { product_id } = req.params;
    const { change, reason } = req.body;
    if (change === undefined || !reason) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Change amount and reason are required.",
            null
          )
        );
    }

    const query =
      "UPDATE sn_tr_products SET stock_quantity = stock_quantity + ? WHERE product_id = ?;";
    await queryDb(query, [change, product_id]);

    // Log the inventory change
    const log_query =
      "INSERT INTO sn_mr_inventory_logs (product_id, admin_id, change, reason) VALUES (?, ?, ?, ?);";
    await queryDb(log_query, [product_id, admin_id, change, reason]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Inventory updated successfully.", null)
      );
  } catch (e) {
    next(e);
  }
};

// Admin Coupon Management
// ---------------------------------------------------------
exports.createCoupon = async (req, res, next) => {
  try {
    const admin_id = req.admin_id;
    const {
      code,
      discount_type,
      value,
      max_uses,
      valid_from,
      valid_to,
      is_active,
    } = req.body;
    if (
      !code ||
      !discount_type ||
      !value ||
      !max_uses ||
      !valid_from ||
      !valid_to ||
      is_active === undefined
    ) {
      return res
        .status(201)
        .json(
          returnResponse(false, true, "All coupon fields are required.", null)
        );
    }
    const query =
      "INSERT INTO sn_tr_coupons (code, discount_type, value, max_uses, valid_from, valid_to, is_active) VALUES (?, ?, ?, ?, ?, ?, ?);";
    await queryDb(query, [
      code,
      discount_type,
      value,
      max_uses,
      valid_from,
      valid_to,
      is_active,
    ]);
    return res
      .status(200)
      .json(returnResponse(true, false, "Coupon created successfully.", null));
  } catch (e) {
    next(e);
  }
};

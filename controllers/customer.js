const sequelize = require("../config/seq.config");
const { returnResponse } = require("../helper/helperResponse");
const { queryDb, randomStrNumeric } = require("../helper/utilityHelper");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
// Create Customer

exports.createCustomer = async (req, res, next) => {
  let t = null;

  try {
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      country,
      pincode,
      status = "Active",
      created_by = "self", // 1 for useruser, 2 for user, 3 for self
      confirm_password,
      password,
    } = req.body;

    // Basic validation
    if (!name) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Customer name is required."));
    }
    if (!password) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Password is required."));
    }
    if (!confirm_password) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Confirm password is required."));
    }
    if (password !== confirm_password) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Password and confirm password should be same."
          )
        );
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Invalid email format."));
    }
    if (phone && !/^[0-9]{7,15}$/.test(phone)) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Invalid phone number."));
    }

    const created_at = new Date();
    const updated_at = created_at;
    t = await sequelize.transaction();
    const isExist = await queryDb(
      "SELECT 1 FROM sn_customer_login WHERE cl_email = ? OR cl_phone = ? LIMIT 1;",
      [email, phone]
    );

    if (isExist?.length > 0) {
      await t.rollback();
      return res
        .status(201)
        .json(
          returnResponse(false, true, "email and phone number already exist.")
        );
    }
    // Insert into sn_customer
    const customerQuery = `
      INSERT INTO sn_customer 
      (
        cust_unique_id, name, address, city, state, country, pincode, status,
        created_at, created_by, updated_by, updated_at
      )
      VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const customerResult = await queryDb(customerQuery, [
      randomStrNumeric(15),
      name,
      address,
      city,
      state,
      country,
      pincode,
      status,
      created_at,
      created_by || null,
      created_by || null,
      updated_at,
    ]);

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      Number(process.env.SALT_ROUND)
    );

    // Insert into sn_customer_login
    const loginQuery = `
      INSERT INTO sn_customer_login 
      (cl_reg_id, cl_email, cl_phone, cl_password, cl_lgn_status) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const loginResult = await queryDb(loginQuery, [
      customerResult,
      email,
      phone,
      hashedPassword,
      "Active",
    ]);

    // Update sn_customer with cust_lgn_id
    const updateQuery = `
      UPDATE sn_customer 
      SET cust_lgn_id = ? 
      WHERE customer_id = ?
    `;
    await queryDb(updateQuery, [loginResult, customerResult]);
    await t.commit();
    return res
      .status(200)
      .json(returnResponse(true, false, "Customer created successfully."));
  } catch (e) {
    if (t) await t.rollback();
    next(e);
  }
};

exports.loginCustomer = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Email and password are required."));
    }

    // Find user
    const loginQuery = `SELECT * FROM sn_customer_login WHERE cl_email = ? AND cl_lgn_status = 'Active'`;
    const [user] = await queryDb(loginQuery, [email]);

    if (!user) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Invalid credentials."));
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.cl_password);
    if (!isMatch) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Invalid credentials."));
    }
    // Generate token
    const token = jwt.sign(
      { userId: user.cl_reg_id, userEmail: user.cl_email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    await queryDb(
      "UPDATE sn_customer_login SET cl_lgn_token = ?,cl_lgn_count = cl_lgn_count+1,cl_last_lgn_time = NOW() ",
      [token]
    );
    return res
      .status(200)
      .json(returnResponse(true, false, "Login successful.", { token }));
  } catch (e) {
    next(e);
  }
};
// Get All Customers

exports.getAllCustomers = async (req, res, next) => {
  try {
    const {
      search = "",
      start_date = "",
      end_date = "",
      page = 1,
      count = 10,
    } = req.query;
    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(count), 1);
    const offset = (pageNumber - 1) * pageSize;

    let countQuery = `SELECT COUNT(*) AS cnt FROM sn_customer_details WHERE 1 `;
    let baseQuery = `
      SELECT * FROM sn_customer_details WHERE 1 `;

    let reP = [];
    let reB = [];

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
          cl_email LIKE ? OR 
          cl_phone LIKE ? OR 
          name LIKE ? OR
          city LIKE ? OR 
          state LIKE ? OR 
          country LIKE ? OR 
          pincode LIKE ? OR 
          address LIKE ?
        )`;
      countQuery += searchCondition;
      baseQuery += searchCondition;
      reP.push(s, s, s, s, s, s, s, s);
      reP.push(s, s, s, s, s, s, s, s);
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
// Get Customer by ID
exports.getCustomersProfile = async (req, res, next) => {
  const userId = req.userId;
  try {
    const query = `SELECT * FROM sn_customer_details WHERE customer_id = ?`;
    const result = await queryDb(query, [userId]);

    if (result.length === 0) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Customer not found."));
    }

    return res
      .status(200)
      .json(returnResponse(true, false, "Customer fetched.", result[0]));
  } catch (e) {
    next(e);
  }
};
// Update Customer
exports.updateCustomer = async (req, res, next) => {
  let t;
  const customer_id = req.userId;

  try {
    const { name, email, phone, address, city, state, country, pincode } =
      req.body;

    const updated_at = new Date();

    // Start transaction
    t = await sequelize.transaction();

    // 1️⃣ Get current customer & login data
    const customerData = await queryDb(
      `SELECT c.name, c.address, c.city, c.state, c.country, c.pincode, c.status, 
              l.cl_email, l.cl_phone, c.cust_lgn_id
       FROM sn_customer c
       LEFT JOIN sn_customer_login l ON c.cust_lgn_id = l.cl_id
       WHERE c.customer_id = ?`,
      [customer_id],
      t
    );

    if (!customerData || customerData.length === 0) {
      await t.rollback();
      return res
        .status(201)
        .json(returnResponse(false, true, "Customer not found."));
    }

    const current = customerData[0];

    // 2️⃣ Update sn_customer if any profile fields changed
    const customerFieldsChanged =
      name !== current.name ||
      address !== current.address ||
      city !== current.city ||
      state !== current.state ||
      country !== current.country ||
      pincode !== current.pincode;

    if (customerFieldsChanged) {
      const updateCustomerQuery = `
        UPDATE sn_customer
        SET name = ?, address = ?, city = ?, state = ?, country = ?, pincode = ?, updated_at = ?
        WHERE customer_id = ?
      `;
      await queryDb(
        updateCustomerQuery,
        [
          name || current.name,
          address || current.address,
          city || current.city,
          state || current.state,
          country || current.country,
          pincode || current.pincode,
          updated_at,
          customer_id,
        ],
        t
      );
    }

    // 3️⃣ Update sn_customer_login if email or phone changed
    const loginFieldsChanged =
      email !== current.cl_email || phone !== current.cl_phone;

    if (loginFieldsChanged) {
      const updateLoginQuery = `
        UPDATE sn_customer_login
        SET cl_email = ?, cl_phone = ?
        WHERE cl_id = ?
      `;
      await queryDb(
        updateLoginQuery,
        [
          email || current.cl_email,
          phone || current.cl_phone,
          current.cust_lgn_id,
        ],
        t
      );
    }

    // Commit transaction
    await t.commit();

    return res
      .status(200)
      .json(returnResponse(true, false, "Customer updated successfully."));
  } catch (e) {
    console.log(e);
    if (t) await t.rollback();
    next(e);
  }
};
exports.createShippingAddress = async (req, res, next) => {
  const user_id = req.userId;

  try {
    const {
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
      phone_number,
      is_default = 1,
    } = req.body;

    if (!address_line1 || typeof address_line1 !== "string") {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Address Line 1 is required and must be a valid string."
          )
        );
    }

    if (!city || typeof city !== "string") {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "City is required and must be a valid string."
          )
        );
    }

    if (!state || typeof state !== "string") {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "State is required and must be a valid string."
          )
        );
    }

    if (!postal_code || typeof postal_code !== "string") {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Postal code is required and must be a valid string."
          )
        );
    }

    if (!country || typeof country !== "string") {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Country is required and must be a valid string."
          )
        );
    }
    if (Number(is_default) === 1) {
      await queryDb(
        "UPDATE sn_shipping_address SET is_default = 2 WHERE customer_id = ?;",
        [user_id]
      );
    }
    // Insert the shipping address
    const query = `
      INSERT INTO sn_shipping_address (
        customer_id, address_line1, address_line2, city, state, postal_code, country, phone_number, is_default
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await queryDb(query, [
      user_id,
      address_line1.trim(),
      address_line2 ? address_line2.trim() : null,
      city.trim(),
      state.trim(),
      postal_code.trim(),
      country.trim(),
      phone_number ? phone_number.trim() : null,
      is_default,
    ]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Shipping address added successfully.")
      );
  } catch (e) {
    next(e);
  }
};
exports.setShippingAddressAsDefault = async (req, res, next) => {
  const user_id = req.userId;

  try {
    const { address_id } = req.query;
    if (!address_id) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Countraddress_idy is required."));
    }
    // Insert the shipping address
    await queryDb(
      "UPDATE `sn_shipping_address` SET `is_default` = 2 WHERE `customer_id` = ?;",
      [user_id]
    );
    await queryDb(
      "UPDATE `sn_shipping_address` SET `is_default` = 1 WHERE `address_id` = ? LIMIT 1;",
      [address_id]
    );

    return res
      .status(200)
      .json(returnResponse(true, false, "Default Address Set successfully."));
  } catch (e) {
    next(e);
  }
};
exports.getShippingAddress = async (req, res, next) => {
  const user_id = req.userId;
  try {
    // Insert the shipping address
    const result = await queryDb("SELECT * FROM  `sn_shipping_address`;", [
      user_id,
    ]);

    return res
      .status(200)
      .json(
        returnResponse(
          true,
          false,
          "Shipping address fetched successfully.",
          result
        )
      );
  } catch (e) {
    next(e);
  }
};

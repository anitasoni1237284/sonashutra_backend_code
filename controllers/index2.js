// yha se api banan hai...

const sequelize = require("../config/seq.config");
const { returnResponse } = require("../helper/helperResponse");
const {
  queryDb,
  randomStrAlphabet,
  randomStrNumeric,
} = require("../helper/utilityHelper");
const { checkPermission } = require("../middleware");
const moment = require("moment");

// Create Inventory Entry
exports.createInventory = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(
      req.userId,
      "create-product-inventory"
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
    const {
      product_id,
      warehouse_id,
      varient_id,
      sku,
      barcode,
      quantity,
      reserved_quantity,
      minimum_quantity,
      batch_number,
      expiry_date,
      updated_by = 1,
    } = req.body;

    // Required fields check
    if (!product_id || !warehouse_id || quantity == null || !varient_id) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Product ID, Warehouse ID,varient_id and Quantity are required."
          )
        );
    }

    // Quantity validation
    if (quantity < 0) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Quantity cannot be negative."));
    }

    // Minimum quantity validation
    if (minimum_quantity != null && minimum_quantity < 0) {
      return res
        .status(201)
        .json(
          returnResponse(false, true, "Minimum quantity cannot be negative.")
        );
    }

    // Reserved quantity validation
    if (reserved_quantity != null && reserved_quantity < 0) {
      return res
        .status(201)
        .json(
          returnResponse(false, true, "Reserved quantity cannot be negative.")
        );
    }
    if (reserved_quantity != null && reserved_quantity > quantity) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Reserved quantity cannot exceed total quantity."
          )
        );
    }

    // Expiry date validation
    if (expiry_date) {
      const expDate = new Date(expiry_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expDate < today) {
        return res
          .status(201)
          .json(
            returnResponse(false, true, "Expiry date cannot be in the past.")
          );
      }
    }

    const last_updated = new Date();
    const created_at = new Date();

    const query = `
      INSERT INTO sn_product_inventory 
      (
        product_id,inventory_unique, warehouse_id, varient_id, sku, barcode, quantity, 
        reserved_quantity, minimum_quantity, batch_number, expiry_date, 
        last_updated, created_at, updated_by
      ) 
      VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await queryDb(query, [
      product_id,
      Date.now() + randomStrNumeric(5),
      warehouse_id || null,
      varient_id || null,
      sku || null,
      barcode || null,
      quantity,
      reserved_quantity || 0,
      minimum_quantity || 0,
      batch_number || null,
      expiry_date || null,
      last_updated,
      created_at,
      updated_by || "User",
    ]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Inventory entry created successfully.")
      );
  } catch (e) {
    next(e);
  }
};

// Get All Inventory Entries
exports.getInventory = async (req, res, next) => {
  try {
    const { varient_id } = req.query;
    if (!varient_id)
      return res
        .status(201)
        .json(returnResponse(true, false, "varient_id is required.", []));
    const query = `SELECT * FROM sn_varients_details WHERE varient_id = ? `;

    const result = await queryDb(query, [varient_id]);
    return res
      .status(200)
      .json(returnResponse(true, false, "Inventory entries fetched.", result));
  } catch (e) {
    next(e);
  }
};

// Update Inventory
exports.updateInventory = async (req, res, next) => {
  try {
    const {
      inventory_id,
      quantity,
      reserved_quantity,
      minimum_quantity,
      batch_number,
      expiry_date,
      updated_by,
      barcode,
    } = req.body;

    // Required fields check
    if (!inventory_id || quantity == null) {
      return res
        .status(201)
        .json(
          returnResponse(false, true, "Inventory ID and Quantity are required.")
        );
    }

    // Quantity validation
    if (quantity < 0) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Quantity cannot be negative."));
    }

    // Minimum quantity validation
    if (minimum_quantity != null && minimum_quantity < 0) {
      return res
        .status(201)
        .json(
          returnResponse(false, true, "Minimum quantity cannot be negative.")
        );
    }

    // Reserved quantity validation
    if (reserved_quantity != null && reserved_quantity < 0) {
      return res
        .status(201)
        .json(
          returnResponse(false, true, "Reserved quantity cannot be negative.")
        );
    }
    if (reserved_quantity != null && reserved_quantity > quantity) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Reserved quantity cannot exceed total quantity."
          )
        );
    }

    // Expiry date validation
    if (expiry_date) {
      const expDate = new Date(expiry_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expDate < today) {
        return res
          .status(201)
          .json(
            returnResponse(false, true, "Expiry date cannot be in the past.")
          );
      }
    }

    const last_updated = new Date();

    const query = `
      UPDATE sn_product_inventory 
      SET quantity = ?, reserved_quantity = ?, minimum_quantity = ?, 
          batch_number = ?, expiry_date = ?, last_updated = ?, updated_by = ?,barcode=?
      WHERE inventory_id = ?
    `;

    await queryDb(query, [
      quantity,
      reserved_quantity || 0,
      minimum_quantity || 0,
      batch_number || null,
      expiry_date || null,
      last_updated,
      updated_by || "User",
      barcode || null,
      inventory_id,
    ]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Inventory updated successfully."));
  } catch (e) {
    next(e);
  }
};

// Delete Inventory
exports.deleteInventory = async (req, res, next) => {
  try {
    const { inventory_id } = req.body;

    const query = `DELETE FROM sn_product_inventory WHERE inventory_id = ?`;
    await queryDb(query, [inventory_id]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Inventory deleted successfully."));
  } catch (e) {
    next(e);
  }
};
exports.createPaymentMethod = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(
      req.userId,
      "create_payment_method"
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
    const { pm_name, pm_type, pm_status = 1, pm_description } = req.body;

    // Validation
    if (!pm_name || typeof pm_name !== "string" || pm_name.trim() === "") {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Payment method name is required and must be a valid string."
          )
        );
    }

    if (!pm_type || typeof pm_type !== "string") {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Payment method type is required and must be a valid string."
          )
        );
    }

    // Insert the payment method into the database
    const query = `
      INSERT INTO sn_payment_method (pm_name, pm_type, pm_status, pm_description)
      VALUES (?, ?, ?, ?)
    `;

    await queryDb(query, [
      pm_name.trim(),
      pm_type.trim(),
      pm_status,
      pm_description,
    ]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Payment method created successfully.")
      );
  } catch (e) {
    next(e);
  }
};
exports.getPaymentMethod = async (req, res, next) => {
  try {
    const query = ` SELECT * FROM sn_payment_method;`;

    const result = await queryDb(query, []);
    return res
      .status(200)
      .json(returnResponse(true, false, "Payment methods fetched.", result));
  } catch (e) {
    next(e);
  }
};
// Create Order
exports.createCustomerOrder = async (req, res, next) => {
  const userId = req.userId;
  let t;
  try {
    const {
      status = "Pending", // Pending, Paid, Shipped, Completed, Cancelled
      payment_method, // number
      payment_status = "Unpaid", // Unpaid, Paid, Refunded
      notes = "N/A",
      items, // [{ varient_id, quantity }]
      payment, // { method, status, amount }
    } = req.body;

    // Parse JSON fields
    let parsedItems, parsedPayment;
    try {
      parsedItems = typeof items === "string" ? JSON.parse(items) : items;
      parsedPayment = payment
        ? typeof payment === "string"
          ? JSON.parse(payment)
          : payment
        : null;
    } catch (err) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Invalid JSON format in items or payment."
          )
        );
    }

    if (!parsedItems || parsedItems.length === 0) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Items are required."));
    }
    // Check inventory availability

    // Get default shipping address
    const orderInfo = await queryDb(
      `SELECT * FROM sn_shipping_address WHERE customer_id = ? AND is_default = 1 LIMIT 1;`,
      [userId]
    );
    if (orderInfo.length === 0) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Please add a shipping address."));
    }

    t = await sequelize.transaction();
    for (const item of parsedItems) {
      const pro_unit_price = await queryDb(
        "SELECT sku FROM sn_product_variant WHERE variant_id = ? LIMIT 1;",
        [Number(item.varient_id)],
        t
      );

      const inventoryData = await queryDb(
        `SELECT quantity, reserved_quantity 
     FROM sn_product_inventory 
     WHERE varient_id = ? 
     LIMIT 1;`,
        [Number(item.varient_id)],
        t
      );

      if (!inventoryData || inventoryData.length === 0) {
        await t.rollback();
        return res
          .status(201)
          .json(
            returnResponse(
              false,
              true,
              `No inventory record found for varient ${pro_unit_price?.[0]?.sku}`
            )
          );
      }

      const availableQty =
        Number(inventoryData[0].quantity) -
        Number(inventoryData[0].reserved_quantity);

      if (availableQty < Number(item.quantity)) {
        await t.rollback();
        return res
          .status(201)
          .json(
            returnResponse(
              false,
              true,
              `Insufficient stock for varient ${pro_unit_price?.[0]?.sku}`
            )
          );
      }
    }

    const order_date = new Date();
    let base_amount = 0; // sum of product prices without tax/discount
    let total_tax = 0;
    let total_discount = 0;

    for (const item of parsedItems) {
      const pro_unit_price = await queryDb(
        "SELECT price AS unit_price FROM sn_product_variant WHERE variant_id = ? LIMIT 1;",
        [Number(item.varient_id)],
        t
      );
      const unitPrice = Number(pro_unit_price?.[0]?.unit_price) || 0;
      const price = unitPrice * Number(item.quantity);
      base_amount += price;

      // Tax
      const taxPercentData = await queryDb(
        `SELECT IFNULL(SUM(t.percentage),0) AS total_tax
         FROM sn_product_tax pt
         INNER JOIN sn_tax t ON t.tax_id = pt.tax_id
         WHERE pt.varient_id = ?;`,
        [Number(item.varient_id)],
        t
      );
      const taxPercent = Number(taxPercentData?.[0]?.total_tax) || 0;
      const taxAmount = (taxPercent / 100) * price;
      total_tax += taxAmount;

      // Discount
      const discountData = await queryDb(
        `SELECT 
            IFNULL(SUM(CASE WHEN d.discount_type = 'Percentage' THEN VALUE ELSE 0 END), 0) AS percent_dis,
            IFNULL(SUM(CASE WHEN d.discount_type = 'Flat' THEN VALUE ELSE 0 END), 0) AS flat_dis
         FROM sn_discount d
         INNER JOIN sn_product_discount pd ON pd.discount_id = d.discount_id
         WHERE pd.varient_id = ?;`,
        [Number(item.varient_id)],
        t
      );
      const discountPercent = Number(discountData?.[0]?.percent_dis) || 0;
      const discountFlat = Number(discountData?.[0]?.flat_dis) || 0;
      const discountAmount = (discountPercent / 100) * price + discountFlat;
      total_discount += discountAmount;
    }
    // Correct totals
    const total_amount = base_amount + total_tax; // price including tax but before discount
    const grand_total = total_amount - total_discount; // after discount

    const orderuniqueid = Date.now() + randomStrNumeric(10);

    const storeData = await queryDb(
      "SELECT p.store_id FROM sn_product p left join `sn_product_variant` v on v.`product_id` = p.`product_id` WHERE v.`variant_id` = ? LIMIT 1;",
      [Number(parsedItems?.[0]?.varient_id)],
      t
    );

    const orderResult = await queryDb(
      `INSERT INTO sn_customer_order 
      (customer_id, order_unique, order_date, status, store_id, payment_method, payment_status, 
      shipping_address, billing_address, notes, total_amount, total_tax, total_discount, grand_total, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        orderuniqueid,
        order_date,
        status,
        storeData?.[0]?.store_id || null,
        payment_method || null,
        payment_status,
        null,
        null,
        notes || null,
        base_amount, // before discount
        total_tax,
        total_discount,
        grand_total, // after discount
      ],
      t
    );

    const order_id = orderResult;

    // Insert each order item
    for (const item of parsedItems) {
      const pro_unit_price = await queryDb(
        "SELECT p.store_id,v.`price` AS unit_price FROM sn_product p LEFT JOIN `sn_product_variant` v ON v.`product_id` = p.`product_id` WHERE v.`variant_id` = ? LIMIT 1;",
        [Number(item.varient_id)],
        t
      );

      const unitPrice = Number(pro_unit_price?.[0]?.unit_pricee) || 0;
      const price = unitPrice * Number(item.quantity);

      // Discount calculation first
      const discountData = await queryDb(
        `SELECT 
            IFNULL(SUM(CASE WHEN d.discount_type = 'Percentage' THEN VALUE ELSE 0 END), 0) AS percent_dis,
            IFNULL(SUM(CASE WHEN d.discount_type = 'Flat' THEN VALUE ELSE 0 END), 0) AS flat_dis
         FROM sn_discount d
         INNER JOIN sn_product_discount pd ON pd.discount_id = d.discount_id
         WHERE pd.varient_id = ?;`,
        [Number(item.varient_id)],
        t
      );

      const discountPercent = Number(discountData?.[0]?.percent_dis) || 0;
      const discountFlat = Number(discountData?.[0]?.flat_dis) || 0;

      const discountAmount =
        (discountPercent / 100) * price + discountFlat * Number(item.quantity);

      // Tax on discounted price
      const taxPercentData = await queryDb(
        `SELECT IFNULL(SUM(t.percentage),0) AS total_tax
         FROM sn_product_tax pt
         INNER JOIN sn_tax t ON t.tax_id = pt.tax_id
         WHERE pt.varient_id = ?;`,
        [Number(item.varient_id)],
        t
      );

      const taxPercent =
        Number(taxPercentData?.[0]?.total_tax) * Number(item.quantity) || 0;
      const taxAmount = (Number(taxPercentData?.[0]?.total_tax) / 100) * price;

      await queryDb(
        `INSERT INTO sn_order_item 
         (order_id, order_unique_id, variant_id, quantity, unit_price, discount, tax_amount, tax_percent,grand_total, store_id, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?, NOW())`,
        [
          order_id,
          orderuniqueid,
          item.varient_id,
          item.quantity,
          unitPrice,
          discountAmount,
          taxAmount,
          taxPercent,
          price - discountAmount + taxAmount,
          pro_unit_price?.[0]?.store_id,
        ],
        t
      );

      await queryDb(
        `UPDATE sn_product_inventory
         SET quantity = quantity - ?, last_updated = NOW(), updated_by = 'User'
         WHERE varient_id = ?;`,
        [Number(item.quantity), Number(item.varient_id)],
        t
      );
    }

    // Insert payment if exists
    if (parsedPayment) {
      await queryDb(
        `INSERT INTO sn_payment 
        (order_id, payment_method, payment_status, payment_date, amount) 
        VALUES (?, ?, ?, NOW(), ?)`,
        [
          order_id,
          parsedPayment.method || payment_method || null,
          parsedPayment.status || payment_status,
          parsedPayment.amount || grand_total,
        ],
        t
      );
    }

    // Insert shipping details (enum: 0=Pending, 1=Shipped, 2=Delivered, 3=Cancelled)
    const shippingDetails = await queryDb(
      `INSERT INTO sn_shipping_detail 
       (order_id, address, city, state, postal_code, country) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        order_id,
        `${orderInfo?.[0]?.address_line1 || ""} ${
          orderInfo?.[0]?.address_line2 || ""
        }`,
        orderInfo?.[0]?.city || "",
        orderInfo?.[0]?.state || "",
        orderInfo?.[0]?.postal_code || "",
        orderInfo?.[0]?.country || "",
      ],
      t
    );
    await queryDb(
      "UPDATE sn_customer_order SET shipping_address = ?,billing_address=? WHERE order_id = ? LIMIT 1;",
      [shippingDetails, shippingDetails, order_id],
      t
    );
    await t.commit();
    return res.status(200).json(
      returnResponse(true, false, "Order placed successfully.", {
        orderId: orderuniqueid,
      })
    );
  } catch (e) {
    if (t) await t.rollback();
    next(e);
  }
};

// Get All Orders
exports.getAllCustomerOrders = async (req, res, next) => {
  const userId = req?.userId;
  const roleId = req?.roleId;
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

    let countQuery = `SELECT COUNT(*) AS cnt FROM sn_order_details WHERE 1 `;
    let baseQuery = `
      SELECT * FROM sn_order_details WHERE 1 `;

    let reP = [];
    let reB = [];

    if (String(roleId) === "0") {
      countQuery += " AND customer_id = ?";
      baseQuery += " AND customer_id = ?";
      reP.push(Number(userId));
      reB.push(Number(userId));
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
          order_unique LIKE ? OR 
          notes LIKE ? OR 
          status LIKE ?
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
      returnResponse(false, true, "Order fetched.", {
        data: result,
        totalPage: Math.ceil(totalRows / pageSize),
        currPage: pageNumber,
      })
    );
  } catch (e) {
    next(e);
  }
};

// Get Order by ID
exports.getCustomerOrderByOrderId = async (req, res, next) => {
  try {
    const { order_id } = req.query;
    if (!order_id) {
      return res
        .status(201)
        .json(returnResponse(false, true, "order_id is required."));
    }
    const query = `
      SELECT * FROM sn_order_details WHERE order_unique = ? LIMIT 1;`;

    const result = await queryDb(query, [order_id]);

    if (result.length === 0) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Order not found."));
    }

    return res
      .status(200)
      .json(returnResponse(true, false, "Order fetched.", result[0]));
  } catch (e) {
    next(e);
  }
};

// Update Order
exports.updateCustomerOrder = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(
      req.userId,
      "update_order_status"
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

    const { order_id, status } = req.body;
    // Pendding, Shipped, In Transit, Delivered, Cancelled

    if (!order_id || !status) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Order ID And status is required."));
    }
    const orderDetails = await queryDb(
      "SELECT * FROM sn_customer_order WHERE order_unique = ? LIMIT 1;",
      [order_id]
    );
    if (orderDetails.length === 0) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Order not found."));
    }
    const data = orderDetails?.[0];
    if (data?.status === "Delivered") {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Sorry You can't update the order status as it is already delivered."
          )
        );
    }
    if (
      data?.status === "In Transit" &&
      ["Pending", "Shipped"]?.includes(status)
    ) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Sorry You can't update the order status as it is already In Transit."
          )
        );
    }
    if (data?.status === "Shipped" && ["Pending"]?.includes(status)) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Sorry You can't update the order status as it is already Shipped."
          )
        );
    }

    const query = `
      UPDATE sn_customer_order 
      SET status = ?
      WHERE order_id = ?`;

    await queryDb(query, [status, data?.order_id]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Order updated successfully."));
  } catch (e) {
    next(e);
  }
};

// Delete Order
exports.deleteCustomerOrder = async (req, res, next) => {
  try {
    const { order_id } = req.body;

    const query = `DELETE FROM sn_customer_order WHERE order_id = ?`;
    await queryDb(query, [order_id]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Order deleted successfully."));
  } catch (e) {
    next(e);
  }
};
// Cancel request
exports.cancelOrder = async (req, res, next) => {
  let t;
  const userId = req.userId;
  try {
    const { order_id, reason, notes } = req.body;

    if (!order_id || !reason || !notes)
      return res
        .status(201)
        .json(returnResponse(false, true, "Please fill all the fields"));
    const orderDetails = await queryDb(
      "SELECT * FROM sn_customer_order WHERE order_unique = ? AND customer_id = ? LIMIT 1;",
      [order_id, userId],
      t
    );
    if (orderDetails.length === 0) {
      await t.rollback();
      return res
        .status(201)
        .json(returnResponse(false, true, "Order not found."));
    }
    const data = orderDetails?.[0];

    if (
      ["Shipped", "In Transit", "Delivered", "Cancelled"]?.includes(
        data?.status
      )
    )
      return res
        .status(201)
        .json(returnResponse(false, true, "Order status cannot be changed."));
    t = await sequelize.transaction();

    await queryDb(
      "UPDATE `sn_customer_order` SET `status` = 5 WHERE `order_id` = ? LIMIT 1;",
      [data?.order_id],
      t
    );
    const query =
      "INSERT INTO `sn_cancel_request`(`order_id`,`customer_id`,`reason`,`status`,`requested_at`,`notes`) VALUES(?,?,?,?,NOW(),?);";
    await queryDb(
      query,
      [data?.order_id, userId, reason || "", 2, notes || ""],
      t
    );
    await t.commit();
    return res
      .status(200)
      .json(returnResponse(true, false, "Order Cancelled successfully."));
  } catch (e) {
    if (t) await t.rollback();
    next(e);
  }
};

// Create Order Item
exports.createOrderItem = async (req, res, next) => {
  try {
    const { order_id, product_id, quantity, unit_price } = req.body;

    if (!order_id || !product_id || !quantity || !unit_price) {
      return res
        .status(201)
        .json(returnResponse(false, true, "All fields are required."));
    }

    const query = `
      INSERT INTO sn_order_item (order_id, product_id, quantity, unit_price)
      VALUES (?, ?, ?, ?)`;

    await queryDb(query, [order_id, product_id, quantity, unit_price]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Order item created successfully."));
  } catch (e) {
    next(e);
  }
};

// Get All Order Items
exports.getAllOrderItems = async (req, res, next) => {
  try {
    const query = `
      SELECT oi.*, p.product_name, o.order_date
      FROM sn_order_item oi
      JOIN sn_product p ON oi.product_id = p.product_id
      JOIN sn_customer_order o ON oi.order_id = o.order_id`;

    const result = await queryDb(query);

    return res
      .status(200)
      .json(returnResponse(true, false, "Order items fetched.", result));
  } catch (e) {
    next(e);
  }
};

// Get Order Item by ID
exports.getOrderItemById = async (req, res, next) => {
  try {
    const { order_item_id } = req.body;

    const query = `
      SELECT oi.*, p.product_name, o.order_date
      FROM sn_order_item oi
      JOIN sn_product p ON oi.product_id = p.product_id
      JOIN sn_customer_order o ON oi.order_id = o.order_id
      WHERE oi.order_item_id = ?`;

    const result = await queryDb(query, [order_item_id]);

    if (result.length === 0) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Order item not found."));
    }

    return res
      .status(200)
      .json(returnResponse(true, false, "Order item fetched.", result[0]));
  } catch (e) {
    next(e);
  }
};

// Update Order Item
exports.updateOrderItem = async (req, res, next) => {
  try {
    const { order_item_id, quantity, unit_price } = req.body;

    if (!order_item_id) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Order Item ID is required."));
    }

    const query = `
      UPDATE sn_order_item
      SET quantity = ?, unit_price = ?
      WHERE order_item_id = ?`;

    await queryDb(query, [quantity, unit_price, order_item_id]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Order item updated successfully."));
  } catch (e) {
    next(e);
  }
};

// Delete Order Item
exports.deleteOrderItem = async (req, res, next) => {
  try {
    const { order_item_id } = req.body;

    const query = `DELETE FROM sn_order_item WHERE order_item_id = ?`;
    await queryDb(query, [order_item_id]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Order item deleted successfully."));
  } catch (e) {
    next(e);
  }
};
// sn_payment.controller.js

exports.createPayment = async (req, res, next) => {
  try {
    const { order_id, payment_method, payment_status, payment_date, amount } =
      req.body;

    const query = `
      INSERT INTO sn_payment (order_id, payment_method, payment_status, payment_date, amount)
      VALUES (?, ?, ?, ?, ?)
    `;

    await queryDb(query, [
      order_id,
      payment_method,
      payment_status,
      payment_date,
      amount,
    ]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Payment created successfully."));
  } catch (e) {
    next(e);
  }
};

exports.getAllPayments = async (req, res, next) => {
  try {
    const query = `SELECT * FROM sn_payment`;
    const result = await queryDb(query);

    return res.status(200).json(returnResponse(true, false, result));
  } catch (e) {
    next(e);
  }
};

exports.getPaymentById = async (req, res, next) => {
  try {
    const { payment_id } = req.params;

    const query = `SELECT * FROM sn_payment WHERE payment_id = ?`;
    const result = await queryDb(query, [payment_id]);

    return res.status(200).json(returnResponse(true, false, result));
  } catch (e) {
    next(e);
  }
};

exports.updatePayment = async (req, res, next) => {
  try {
    const { payment_id } = req.params;
    const { order_id, payment_method, payment_status, payment_date, amount } =
      req.body;

    const query = `
      UPDATE sn_payment
      SET order_id = ?, payment_method = ?, payment_status = ?, payment_date = ?, amount = ?
      WHERE payment_id = ?
    `;

    await queryDb(query, [
      order_id,
      payment_method,
      payment_status,
      payment_date,
      amount,
      payment_id,
    ]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Payment updated successfully."));
  } catch (e) {
    next(e);
  }
};

exports.deletePayment = async (req, res, next) => {
  try {
    const { payment_id } = req.body;

    const query = `DELETE FROM sn_payment WHERE payment_id = ?`;
    await queryDb(query, [payment_id]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Payment deleted successfully."));
  } catch (e) {
    next(e);
  }
};
// sn_shipping_detail.controller.js

exports.createShippingDetail = async (req, res, next) => {
  try {
    const {
      order_id,
      address,
      city,
      state,
      postal_code,
      country,
      shipped_date,
      delivery_date,
      status,
    } = req.body;

    const query = `
      INSERT INTO sn_shipping_detail (
        order_id, address, city, state, postal_code, country,
        shipped_date, delivery_date, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await queryDb(query, [
      order_id,
      address,
      city,
      state,
      postal_code,
      country,
      shipped_date,
      delivery_date,
      status,
    ]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Shipping detail created successfully.")
      );
  } catch (e) {
    next(e);
  }
};

exports.getAllShippingDetails = async (req, res, next) => {
  try {
    const query = `SELECT * FROM sn_shipping_detail`;
    const result = await queryDb(query);

    return res.status(200).json(returnResponse(true, false, result));
  } catch (e) {
    next(e);
  }
};

exports.getShippingDetailById = async (req, res, next) => {
  try {
    const { shipping_id } = req.params;

    const query = `SELECT * FROM sn_shipping_detail WHERE shipping_id = ?`;
    const result = await queryDb(query, [shipping_id]);

    return res.status(200).json(returnResponse(true, false, result));
  } catch (e) {
    next(e);
  }
};

exports.updateShippingDetail = async (req, res, next) => {
  try {
    const { shipping_id } = req.params;
    const {
      order_id,
      address,
      city,
      state,
      postal_code,
      country,
      shipped_date,
      delivery_date,
      status,
    } = req.body;

    const query = `
      UPDATE sn_shipping_detail
      SET order_id = ?, address = ?, city = ?, state = ?, postal_code = ?, 
          country = ?, shipped_date = ?, delivery_date = ?, status = ?
      WHERE shipping_id = ?
    `;

    await queryDb(query, [
      order_id,
      address,
      city,
      state,
      postal_code,
      country,
      shipped_date,
      delivery_date,
      status,
      shipping_id,
    ]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Shipping detail updated successfully.")
      );
  } catch (e) {
    next(e);
  }
};

exports.deleteShippingDetail = async (req, res, next) => {
  try {
    const { shipping_id } = req.body;

    const query = `DELETE FROM sn_shipping_detail WHERE shipping_id = ?`;
    await queryDb(query, [shipping_id]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Shipping detail deleted successfully.")
      );
  } catch (e) {
    next(e);
  }
};
// sn_supplier.controller.js

exports.createSupplier = async (req, res, next) => {
  try {
    const { name, contact_name, email, phone, address } = req.body;

    const query = `
      INSERT INTO sn_supplier (name, contact_name, email, phone, address)
      VALUES (?, ?, ?, ?, ?)
    `;

    await queryDb(query, [name, contact_name, email, phone, address]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Supplier created successfully."));
  } catch (e) {
    next(e);
  }
};

exports.getAllSuppliers = async (req, res, next) => {
  try {
    const query = `SELECT * FROM sn_supplier`;
    const result = await queryDb(query);

    return res.status(200).json(returnResponse(true, false, result));
  } catch (e) {
    next(e);
  }
};

exports.getSupplierById = async (req, res, next) => {
  try {
    const { supplier_id } = req.params;

    const query = `SELECT * FROM sn_supplier WHERE supplier_id = ?`;
    const result = await queryDb(query, [supplier_id]);

    return res.status(200).json(returnResponse(true, false, result));
  } catch (e) {
    next(e);
  }
};

exports.updateSupplier = async (req, res, next) => {
  try {
    const { supplier_id } = req.params;
    const { name, contact_name, email, phone, address } = req.body;

    const query = `
      UPDATE sn_supplier
      SET name = ?, contact_name = ?, email = ?, phone = ?, address = ?
      WHERE supplier_id = ?
    `;

    await queryDb(query, [
      name,
      contact_name,
      email,
      phone,
      address,
      supplier_id,
    ]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Supplier updated successfully."));
  } catch (e) {
    next(e);
  }
};

exports.deleteSupplier = async (req, res, next) => {
  try {
    const { supplier_id } = req.body;

    const query = `DELETE FROM sn_supplier WHERE supplier_id = ?`;
    await queryDb(query, [supplier_id]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Supplier deleted successfully."));
  } catch (e) {
    next(e);
  }
};
// sn_discount.controller.js

exports.createDiscount = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(req.userId, "create_discount");
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
      name,
      discount_type,
      value,
      start_date,
      end_date,
      is_active = "Active",
    } = req.body;

    // Basic validations
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res
        .status(201)
        .json(
          returnResponse(false, true, "Name is required and must be a string.")
        );
    }

    if (!discount_type || typeof discount_type !== "string") {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Discount type is required and must be a string."
          )
        );
    }

    if (value === undefined || isNaN(value) || Number(value) <= 0) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Value must be a positive number."));
    }

    // Validate date format using moment.js
    if (
      !moment(start_date, "YYYY-MM-DD", true).isValid() ||
      !moment(end_date, "YYYY-MM-DD", true).isValid()
    ) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Start date and end date must be valid 'YYYY-MM-DD' format."
          )
        );
    }

    if (moment(end_date).isBefore(moment(start_date))) {
      return res
        .status(201)
        .json(
          returnResponse(false, true, "End date must be after start date.")
        );
    }

    const query = `
      INSERT INTO sn_discount (name, discount_type, value, start_date, end_date, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await queryDb(query, [
      name.trim(),
      discount_type.trim(),
      parseFloat(value),
      start_date,
      end_date,
      is_active,
    ]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Discount created successfully."));
  } catch (e) {
    next(e);
  }
};

exports.getAllDiscounts = async (req, res, next) => {
  try {
    const query = `SELECT * FROM sn_discount`;

    const result = await queryDb(query);
    return res
      .status(200)
      .json(
        returnResponse(true, false, "Discount fetched Succesfully", result)
      );
  } catch (e) {
    next(e);
  }
};

exports.getDiscountById = async (req, res, next) => {
  try {
    const { discount_id } = req.params;

    const query = `SELECT * FROM sn_discount WHERE discount_id = ?`;

    const result = await queryDb(query, [discount_id]);
    return res.status(200).json(returnResponse(true, false, result));
  } catch (e) {
    next(e);
  }
};

exports.updateDiscount = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(req.userId, "update_discount");
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
      discount_id,
      name,
      discount_type,
      value,
      start_date,
      end_date,
      is_active,
    } = req.body;

    // Validation checks
    if (!discount_id || isNaN(discount_id)) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Invalid or missing discount ID."));
    }

    // Name validation
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res
        .status(201)
        .json(
          returnResponse(false, true, "Name is required and must be a string.")
        );
    }

    // Discount type validation
    if (!discount_type || typeof discount_type !== "string") {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Discount type is required and must be a string."
          )
        );
    }

    // Value validation (must be a positive number)
    if (value === undefined || isNaN(value) || Number(value) <= 0) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Value must be a positive number."));
    }

    // Date validation using moment.js
    if (
      !moment(start_date, "YYYY-MM-DD", true).isValid() ||
      !moment(end_date, "YYYY-MM-DD", true).isValid()
    ) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Start date and end date must be valid 'YYYY-MM-DD' format."
          )
        );
    }

    // End date should be after the start date
    if (moment(end_date).isBefore(moment(start_date))) {
      return res
        .status(201)
        .json(
          returnResponse(false, true, "End date must be after start date.")
        );
    }

    // is_active validation (must be 'Active' or 'Deactive')
    const validStatus = ["Active", "Deactive"];
    if (is_active && !validStatus.includes(is_active)) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "is_active must be 'Active' or 'Deactive'."
          )
        );
    }

    // Query to update the discount
    const query = `
      UPDATE sn_discount
      SET name = ?, discount_type = ?, value = ?, start_date = ?, end_date = ?, is_active = ?
      WHERE discount_id = ?
    `;

    await queryDb(query, [
      name.trim(),
      discount_type.trim(),
      parseFloat(value),
      start_date,
      end_date,
      is_active || "Active", // Default to 'Active' if not provided
      discount_id,
    ]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Discount updated successfully."));
  } catch (e) {
    next(e);
  }
};

exports.deleteDiscount = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(req.userId, "delete_discount");
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
    const { discount_id } = req.query;
    if (!discount_id || isNaN(discount_id)) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Invalid or missing discount ID."));
    }
    const query = `DELETE FROM sn_discount WHERE discount_id = ?`;
    await queryDb(query, [discount_id]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Discount deleted successfully."));
  } catch (e) {
    next(e);
  }
};

// sn_product_discount.controller.js

exports.createProductDiscount = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(
      req.userId,
      "create_product_discount"
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
    const { product_id, discount_id, varient_id } = req.body;
    if (!varient_id || !product_id || !discount_id || isNaN(discount_id)) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Invalid or missing discount ID or Product ID. or varient_id"
          )
        );
    }
    const query = `
      INSERT INTO sn_product_discount (product_id, discount_id,varient_id)
      VALUES (?, ?,?)
    `;

    await queryDb(query, [product_id, discount_id, varient_id]);

    return res
      .status(200)
      .json(
        returnResponse(
          true,
          false,
          "Product-discount mapping created successfully."
        )
      );
  } catch (e) {
    next(e);
  }
};

exports.getAllProductDiscounts = async (req, res, next) => {
  try {
    const query = ` 
      SELECT * FROM sn_product_discount_details;
    `;

    const result = await queryDb(query);
    return res.status(200).json(returnResponse(true, false, result));
  } catch (e) {
    next(e);
  }
};

exports.getProductDiscountById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT pd.*, p.productName, d.name AS discount_name
      FROM sn_product_discount pd
      JOIN sn_product p ON p.product_id = pd.product_id
      JOIN sn_discount d ON d.discount_id = pd.discount_id
      WHERE pd.id = ?
    `;

    const result = await queryDb(query, [id]);
    return res.status(200).json(returnResponse(true, false, result));
  } catch (e) {
    next(e);
  }
};

exports.updateProductDiscount = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(
      req.userId,
      "update_product_discount"
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
    const { id, varient_id, discount_id } = req.body;
    if (!id || !varient_id || !discount_id || isNaN(discount_id)) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Invalid or missing discount ID or Product ID or id"
          )
        );
    }
    const query = `
      UPDATE sn_product_discount
      SET varient_id = ?, discount_id = ?
      WHERE id = ?
    `;

    await queryDb(query, [varient_id, discount_id, id]);

    return res
      .status(200)
      .json(
        returnResponse(
          true,
          false,
          "Product-discount mapping updated successfully."
        )
      );
  } catch (e) {
    next(e);
  }
};

exports.deleteProductDiscount = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(
      req.userId,
      "delete_product_discount"
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
    const { id } = req.query;

    const query = `DELETE FROM sn_product_discount WHERE id = ?`;
    await queryDb(query, [id]);

    return res
      .status(200)
      .json(
        returnResponse(
          true,
          false,
          "Product-discount mapping deleted successfully."
        )
      );
  } catch (e) {
    next(e);
  }
};
// sn_tax.controller.js

exports.createTax = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(req.userId, "create_tax");
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
    const { name, percentage, is_active = 1 } = req.body;
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Name is required and must be a valid string."
          )
        );
    }

    // Validate the percentage (must be a number between 0 and 100)
    if (
      percentage === undefined ||
      isNaN(percentage) ||
      percentage < 0 ||
      percentage > 100
    ) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Percentage must be a number between 0 and 100."
          )
        );
    }
    const query = `
      INSERT INTO sn_tax (name, percentage, is_active)
      VALUES (?, ?, ?)
    `;

    await queryDb(query, [name, percentage, is_active]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Tax created successfully."));
  } catch (e) {
    next(e);
  }
};

exports.getAllTaxes = async (req, res, next) => {
  try {
    const query = `SELECT * FROM sn_tax`;
    const result = await queryDb(query);

    return res
      .status(200)
      .json(returnResponse(true, false, "Tax fetched successfully", result));
  } catch (e) {
    next(e);
  }
};

exports.getTaxById = async (req, res, next) => {
  try {
    const { tax_id } = req.params;

    const query = `SELECT * FROM sn_tax WHERE tax_id = ?`;
    const result = await queryDb(query, [tax_id]);

    return res.status(200).json(returnResponse(true, false, result));
  } catch (e) {
    next(e);
  }
};

exports.updateTax = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(req.userId, "update_tax");
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
    const { tax_id, name, percentage, is_active = 1 } = req.body;
    if (!tax_id || !name || typeof name !== "string" || name.trim() === "") {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Tax Id and Name is required and must be a valid string."
          )
        );
    }

    // Validate the percentage (must be a number between 0 and 100)
    if (
      percentage === undefined ||
      isNaN(percentage) ||
      percentage < 0 ||
      percentage > 100
    ) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Percentage must be a number between 0 and 100."
          )
        );
    }
    const query = `
      UPDATE sn_tax
      SET name = ?, percentage = ?, is_active = ?
      WHERE tax_id = ?
    `;

    await queryDb(query, [name, percentage, is_active, tax_id]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Tax updated successfully."));
  } catch (e) {
    next(e);
  }
};

exports.deleteTax = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(req.userId, "delete_tax");
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
    const { tax_id } = req.query;
    if (!tax_id) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Tax Id is required and must be a valid string."
          )
        );
    }
    const query = `DELETE FROM sn_tax WHERE tax_id = ?`;
    await queryDb(query, [tax_id]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Tax deleted successfully."));
  } catch (e) {
    next(e);
  }
};

// sn_product_tax.controller.js

exports.createProductTax = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(
      req.userId,
      "create_product_tax"
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
    const { product_id, tax_id, variant_id } = req.body;
    if (!product_id || !tax_id || !variant_id) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Tax Id And Product Id ,variant_id is required and must be a valid string."
          )
        );
    }
    const query = `
      INSERT INTO sn_product_tax (product_id, tax_id,varient_id)
      VALUES (?, ?,?)
    `;

    await queryDb(query, [product_id, tax_id, variant_id]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Product-Tax mapping created successfully.")
      );
  } catch (e) {
    next(e);
  }
};

exports.getAllProductTaxes = async (req, res, next) => {
  try {
    const query = `SELECT * FROM sn_tax_details`;
    const result = await queryDb(query);

    return res
      .status(200)
      .json(returnResponse(true, false, "Product Tax", result));
  } catch (e) {
    next(e);
  }
};

exports.getProductTaxById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = `SELECT * FROM sn_product_tax WHERE id = ?`;
    const result = await queryDb(query, [id]);

    return res.status(200).json(returnResponse(true, false, result));
  } catch (e) {
    next(e);
  }
};

exports.updateProductTax = async (req, res, next) => {
  try {
    const hasPermission = await checkPermission(
      req.userId,
      "update_product_tax"
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
    const { varient_id, tax_id, id } = req.body;
    if (!varient_id || !tax_id || !id) {
      return res
        .status(201)
        .json(
          returnResponse(
            false,
            true,
            "Tax Id And Product Id is ID required and must be a valid string."
          )
        );
    }
    const query = `
      UPDATE sn_product_tax
      SET varient_id = ?, tax_id = ?
      WHERE id = ?
    `;

    await queryDb(query, [varient_id, tax_id, id]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Product-Tax mapping updated successfully.")
      );
  } catch (e) {
    next(e);
  }
};

exports.deleteProductTax = async (req, res, next) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res
        .status(201)
        .json(
          returnResponse(false, true, "ID required and must be a valid Number.")
        );
    }
    const query = `DELETE FROM sn_product_tax WHERE id = ?`;
    await queryDb(query, [id]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Product-Tax mapping deleted successfully.")
      );
  } catch (e) {
    next(e);
  }
};
// sn_product_review.controller.js

exports.createProductReview = async (req, res, next) => {
  try {
    const { product_id, customer_id, rating, review_text, review_date } =
      req.body;

    const query = `
      INSERT INTO sn_product_review (product_id, customer_id, rating, review_text, review_date)
      VALUES (?, ?, ?, ?, ?)
    `;

    await queryDb(query, [
      product_id,
      customer_id,
      rating,
      review_text,
      review_date,
    ]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Product review created successfully.")
      );
  } catch (e) {
    next(e);
  }
};

exports.getAllProductReviews = async (req, res, next) => {
  try {
    const query = `SELECT * FROM sn_product_review`;
    const result = await queryDb(query);

    return res.status(200).json(returnResponse(true, false, result));
  } catch (e) {
    next(e);
  }
};

exports.getProductReviewById = async (req, res, next) => {
  try {
    const { review_id } = req.params;

    const query = `SELECT * FROM sn_product_review WHERE review_id = ?`;
    const result = await queryDb(query, [review_id]);

    return res.status(200).json(returnResponse(true, false, result));
  } catch (e) {
    next(e);
  }
};

exports.updateProductReview = async (req, res, next) => {
  try {
    const { review_id } = req.params;
    const { product_id, customer_id, rating, review_text, review_date } =
      req.body;

    const query = `
      UPDATE sn_product_review
      SET product_id = ?, customer_id = ?, rating = ?, review_text = ?, review_date = ?
      WHERE review_id = ?
    `;

    await queryDb(query, [
      product_id,
      customer_id,
      rating,
      review_text,
      review_date,
      review_id,
    ]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Product review updated successfully.")
      );
  } catch (e) {
    next(e);
  }
};

exports.deleteProductReview = async (req, res, next) => {
  try {
    const { review_id } = req.body;

    const query = `DELETE FROM sn_product_review WHERE review_id = ?`;
    await queryDb(query, [review_id]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Product review deleted successfully.")
      );
  } catch (e) {
    next(e);
  }
};
// sn_wishlist_item.controller.js

exports.createWishlistItem = async (req, res, next) => {
  const userId = req.userId;
  try {
    const { product_id } = req.query;
    if (!product_id)
      return res
        .status(201)
        .json(returnResponse(false, true, "Product ID is required."));
    const isAlreadyExist = await queryDb(
      "SELECT 1 FROM sn_wishlist_item WHERE customer_id = ? AND product_id = ?",
      [userId, product_id]
    );
    if (isAlreadyExist?.length > 0) {
      return res
        .status(201)
        .json(
          returnResponse(false, true, "Product is already in yourwish list")
        );
    }
    const query =
      "INSERT INTO `sn_wishlist_item`(`customer_id`,`product_id`) VALUES(?,?);";

    await queryDb(query, [userId, product_id]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Wishlist item added successfully."));
  } catch (e) {
    next(e);
  }
};

exports.getAllWishlistItems = async (req, res, next) => {
  const userId = req.userId;
  try {
    const query = `SELECT * FROM sn_wishlist_item_details WHERE customer_id =?`;
    const result = await queryDb(query, [userId]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Wishlist fetch successfully!", result)
      );
  } catch (e) {
    next(e);
  }
};

exports.removeFromWishlistItem = async (req, res, next) => {
  const userId = req.userId;
  try {
    const { wishlist_item_id } = req.query;
    if (!wishlist_item_id)
      return res
        .status(201)
        .json(returnResponse(false, true, "Invalid wishlist item id"));
    const query = `
      DELETE FROM sn_wishlist_item WHERE wishlist_item_id = ? AND customer_id = ? LIMIT 1;
    `;

    await queryDb(query, [wishlist_item_id, userId]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Wishlist item removed successfully."));
  } catch (e) {
    next(e);
  }
};

// sn_cart.controller.js

exports.createCart = async (req, res, next) => {
  try {
    const { customer_id } = req.body;
    const created_at = new Date();

    const query = `
      INSERT INTO sn_cart (customer_id, created_at)
      VALUES (?, ?)
    `;

    await queryDb(query, [customer_id, created_at]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Cart created successfully."));
  } catch (e) {
    next(e);
  }
};

exports.getAllCarts = async (req, res, next) => {
  try {
    const query = `SELECT * FROM sn_cart`;
    const result = await queryDb(query);

    return res.status(200).json(returnResponse(true, false, result));
  } catch (e) {
    next(e);
  }
};

exports.getCartById = async (req, res, next) => {
  try {
    const { cart_id } = req.params;

    const query = `SELECT * FROM sn_cart WHERE cart_id = ?`;
    const result = await queryDb(query, [cart_id]);

    return res.status(200).json(returnResponse(true, false, result));
  } catch (e) {
    next(e);
  }
};

exports.updateCart = async (req, res, next) => {
  try {
    const { cart_id } = req.params;
    const { customer_id } = req.body;

    const query = `
      UPDATE sn_cart
      SET customer_id = ?
      WHERE cart_id = ?
    `;

    await queryDb(query, [customer_id, cart_id]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Cart updated successfully."));
  } catch (e) {
    next(e);
  }
};

exports.deleteCart = async (req, res, next) => {
  try {
    const { cart_id } = req.body;

    const query = `DELETE FROM sn_cart WHERE cart_id = ?`;
    await queryDb(query, [cart_id]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Cart deleted successfully."));
  } catch (e) {
    next(e);
  }
};
// sn_cart_item.controller.js

exports.createCartItem = async (req, res, next) => {
  try {
    const { cart_id, product_id, quantity } = req.body;

    const query = `
      INSERT INTO sn_cart_item (cart_id, product_id, quantity)
      VALUES (?, ?, ?)
    `;

    await queryDb(query, [cart_id, product_id, quantity]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Cart item added successfully."));
  } catch (e) {
    next(e);
  }
};

exports.getAllCartItems = async (req, res, next) => {
  try {
    const query = `SELECT * FROM sn_cart_item`;
    const result = await queryDb(query);

    return res.status(200).json(returnResponse(true, false, result));
  } catch (e) {
    next(e);
  }
};

exports.getCartItemById = async (req, res, next) => {
  try {
    const { cart_item_id } = req.params;

    const query = `SELECT * FROM sn_cart_item WHERE cart_item_id = ?`;
    const result = await queryDb(query, [cart_item_id]);

    return res.status(200).json(returnResponse(true, false, result));
  } catch (e) {
    next(e);
  }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    const { cart_item_id } = req.params;
    const { cart_id, product_id, quantity } = req.body;

    const query = `
      UPDATE sn_cart_item
      SET cart_id = ?, product_id = ?, quantity = ?
      WHERE cart_item_id = ?
    `;

    await queryDb(query, [cart_id, product_id, quantity, cart_item_id]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Cart item updated successfully."));
  } catch (e) {
    next(e);
  }
};

exports.deleteCartItem = async (req, res, next) => {
  try {
    const { cart_item_id } = req.body;

    const query = `DELETE FROM sn_cart_item WHERE cart_item_id = ?`;
    await queryDb(query, [cart_item_id]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Cart item deleted successfully."));
  } catch (e) {
    next(e);
  }
};

// sn_return_request.controller.js

exports.createReturnRequest = async (req, res, next) => {
  try {
    const { order_id, product_id, customer_id, reason, request_date, status } =
      req.body;

    const query = `
      INSERT INTO sn_return_request (order_id, product_id, customer_id, reason, request_date, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await queryDb(query, [
      order_id,
      product_id,
      customer_id,
      reason,
      request_date,
      status,
    ]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Return request created successfully.")
      );
  } catch (e) {
    next(e);
  }
};

exports.getAllReturnRequests = async (req, res, next) => {
  try {
    const query = `SELECT * FROM sn_return_request`;
    const result = await queryDb(query);

    return res.status(200).json(returnResponse(true, false, result));
  } catch (e) {
    next(e);
  }
};

exports.getReturnRequestById = async (req, res, next) => {
  try {
    const { return_id } = req.params;

    const query = `SELECT * FROM sn_return_request WHERE return_id = ?`;
    const result = await queryDb(query, [return_id]);

    return res.status(200).json(returnResponse(true, false, result));
  } catch (e) {
    next(e);
  }
};

exports.updateReturnRequest = async (req, res, next) => {
  try {
    const { return_id } = req.params;
    const { order_id, product_id, customer_id, reason, request_date, status } =
      req.body;

    const query = `
      UPDATE sn_return_request
      SET order_id = ?, product_id = ?, customer_id = ?, reason = ?, request_date = ?, status = ?
      WHERE return_id = ?
    `;

    await queryDb(query, [
      order_id,
      product_id,
      customer_id,
      reason,
      request_date,
      status,
      return_id,
    ]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Return request updated successfully.")
      );
  } catch (e) {
    next(e);
  }
};

exports.deleteReturnRequest = async (req, res, next) => {
  try {
    const { return_id } = req.body;

    const query = `DELETE FROM sn_return_request WHERE return_id = ?`;
    await queryDb(query, [return_id]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Return request deleted successfully.")
      );
  } catch (e) {
    next(e);
  }
};
// sn_customer_activity_log.controller.js

exports.createCustomerActivity = async (req, res, next) => {
  try {
    const { customer_id, activity_type, description, activity_time } = req.body;

    const query = `
      INSERT INTO sn_customer_activity_log (customer_id, activity_type, description, activity_time)
      VALUES (?, ?, ?, ?)
    `;

    await queryDb(query, [
      customer_id,
      activity_type,
      description,
      activity_time,
    ]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Customer activity logged successfully.")
      );
  } catch (e) {
    next(e);
  }
};

exports.getAllCustomerActivities = async (req, res, next) => {
  try {
    const query = `SELECT * FROM sn_customer_activity_log`;
    const result = await queryDb(query);

    return res.status(200).json(returnResponse(true, false, result));
  } catch (e) {
    next(e);
  }
};

exports.getCustomerActivityById = async (req, res, next) => {
  try {
    const { activity_id } = req.params;

    const query = `SELECT * FROM sn_customer_activity_log WHERE activity_id = ?`;
    const result = await queryDb(query, [activity_id]);

    return res.status(200).json(returnResponse(true, false, result));
  } catch (e) {
    next(e);
  }
};

exports.updateCustomerActivity = async (req, res, next) => {
  try {
    const { activity_id } = req.params;
    const { customer_id, activity_type, description, activity_time } = req.body;

    const query = `
      UPDATE sn_customer_activity_log
      SET customer_id = ?, activity_type = ?, description = ?, activity_time = ?
      WHERE activity_id = ?
    `;

    await queryDb(query, [
      customer_id,
      activity_type,
      description,
      activity_time,
      activity_id,
    ]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Customer activity updated successfully.")
      );
  } catch (e) {
    next(e);
  }
};

exports.deleteCustomerActivity = async (req, res, next) => {
  try {
    const { activity_id } = req.body;

    const query = `DELETE FROM sn_customer_activity_log WHERE activity_id = ?`;
    await queryDb(query, [activity_id]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Customer activity deleted successfully.")
      );
  } catch (e) {
    next(e);
  }
};
exports.listCoupons = async (req, res, next) => {
  try {
    const query = `SELECT * FROM sn_coupon`;
    const result = await queryDb(query);
    return res
      .status(200)
      .json(returnResponse(true, result, "Coupons fetched successfully."));
  } catch (err) {
    next(err);
  }
};

exports.getCouponById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = `SELECT * FROM sn_coupon WHERE coupon_id = ?`;
    const result = await queryDb(query, [id]);
    return res
      .status(200)
      .json(returnResponse(true, result, "Coupon fetched successfully."));
  } catch (err) {
    next(err);
  }
};

exports.createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      description,
      discount_type,
      value,
      start_date,
      end_date,
      is_active,
    } = req.body;

    const query = `
      INSERT INTO sn_coupon (code, description, discount_type, value, start_date, end_date, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      code,
      description,
      discount_type,
      value,
      start_date,
      end_date,
      is_active ?? true,
    ];

    await queryDb(query, values);
    return res
      .status(201)
      .json(returnResponse(true, false, "Coupon created successfully."));
  } catch (err) {
    next(err);
  }
};

exports.updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      code,
      description,
      discount_type,
      value,
      start_date,
      end_date,
      is_active,
    } = req.body;

    const query = `
      UPDATE sn_coupon SET code = ?, description = ?, discount_type = ?, value = ?, 
      start_date = ?, end_date = ?, is_active = ? WHERE coupon_id = ?
    `;
    const values = [
      code,
      description,
      discount_type,
      value,
      start_date,
      end_date,
      is_active,
      id,
    ];

    await queryDb(query, values);
    return res
      .status(200)
      .json(returnResponse(true, false, "Coupon updated successfully."));
  } catch (err) {
    next(err);
  }
};

exports.deleteCoupon = async (req, res, next) => {
  try {
    const { coupon_id } = req.body;

    const query = `DELETE FROM sn_coupon WHERE coupon_id = ?`;
    await queryDb(query, [coupon_id]);

    return res
      .status(200)
      .json(returnResponse(true, false, "Coupon deleted successfully."));
  } catch (err) {
    next(err);
  }
};
exports.createCustomerCoupon = async (req, res, next) => {
  try {
    const { customer_id, coupon_id, used_at } = req.body;

    const query = `
      INSERT INTO sn_customer_coupon (customer_id, coupon_id, used_at)
      VALUES (?, ?, ?)
    `;

    await queryDb(query, [customer_id, coupon_id, used_at || null]);

    return res
      .status(201)
      .json(
        returnResponse(true, false, "Customer coupon created successfully.")
      );
  } catch (err) {
    next(err);
  }
};

exports.getCustomerCoupons = async (req, res, next) => {
  try {
    const { customer_id, coupon_id } = req.query;

    let query = `SELECT * FROM sn_customer_coupon WHERE 1=1`;
    const params = [];

    if (customer_id) {
      query += ` AND customer_id = ?`;
      params.push(customer_id);
    }
    if (coupon_id) {
      query += ` AND coupon_id = ?`;
      params.push(coupon_id);
    }

    const result = await queryDb(query, params);

    return res
      .status(200)
      .json(returnResponse(true, false, "Customer coupons fetched.", result));
  } catch (err) {
    next(err);
  }
};

exports.updateCustomerCoupon = async (req, res, next) => {
  try {
    const { id, used_at } = req.body;
    if (!id) {
      return res
        .status(201)
        .json(returnResponse(false, true, "ID is required."));
    }

    const query = `
      UPDATE sn_customer_coupon
      SET used_at = ?
      WHERE id = ?
    `;

    await queryDb(query, [used_at || new Date(), id]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Customer coupon updated successfully.")
      );
  } catch (err) {
    next(err);
  }
};

exports.deleteCustomerCoupon = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res
        .status(201)
        .json(returnResponse(false, true, "ID is required."));
    }

    const query = `DELETE FROM sn_customer_coupon WHERE id = ?`;
    await queryDb(query, [id]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Customer coupon deleted successfully.")
      );
  } catch (err) {
    next(err);
  }
};
exports.createShippingMethod = async (req, res, next) => {
  try {
    const { name, description, cost } = req.body;
    if (!name || cost === undefined) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Name and cost are required."));
    }

    const query = `
      INSERT INTO sn_shipping_method (name, description, cost)
      VALUES (?, ?, ?)
    `;

    await queryDb(query, [name, description || null, cost]);

    return res
      .status(201)
      .json(
        returnResponse(true, false, "Shipping method created successfully.")
      );
  } catch (err) {
    next(err);
  }
};

exports.getShippingMethods = async (req, res, next) => {
  try {
    const query = `SELECT * FROM sn_shipping_method`;
    const result = await queryDb(query);

    return res
      .status(200)
      .json(
        returnResponse(
          true,
          false,
          "Shipping methods fetched successfully.",
          result
        )
      );
  } catch (err) {
    next(err);
  }
};

exports.updateShippingMethod = async (req, res, next) => {
  try {
    const { shipping_method_id, name, description, cost } = req.body;
    if (!shipping_method_id) {
      return res
        .status(201)
        .json(returnResponse(false, true, "shipping_method_id is required."));
    }

    const query = `
      UPDATE sn_shipping_method
      SET name = ?, description = ?, cost = ?
      WHERE shipping_method_id = ?
    `;

    await queryDb(query, [name, description || null, cost, shipping_method_id]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Shipping method updated successfully.")
      );
  } catch (err) {
    next(err);
  }
};

exports.deleteShippingMethod = async (req, res, next) => {
  try {
    const { shipping_method_id } = req.body;
    if (!shipping_method_id) {
      return res
        .status(201)
        .json(returnResponse(false, true, "shipping_method_id is required."));
    }

    const query = `DELETE FROM sn_shipping_method WHERE shipping_method_id = ?`;
    await queryDb(query, [shipping_method_id]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "Shipping method deleted successfully.")
      );
  } catch (err) {
    next(err);
  }
};

exports.createNotificationPreference = async (req, res, next) => {
  try {
    const {
      customer_id,
      email_notifications,
      sms_notifications,
      push_notifications,
    } = req.body;
    if (!customer_id) {
      return res
        .status(201)
        .json(returnResponse(false, true, "customer_id is required."));
    }

    const query = `
      INSERT INTO sn_notification_preference 
        (customer_id, email_notifications, sms_notifications, push_notifications)
      VALUES (?, ?, ?, ?)
    `;

    await queryDb(query, [
      customer_id,
      email_notifications !== undefined ? email_notifications : true,
      sms_notifications !== undefined ? sms_notifications : false,
      push_notifications !== undefined ? push_notifications : false,
    ]);

    return res
      .status(201)
      .json(
        returnResponse(
          true,
          false,
          "Notification preference created successfully."
        )
      );
  } catch (err) {
    next(err);
  }
};

exports.getNotificationPreferences = async (req, res, next) => {
  try {
    const { customer_id } = req.query;

    let query = `SELECT * FROM sn_notification_preference WHERE 1=1`;
    const params = [];

    if (customer_id) {
      query += ` AND customer_id = ?`;
      params.push(customer_id);
    }

    const result = await queryDb(query, params);

    return res
      .status(200)
      .json(
        returnResponse(
          true,
          false,
          "Notification preferences fetched successfully.",
          result
        )
      );
  } catch (err) {
    next(err);
  }
};

exports.updateNotificationPreference = async (req, res, next) => {
  try {
    const {
      preference_id,
      email_notifications,
      sms_notifications,
      push_notifications,
    } = req.body;
    if (!preference_id) {
      return res
        .status(201)
        .json(returnResponse(false, true, "preference_id is required."));
    }

    const query = `
      UPDATE sn_notification_preference
      SET email_notifications = ?, sms_notifications = ?, push_notifications = ?
      WHERE preference_id = ?
    `;

    await queryDb(query, [
      email_notifications !== undefined ? email_notifications : true,
      sms_notifications !== undefined ? sms_notifications : false,
      push_notifications !== undefined ? push_notifications : false,
      preference_id,
    ]);

    return res
      .status(200)
      .json(
        returnResponse(
          true,
          false,
          "Notification preference updated successfully."
        )
      );
  } catch (err) {
    next(err);
  }
};

exports.deleteNotificationPreference = async (req, res, next) => {
  try {
    const { preference_id } = req.body;
    if (!preference_id) {
      return res
        .status(201)
        .json(returnResponse(false, true, "preference_id is required."));
    }

    const query = `DELETE FROM sn_notification_preference WHERE preference_id = ?`;
    await queryDb(query, [preference_id]);

    return res
      .status(200)
      .json(
        returnResponse(
          true,
          false,
          "Notification preference deleted successfully."
        )
      );
  } catch (err) {
    next(err);
  }
};
exports.createSystemSetting = async (req, res, next) => {
  try {
    const { setting_key, setting_value, updated_at } = req.body;
    if (!setting_key) {
      return res
        .status(201)
        .json(returnResponse(false, true, "setting_key is required."));
    }

    const query = `
      INSERT INTO sn_system_setting (setting_key, setting_value, updated_at)
      VALUES (?, ?, ?)
    `;

    await queryDb(query, [
      setting_key,
      setting_value || null,
      updated_at || new Date(),
    ]);

    return res
      .status(201)
      .json(
        returnResponse(true, false, "System setting created successfully.")
      );
  } catch (err) {
    // If setting_key is duplicate, handle error (optional)
    next(err);
  }
};

exports.getSystemSettings = async (req, res, next) => {
  try {
    const { setting_key } = req.query;

    let query = `SELECT * FROM sn_system_setting WHERE 1=1`;
    const params = [];

    if (setting_key) {
      query += ` AND setting_key = ?`;
      params.push(setting_key);
    }

    const result = await queryDb(query, params);

    return res
      .status(200)
      .json(
        returnResponse(
          true,
          false,
          "System settings fetched successfully.",
          result
        )
      );
  } catch (err) {
    next(err);
  }
};

exports.updateSystemSetting = async (req, res, next) => {
  try {
    const { setting_key, setting_value, updated_at } = req.body;
    if (!setting_key) {
      return res
        .status(201)
        .json(returnResponse(false, true, "setting_key is required."));
    }

    const query = `
      UPDATE sn_system_setting
      SET setting_value = ?, updated_at = ?
      WHERE setting_key = ?
    `;

    await queryDb(query, [
      setting_value || null,
      updated_at || new Date(),
      setting_key,
    ]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "System setting updated successfully.")
      );
  } catch (err) {
    next(err);
  }
};

exports.deleteSystemSetting = async (req, res, next) => {
  try {
    const { setting_key } = req.body;
    if (!setting_key) {
      return res
        .status(201)
        .json(returnResponse(false, true, "setting_key is required."));
    }

    const query = `DELETE FROM sn_system_setting WHERE setting_key = ?`;
    await queryDb(query, [setting_key]);

    return res
      .status(200)
      .json(
        returnResponse(true, false, "System setting deleted successfully.")
      );
  } catch (err) {
    next(err);
  }
};
// Get all logs
exports.getAllAuditLogs = async (req, res, next) => {
  try {
    const query = "SELECT * FROM sn_auditLog";
    const result = await queryDb(query);
    return res
      .status(200)
      .json(returnResponse(true, false, "All logs fetched.", result));
  } catch (e) {
    next(e);
  }
};

// Get logs by userId
exports.getLogsByUserId = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const query = "SELECT * FROM sn_auditLog WHERE userId = ?";
    const result = await queryDb(query, [userId]);
    return res
      .status(200)
      .json(returnResponse(true, false, "User logs fetched.", result));
  } catch (e) {
    next(e);
  }
};

// Delete a log
exports.deleteAuditLog = async (req, res, next) => {
  try {
    const { logId } = req.body;
    const query = "DELETE FROM sn_auditLog WHERE logId = ?";
    const result = await queryDb(query, [logId]);
    return res
      .status(200)
      .json(returnResponse(true, false, "Log deleted.", result));
  } catch (e) {
    next(e);
  }
};

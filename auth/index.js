const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { returnResponse } = require("../helper/helperResponse");
const { queryDb } = require("../helper/utilityHelper");

exports.superAdminLogin = async (req, res, next) => {
  try {
    const { su_email, su_pass } = req.body;
    if (!su_email || !su_pass) {
      return res
        .status(400)
        .json(returnResponse(false, true, "Email and password are required."));
    }

    // Get super admin user by email
    const query = `SELECT * FROM sn_super_admin WHERE su_email = ? LIMIT 1`;
    const users = await queryDb(query, [su_email]);

    if (users.length === 0) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Invalid email or password."));
    }

    const user = users[0];

    // Compare password (assuming su_pass is hashed)
    const passwordMatch = await bcrypt.compare(su_pass, user.su_pass);
    if (!passwordMatch) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Invalid email or password."));
    }

    // Prepare payload for JWT token
    const payload = {
      userId: user.super_id,
      su_name: user.su_name,
      su_email: user.su_email,
      role: "superuser",
    };

    // Sign JWT token
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "8h", // adjust as needed
    });

    // Return success with token
    return res
      .status(200)
      .json(returnResponse(true, false, "Login successful.", { token }));
  } catch (err) {
    next(err);
  }
};
exports.loginUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json(
          returnResponse(false, true, "Username and password are required.")
        );
    }

    // Get user from DB
    const query = `SELECT * FROM sn_user AS u WHERE u.username = ?`;
    const results = await queryDb(query, [username]);

    if (results.length === 0) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Invalid username or password."));
    }

    const user = results?.[0];

    // Compare password (assuming stored password is hashed)
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res
        .status(201)
        .json(returnResponse(false, true, "Invalid username or password."));
    }

    // Create JWT payload
    const tokenPayload = {
      user_id: user.userId,
      role_id: user.roleId,
      store_id: user.store_id,
    };

    // Generate JWT token
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Response with token and user info
    return res.status(200).json(
      returnResponse(true, false, "Login successful.", {
        token,
      })
    );
  } catch (err) {
    next(err);
  }
};

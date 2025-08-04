require("dotenv").config();
const jwt = require("jsonwebtoken");
const { queryDb } = require("../helper/utilityHelper");

exports.generalAuthCheck = (req, res, next) => {
  // Get token from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, error: "Authorization header is missing." });
  }
  const [bearer, token] = authHeader.split(" ");
  if (bearer !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      error: 'Invalid Authorization format. Must be "Bearer <token>".',
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.user_id; // Attach the user ID to the request object
    req.roleId = decoded.role_id;
    req.storeId = decoded.store_id;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: err?.message || "Invalid or expired token.",
    });
  }
};
exports.userAuthCheck = (req, res, next) => {
  // Get token from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, error: "Authorization header is missing." });
  }
  const [bearer, token] = authHeader.split(" ");
  if (bearer !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      error: 'Invalid Authorization format. Must be "Bearer <token>".',
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.user_id; // Attach the user ID to the request object
    req.roleId = decoded.role_id;
    req.storeId = decoded.store_id;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: err?.message || "Invalid or expired token.",
    });
  }
};
exports.superUserAuthCheck = (req, res, next) => {
  // Get token from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, error: "Authorization header is missing." });
  }
  const [bearer, token] = authHeader.split(" ");
  if (bearer !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      error: 'Invalid Authorization format. Must be "Bearer <token>".',
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.role = decoded.role; // Attach the user ID to the request object
    req.userId = decoded.userId;
    if (req.role !== "superuser") {
      return res
        .status(403)
        .json(
          returnResponse(
            false,
            true,
            "You do not have permission to access this resource."
          )
        );
    }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: err?.message || "Invalid or expired token.",
    });
  }
};
exports.checkPermission = async (userId, permissionName) => {
  const query = `
    SELECT COUNT(*) AS count
    FROM sn_user u
    JOIN sn_role r ON u.roleId = r.roleId
    JOIN sn_role_permission rp ON r.roleId = rp.roleId
    JOIN sn_permission p ON rp.permissionId = p.permissionId
    WHERE u.userId = ? AND p.permissionName = ?
  `;
  const result = await queryDb(query, [userId, permissionName]);
  return result[0].count > 0;
};

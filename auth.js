/*const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const config = require("./config");
const { User } = require("./src/models/userModel");

exports.protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      //res.redirect('/login');
      return res.status(401).json({ message: "not authorized" });
    }
    const decoded = await promisify(jwt.verify)(token, config.ACCESS_JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    req.user = user;
  } catch (err) {
    return res.status(401).json({ error: err });
  }
  next();
};*/
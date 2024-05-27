
module.exports = (err, req, res, next) => {
  if (err.name === "UnauthorizedError") return res.send({})
  next(err);
}
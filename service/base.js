

class BaseServer {

  constructor(){}

  static success(res, data, code = 200, msg = "success") {
    res.body = JSON.stringify({code: code, msg: res.__(msg), data: data || ""});
    res.json({code: code, msg: res.__(msg), data: data || ""})
  }

  static failure(res, code = 500, msg = "failure") {
    res.body = JSON.stringify({code: code, msg: res.__(msg)});
    res.json({code: code, msg: res.__(msg)})
  }

}

module.exports = BaseServer;
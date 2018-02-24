const gpg = require('gpg')

function getSignature (data) {
  return new Promise ((resolve, reject) => {
    try {
      gpg.clearsign(data, out => {
        resolve(out)
      })
    }
    catch(err) {
      reject(err)
    }
  })
}

function gpgSign (opts) {
	let default_opts = {
    cb: undefined,
		override: true
	}
  opts = opts || {}
  opts = Object.assign(opts, default_opts)
  cb = opts.cb

  function signPage (req, res, next) {
    function sendSig (cb) {
      if (typeof cb === 'undefined') {
        return function (err, html) {
          if (err) return next(err)
          getSignature(res.body)
            .then(out => {
              html = out
              res.body = html
              res.send()
            })
        }
      } else {
        return function (err, html) {
          if (html) {
            getSignature(res.body)
              .then(out => {
                html = out
              })
          }
          cb(err, html)
        }
      }
    }

    res.gpgSigned = function (cb) {
      this.send(sendSig(cb))
    }

    if (opts.override) {
      res.oldSend = res.send
      res.send = function (cb) {
        this.oldSend(sendSig(cb))
      }
    } else {
      return next()
    }
  }

  return signPage
}

module.exports = gpgSign

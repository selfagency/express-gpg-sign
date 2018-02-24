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
  const defaults = {
    callback: undefined,
    override: true
  }
  opts = opts || {}
  opts = Object.assign(opts, defaults)
  const { callback, override } = opts
  
  // console.log('gpgsign')
  // console.log(override)

  function sendSig (content, callback) {
    // console.log('sendsig')
    if (typeof callback === 'undefined') {
      return function (err, html) {
        if (err) return next(err)
        getSignature(content)
          .then(out => {
            html = out
            res.send(html)
          })
          .catch(err => {
            return next(err)
          })
      }
    } else {
      return function (err, html) {
        if (html) {
          getSignature(content)
            .then(out => {
              html = out
            })
        }
        callback(err, html)
      }
    }
  }

  function signPage (req, res, next) {
    const content = res.body
    // console.log('signpage')

    if (override === true) {
      res.oldRenderMethod = res.render
      res.render = function (view, renderOpts, callback) {
        this.oldRenderMethod(view, renderOpts, sendSig(content, callback))
      }
    } else {
      res.gpgSigned = function (view, renderOpts, callback) {
        this.render(view, renderOpts, sendSig(content, callback))
      }
    }
    return next()
  }

  return signPage
}

module.exports = gpgSign

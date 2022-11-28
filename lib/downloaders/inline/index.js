const debug = require('debug')('patbrid:downloaders:aria2')
const fs = require('fs')
const request = require('request')
// const { URL } = require('url')
// const http = require('http')

class inlinedownloader {
  constructor (path) {
    debug('ctor')
    this.path = path
    this.download = this._download.bind(this)
    this.status = this._status.bind(this)
    this.total = 0
    this.received = 0
    this.success = false
  }

  downloadFile (fileUrl) {
    let fileName = ''

    const req = request({
      method: 'GET',
      uri: fileUrl
    })

    req.on('response', data => {
      console.log(data.headers)
      this.total = parseInt(data.headers['content-length'])

      const contentDisposition = data.headers['content-disposition']
      const startIndex = contentDisposition.indexOf('filename=') + 10
      const endIndex = contentDisposition.length - 1
      fileName = contentDisposition.substring(startIndex, endIndex)
      console.log('filename: ' + fileName)

      const out = fs.createWriteStream(this.path + '/' + fileName)
      req.pipe(out)
    })

    req.on('data', chunk => {
      this.received += chunk.length
    })

    req.on('end', () => {
      console.log(this.path + '/' + fileName + ' downloaded')
    })
  }

  _download (links, aria2info) {
    debug('_download', links)

    const promises = links.map(link => new Promise((resolve, reject) => {
      let fileName = ''

      const req = request({
        method: 'GET',
        uri: link
      })

      req.on('response', data => {
        console.log(data.headers)
        this.total = parseInt(data.headers['content-length'])

        const contentDisposition = data.headers['content-disposition']
        const startIndex = contentDisposition.indexOf('filename=') + 10
        const endIndex = contentDisposition.length - 1
        fileName = contentDisposition.substring(startIndex, endIndex)
        console.log('filename: ' + fileName)

        const out = fs.createWriteStream(this.path + '/' + fileName)
        req.pipe(out)
      })

      req.on('data', chunk => {
        this.received += chunk.length
      })
      req.on('error', function (e) {
        reject(e)
      })

      req.on('timeout', function () {
        console.log('timeout')
        req.abort()
      })
      req.on('end', () => {
        console.log(this.path + '/' + fileName + ' downloaded')
        resolve('done')
      })
    }))

    return Promise.all(promises)
  }

  _status (aria2info) {
    aria2info.total = this.total
    aria2info.received = this.received
  }
}

module.exports = inlinedownloader

const chokidar = require('chokidar')
const DebridLinkWatcher = require('./lib/watchers/debrid-link')
const InlineDownloader = require('./lib/downloaders/inline')
const fs = require('fs')

const {
  DEBRID_LINK_API_KEY,
  DOWNLOAD_DIR = '/download',
  WATCH_DIR = '/watch',
  WATCH_RATE = 5000
} = process.env

if (!DEBRID_LINK_API_KEY) {
  console.log('[!] DEBRID_LINK_API_KEY env var is not set')

  process.exit(-1)
}

// Create a downloader instance
const downloader = new InlineDownloader(DOWNLOAD_DIR)

// Create a watcher instance
const watcher = new DebridLinkWatcher(DEBRID_LINK_API_KEY, downloader.download, downloader.status)

// Watch for new torrent files
console.log(`[+] Watching '${WATCH_DIR}' for new torrents`)

chokidar
  .watch(`${WATCH_DIR}`, {
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: true,
    ignored: '(?<![^/])\\.',
    depth: 99
  })
  .on('add', path => {
    if (path.indexOf('/.') !== -1 || path.indexOf('.queued') !== -1) {
      console.log(`Ignoring '${path}' because it is a work file`)
    } else if (path.indexOf('.torrent') !== -1) {
      watcher.addTorrent(path)
    } else if (path.indexOf('.magnet') !== -1) {
      watcher.addMagnet(path)
    } else {
      console.log(`Ignoring '${path}' because it has an unknown extension`)
    }
  })

// Check the torrent watch list every "WATCH_RATE" ms
setInterval(() => watcher.checkWatchList(), WATCH_RATE)
// */

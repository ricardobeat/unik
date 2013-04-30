var cluster = require('cluster')
  , ids     = []
  , worker  = cluster.worker
  , unik    = require('../').create({ unique: worker.workerID })

var burst = +process.argv[3] || 60

function generateID (){
    while (ids.length < burst) {
        ids.push(unik.bigflake())
    }
    send(ids)
    ids = []
    setImmediate(generateID)
}

generateID()

function send (ids) {
    var mem = Math.floor(process.memoryUsage().rss / 1024 / 1024)
    worker.send([ids, mem])
}

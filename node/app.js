const net = require('net')
const stream = require('stream')
const debug = require('debug')('server')
const express = require('express')

const app = express()
const NODE_PORT = 3000
const LOCALHOST = '127.0.0.1'
const SOCKET_PORT = 9999

var GENERATION_REQUESTER = { 'action': 'generation' }

app.get('/', (req, res) => {
    // show its working
    res.status(206).end();
})

app.get('/api/music/ai', (req, res) => {
    var client = new net.Socket()
    client.connect(SOCKET_PORT, LOCALHOST, function () {
        console.log(`[INFO] Connected to ${LOCALHOST}:${SOCKET_PORT}`)
        // request new song by sending empty string
        client.write(JSON.stringify(GENERATION_REQUESTER))
    })
    var buff = []
    var buff_size = 0
    var receivedChunks = 0
    client.on('data', function (data) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'audio/wav');
        // first chunck informs the buffer size
        var is_first_chunk = buff.length === 0 && buff_size === 0
        if (is_first_chunk) {
            let jsonObj = JSON.parse(data)
            buff_size = jsonObj.bufferSize
            debug(`Requested buffer of size: ${buff_size}`)
        } else {
            debug(`Chunk received. Size: ${data.length}`)
            receivedChunks = receivedChunks + data.length
            buff.push(data)
            if (receivedChunks === buff_size) {
                let b = Buffer.concat(buff)
                debug(`Buffer of size ${b.length} allocated.`)
                var buffStream = stream.PassThrough()
                buffStream.end(b)
                // stream buffer bytes to response
                buffStream.pipe(res)
            }
        }
    })
})


// todo: receive speed via socket/stream 
app.get('/speed', (req, res) => {
    res.status(404).end('Endpoint not available')
})

app.listen(NODE_PORT, () => console.log(`[INFO] Listening to port ${NODE_PORT}`))



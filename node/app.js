const net = require('net')
const stream = require('stream')
const debug = require('debug')('server')
const express = require('express')

const app = express()
const NODE_PORT = 3000
// socket constants
const LOCALHOST = '127.0.0.1'
const SOCKET_PORT = 9999

// object to inform the python server to generate a new song
var SONG_REQUEST_CHUNCK = JSON.stringify({ 'action': 'generation' })

var socket_setup_events = function (socket) {
    socket.on('connect', function () {
        debug(`Connection established to ${LOCALHOST}:${SOCKET_PORT}`)
    })
    socket.on('ready', function () {
        debug(`Socket ready to be used.`)
    })
    socket.on('close', function () {
        debug('Connection closed')
    })
    socket.on('end', function () {
        debug('Connection ended by the other party')
    })
    socket.on('error', function (error) {
        debug(`An error occurred. \n ${error}`)
    })
}

var socket_connect = function (callback) {
    let socket = net.createConnection(SOCKET_PORT, LOCALHOST, callback)
    socket_setup_events(socket)
    return socket
}

var send_chunk = function (socket, chunk, callback = undefined) {
    socket.write(chunk)
    debug('Sending chunk...')
    if (callback !== undefined) {
        callback()
    }
}

app.get('/', (req, res) => {
    // show its working
    res.status(206).end();
})

app.get('/api/music/ai', (req, res) => {

    let socket = socket_connect()
    var buff = []
    var buff_size = 0
    var receivedChunks = 0
    // register an event that retransmits data
    // to response when data is received 
    socket.on('data', function (data) {
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
                // streams all buffer bytes to response
                buffStream.pipe(res)
            }
        }
    })

    socket.on('ready', function () {
        let chunk = JSON.stringify({
            'action': 'generation',
        })
        send_chunk(socket, chunk, function () {
            debug('Song requester chunk sent successfully.')
        })
    })
})


app.get('/api/music/ai/speed', (req, res) => {
    var query = req.query['val']
    if (query !== undefined) {
        var socket = socket_connect()
        socket.on('ready', function () {
            chunk = JSON.stringify({
                'speed': query
            })
            send_chunk(socket, chunk, function () {
                debug('Speed chunk sent successfully.')
                res.status(200).end()
            })
        })
    } else {
        res.status(400).end('must contain a \'val\' query parameter')
    }
})

app.listen(NODE_PORT, () => console.log(`[INFO] Listening to port ${NODE_PORT}`))


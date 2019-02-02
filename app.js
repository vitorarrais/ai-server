const express = require('express')
const app = express()
const port = 3000
var fs = require('fs')
var { spawn } = require('child_process')
const net = require('net')
const wav = require('wav')
const stream = require('stream')

const basePath = '/tmp/'


const BUNDLE_PATH = '/Users/vitorarrais/Projects/Repositories/magenta/magenta/models/performance_rnn/multiconditioned_performance_with_dynamics.mag'
const CONFIG = 'multiconditioned_performance_with_dynamics'



app.get('/', (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'audio/wav');
    // in order to serve wav files continuosly 
    // we need to pipe the AI python script pro-
    // cess directly to the response. This python 
    // script keeps infinitely streaming wav files  
    // back.
    // Another and more elegant solution
    // is to open a TCP socket with the python
    // script that streams back wav files and
    // then we pipe the socket to the response.
    // fs.createReadStream(midiFile).pipe(res);
})

app.get('/socket', (req, res) => {
    var host = '127.0.0.1';
    var port = '9999'
    var client = new net.Socket()
    client.connect(port, host, function () {
        console.log(`connected to ${host}:${port}\n`)
        client.write('play')
    })
    var buff = []
    var buff_size = 0
    var totalsize = 0
    client.on('data', function (data) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'audio/wav');
        var is_first_chunk = buff.length === 0 && buff_size === 0
        if (is_first_chunk) {
            let jsonObj = JSON.parse(data)
            buff_size = jsonObj.bufferSize
            console.log(`buff_size: ${buff_size} \n`)
        } else {
            console.log(`Chunk received. Size: ${data.length} \n`)
            totalsize = totalsize + data.length
            buff.push(data)
            if (totalsize === buff_size) {
                let b = Buffer.concat(buff)
                console.log(`Buffersize: ${b.length}`)
                var buffStream = stream.PassThrough()
                buffStream.end(b)
                buffStream.pipe(res)
                // var fileWriter = wav.FileWriter('/tmp/tmp01.wav', {
                //     "channels": 1,
                //     "sampleRate": 44100,
                //     "bitDepth": 16
                // })
                // fileWriter.write(b)
                // fileWriter.end()
            }
            // console.log(`Buffsize: ${buff.length}`)
        }
        // console.log(`Receiving data...\n ${data}`)
        // var reader = new wav.Reader();
        // reader.on('format', function (format) {
        //     console.log(format)
        // })
        // res.statusCode = 200;
        // res.setHeader('Content-Type', 'audio/wav');
        // fs.createReadStream(data).pipe(res)
    })
    // client.connect(port, host, socketConnectionCallback(port, host, client))
    // client.on('data', handleSocketServerData(data, client, res))
    // client.on('close')
})

// var handleSocketServerData = function (data, client) {
//     console.log(`Received: ${data}\n`)
//     client.destroy()
//     res.writeHead(200)
//     res.end('{ success: true}')

// }

// var socketConnectionCallback = function (port, host, client) {
//     console.log(`CONNECTED TO: ${host}:${port}\n`)
//     client.write('hello world')
// }

// todo: receive speed via socket/stream 
app.get('/speed', (req, res) => {
    console.log(`[INFO] GET /speed`)
    var speed = req.query['val']
    newSequence(speed, function () {
        res.writeHead(200)
        res.end(`{success: true}`)
    })
})

// put a new file in the queue
app.post('/add/:filename', (req, res) => {
    // todo: validate param
    // queue.push(req.param.filename)
    console.log(`[INFO] GET /add/${req.query}`)
})

app.listen(port, () => console.log(`[INFO] Listening to port ${port}`))

var newSequence = function (speed, callback) {
    const params = `gen --config=${CONFIG} \
    --bundle_file=${BUNDLE_PATH} \
    --output_dir=/tmp/performance_rnn/generated \
    --num_outputs=1 --num_steps=300 \
    --primer_melody='[60,62,64,65,67,69,71,72]'`

    var cmd = `source ~/.zshrc; source activate magenta; ${params}`
    // var cmd = `source ~/.zshrc; source activate magenta; ./generate.sh`


    // const gen_process = spawn(cmd, {
    //     stdio: 'inherit',
    //     shell: true,
    //     cwd: '/Users/vitorarrais/Projects/Repositories/magenta/magenta/models/performance_rnn/'
    // })

    const gen_process = spawn(cmd, {
        stdio: 'inherit',
        shell: true,
        cwd: '/Users/vitorarrais/Projects/Repositories/magenta/magenta/models/performance_rnn/'
    })
    // gen_process.stdout.on('data', (data) => {
    //     console.log(`Wav filename: ${data}`);
    // });

    callback()
}


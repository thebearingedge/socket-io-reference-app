const path = require('path')
const http = require('http')
const express = require('express')
const { Server: SocketIO } = require('socket.io')
const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator')

const rooms = new Map([
  ['general', []],
  ['anime', []],
  ['programming', []],
  ['weightlifting', []],
])

const app = express()
const server = http.createServer(app)

app.use(express.static(path.join(__dirname, 'public')))

app.get('/api/rooms', (req, res) => {
  res.json(Array.from(rooms).map(([room]) => room))
})

app.post('/api/messages', express.json(), (req, res) => {
  const { from, to, message } = req.body
  const when = new Date()
  rooms.get(to)?.push({ from, message, when })
  io.to(to).emit('message', { from, to, message, when })
})

const io = new SocketIO(server)

io.on('connection', socket => {
  const { room = 'general' } = socket.handshake.query
  const username = uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    style: 'lowercase'
  })
  const messages = rooms.get(room) ?? []
  rooms.set(room, messages)
  socket.join(room)
  socket.emit('joined', { username, room, messages })

  socket.on('join', room => {
    socket.rooms.forEach(room => socket.leave(room))
    const messages = rooms.get(room) ?? []
    rooms.set(room, messages)
    socket.join(room)
    socket.emit('joined', { username, room, messages })
  })
})

server.listen(3000, () => {
  console.log('server listening on port 3000')
})

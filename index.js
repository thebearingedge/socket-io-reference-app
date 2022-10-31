const path = require('path')
const http = require('http')
const express = require('express')
const { Server: SocketIO,  } = require('socket.io')

const app = express()
const server = http.createServer(app)

app.use(express.static(path.join(__dirname, 'public')))

const rooms = new Map([
  ['general', []],
  ['anime', []],
  ['programming', []],
  ['weightlifting', []],
])

app.get('/api/rooms', (req, res) => {
  res.json(Array.from(rooms).map(([room]) => room))
})

app.post('/api/messages', express.json(), (req, res) => {
  const { from, to, message } = req.body
  const now = new Date()
  const payload = { from, message, when: now }
  rooms.get(to)?.push(payload)
  io.to(to).emit('message', payload)
})

app.get('/api/messages', (req, res) => [
  res.json(rooms.get(req.query.room) ?? [])
])

const io = new SocketIO(server)

io.on('connection', socket => {
  const { room } = socket.handshake.query
  if (!room) {
    socket.disconnect()
    return
  }
  rooms.set(room, rooms.get(room) ?? [])
  socket.join(room)
})

server.listen(3000, () => {
  console.log('server listening on port 3000')
})

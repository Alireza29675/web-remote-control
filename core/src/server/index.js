const Socket = require('socket.io');

class SocketServer {

    constructor (server) {
        this.io = Socket(server || 3001, {
            path: '/remote',
            serveClient: false
        })
        this.io.on('connection', (socket) => {
            socket.on('register', this.onRegister.bind(this))
            socket.on('signal', this.onSignal.bind(this))
        })
    }

    onSignal (signal) {
        this.io.to(to).emit('signal', signal)
    }

    onRegister () {

    }

}

export default {}
import { Server } from "http";
import io from 'socket.io'

class SocketServer {

    private io: io.Server
    
    constructor (server?: Server) {
        this.io = io(server || 3001, { path: '/remote', serveClient: false })
        this.io.on('connection', this.connected.bind(this))
    }

    private connected (socket: io.Socket) {
        console.log(socket.id)
    }

}

export default SocketServer
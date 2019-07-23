import { Server } from "http";
import io from 'socket.io';

class SocketServer {

    private io: io.Server
    
    constructor (port: number = 3001) {
        this.io = io.listen(port)
        this.io.on('connection', this.connected.bind(this));
    }

    private connected (socket: io.Socket) {
        socket.emit('message', { data: socket.id })
    }

}

export default SocketServer
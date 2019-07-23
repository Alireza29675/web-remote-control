import { Server } from "http";
import io from 'socket.io';

class SocketServer {

    private io: io.Server
    
    constructor (port: number = 3001) {
        this.io = io.listen(port)
        this.sockets.on('connection', function(socket){  
            console.log('a user connected');  
            socket.on('disconnect', function(){
               console.log('user disconnected'); 
            });
        });
    }

    private get sockets () {
        return this.io.sockets
    }

    private connected (socket: io.Socket) {
        console.log(socket.id)
    }

}

export default SocketServer
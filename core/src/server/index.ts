import md5 from 'md5';
import io from 'socket.io';
import createHashGenerator from '../shared/createHashGenerator'

import { Server } from "http";

enum SOCKET_TYPES {
    EMITTER,
    RECEIVER
}
type HashType = string

const KILL_TIMEOUT = 60 * 1000

// TODO: Must warn if localStorage is going to replace connection after same tab opened
// TODO: New opened tab must be looking for a chance to connect instead of the other

class WRCServer {

    private salt = Math.random().toString(36).substr(2, 10)
    private generator: IterableIterator<HashType> = createHashGenerator(this.salt)

    private io: io.Server
    private sockets: Map<HashType, io.Socket> = new Map<HashType, io.Socket>()
    private killTimeouts: Map<HashType, NodeJS.Timeout> = new Map<HashType, NodeJS.Timeout>()
    
    constructor (port: number = 3001) {
        this.io = io.listen(port)
        this.io.on('connection', this.connected.bind(this))
    }

    /**
     * Public Method
     */

    public getSocket (hash: HashType) {
        return this.sockets.get(hash)
    }

    /**
     * Private methods
     */

    private generateHash (): HashType {
        return this.generator.next().value
    }

    private connected (socket: io.Socket) {
        const hash = { value: this.generateHash() }
        this.sockets.set(hash.value, socket)
        socket.on('disconnect', this.disconnected.bind(this, hash))
        // Socket registration
        socket.emit('register', { hash })
        socket.on('im-alive', (data) => this.recover(data, socket, hash))
    }

    private disconnected (hash: { value: HashType }) {
        const timeout = setTimeout(() => {
            this.killTimeouts.delete(hash.value)
            this.sockets.delete(hash.value)
        }, KILL_TIMEOUT)
        this.killTimeouts.set(hash.value, timeout)
    }

    private recover (data: {hash: HashType, lastSocketID: string}, socket: io.Socket, hash: { value: HashType }) {
        const previousSocket = this.sockets.get(data.hash);
        const previousSocketId = previousSocket ? md5(previousSocket.id) : null;
        
        if (previousSocketId) {
            if (previousSocketId === data.lastSocketID) {
                this.sockets.delete(hash.value)
                this.sockets.set(data.hash, socket)
                hash.value = data.hash
                // Removing from killing timeouts
                const killingTimeout = this.killTimeouts.get(data.hash)
                if (killingTimeout) {
                    clearTimeout(killingTimeout)
                    this.killTimeouts.delete(data.hash)
                }
            } else {
                // It's a cheat or something
            }
        } else {
            this.sockets.delete(hash.value)
            this.sockets.set(data.hash, socket)
            hash.value = data.hash
        }
    }

}

export default WRCServer
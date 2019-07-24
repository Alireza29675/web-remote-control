import { Server } from "http";
import io from 'socket.io';
import createHashGenerator from '../shared/createHashGenerator'

enum SOCKET_TYPES {
    EMITTER,
    RECEIVER
}

type HashType = number

class SocketServer {

    private salt = Math.random().toString(36).substr(2, 10)
    private generator: IterableIterator<HashType> = createHashGenerator(this.salt)

    private io: io.Server
    private emitterNS: io.Namespace
    private receiverNS: io.Namespace

    private emitters: Map<HashType, io.Socket> = new Map<HashType, io.Socket>()
    private receivers: Map<HashType, io.Socket> = new Map<HashType, io.Socket>()
    
    constructor (port: number = 3001) {
        this.io = io.listen(port)
        this.emitterNS = this.io.of('/emitter')
        this.receiverNS = this.io.of('/receiver')
        // setting on connection
        this.emitterNS.on('connection', this.onEmitterConnected.bind(this))
        this.receiverNS.on('connection', this.onReceiverConnected.bind(this))
    }

    /**
     * 
     */

    public getEmitter (hash: HashType) {
        return this.emitters.get(hash)
    }
    public getReceiver (hash: HashType) {
        return this.receivers.get(hash)
    }
    public getSocket (hash: HashType) {
        return this.getEmitter(hash) || this.getReceiver(hash)
    }
    public getSocketType (hash: HashType) {
        if (this.emitters.has(hash)) {
            return SOCKET_TYPES.EMITTER;
        }
        if (this.receivers.has(hash)) {
            return SOCKET_TYPES.RECEIVER;
        }
        return false;
    }

    /**
     * Hash generator
     */

    private generateHash (): HashType {
        return this.generator.next().value
    }

    /**
     * Emitter Listeners
     */

    private onEmitterConnected (socket: io.Socket) {
        const hash = this.generateHash()
        this.emitters.set(hash, socket)
        socket.on('disconnect', this.onEmitterDisconnected.bind(this, hash))
        // Socket registration
        socket.emit('register', { hash })
        console.log(this.emitters)
    }
    private onEmitterDisconnected (hash: HashType) {
        this.emitters.delete(hash)
        console.log(this.emitters)
    }

    /**
     * Receiver Listeners
     */
    private onReceiverConnected (socket: io.Socket) {
        const hash = this.generateHash()
        this.receivers.set(hash, socket)
        socket.on('disconnect', this.onReceiverDisconnected.bind(this, hash))
        // Socket registration
        socket.emit('register', { hash })
        console.log(this.receivers)
    }
    private onReceiverDisconnected (hash: HashType) {
        this.receivers.delete(hash)
        console.log(this.receivers)
    }

}

export default SocketServer
import { Server } from "http";
import io from 'socket.io';

// Probably quick hash is not a good library to use
import farmHash from 'farmhash'

class SocketServer {

    // Generates a random hash seed each time
    private seed: number = Math.floor(Math.random() * 10000)

    private io: io.Server
    private emitterNS: io.Namespace
    private receiverNS: io.Namespace

    private emitters: Map<string, io.Socket> = new Map<string, io.Socket>()
    private receivers: Map<string, io.Socket> = new Map<string, io.Socket>()
    
    constructor (port: number = 3001) {
        this.io = io.listen(port)
        this.emitterNS = this.io.of('/emitter')
        this.receiverNS = this.io.of('/receiver')
        // setting on connection
        this.emitterNS.on('connection', this.onEmitterConnected.bind(this))
        this.receiverNS.on('connection', this.onReceiverConnected.bind(this))
    }

    /**
     * Hash/Socket Mapping
     */

    public getHash (socketOrId: string | io.Socket) {
        const id = (typeof socketOrId === 'string') ? socketOrId : socketOrId.id
        return farmHash.hash32WithSeed(id, this.seed)
    }
    public getEmitter (hash: string) {
        return this.emitters.get(hash)
    }
    public getReceiver (hash: string) {
        return this.receivers.get(hash)
    }
    public getSocket (hash: string) {
        return this.getEmitter(hash) || this.getReceiver(hash)
    }

    /**
     * Emitter Listeners
     */

    private onEmitterConnected (socket: io.Socket) {
        console.log('new emitter')
        this.emitters.set(this.getHash(socket), socket)
        socket.on('disconnect', this.onEmitterDisconnected.bind(this, socket))
    }
    private onEmitterDisconnected (socket: io.Socket) {
        console.log('emitter left')
        this.emitters.delete(this.getHash(socket))
    }

    /**
     * Receiver Listeners
     */
    private onReceiverConnected (socket: io.Socket) {
        console.log('new receiver')
        this.receivers.set(this.getHash(socket), socket)
        socket.on('disconnect', this.onReceiverDisconnected.bind(this, socket))
    }
    private onReceiverDisconnected (socket: io.Socket) {
        console.log('receiver left')
        this.receivers.delete(this.getHash(socket))
    }

}

export default SocketServer
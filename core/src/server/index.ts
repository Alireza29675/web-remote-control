import md5 from 'md5';
import io from 'socket.io';
import createHashGenerator from '../shared/createHashGenerator'

import { Server } from "http";

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
    
    private pairs: Map<HashType, HashType> = new Map<HashType, HashType>()
    private pairsMirror: Map<HashType, HashType> = new Map<HashType, HashType>()

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
        socket.on('pair-request', (data: {toHash: HashType}) => this.pairRequest(data.toHash, hash.value))
        socket.on('un-pair-request', () => this.unPairRequest(hash.value))
    }

    private pair (hash: HashType, toHash: HashType) {
        if (this.isBusy(hash) || this.isBusy(toHash)) {
            return false;
        }
        this.pairs.set(hash, toHash);
        this.pairs.set(toHash, hash);
        return true;
    }
    private unPair (hash: HashType) {
        const pair = this.getPair(hash)
        this.pairs.delete(hash)
        if (pair) {
            this.pairsMirror.delete(pair)
        }
    }
    private isBusy (hash: HashType) {
        return this.pairs.has(hash) || this.pairsMirror.has(hash)
    }
    private getPair (hash: HashType): HashType | undefined {
        return this.pairs.get(hash) || this.pairsMirror.get(hash)
    }
    private arePaired (hash: HashType, anotherHash: HashType) {
        return ((this.isBusy(hash) && this.isBusy(anotherHash)) && this.getPair(hash) === anotherHash && this.getPair(anotherHash) === hash)
    }

    private pairRequest (toHash: HashType, hash: HashType) {
        const socket = this.getSocket(hash)
        if (!socket) {
            return false;
        }
        if (this.isBusy(toHash)) {
            socket.emit('pair-request', { done: false, message: `socket is paired with another device` })
            return false;
        }
        if (this.isBusy(hash)) {
            this.unPair(hash)
            this.pair(hash, toHash)
            socket.emit('pair-request', {done: true, message: `unpaired from previous connection and paired to new one`})
        }
    }

    private unPairRequest (hash: HashType) {
        this.unPair(hash)
    }

    private disconnected (hash: { value: HashType }) {
        const timeout = setTimeout(() => {
            this.unPair(hash.value)
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
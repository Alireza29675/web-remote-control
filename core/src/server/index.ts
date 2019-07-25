import md5 from 'md5';
import io from 'socket.io';
import createHashGenerator from '../shared/createHashGenerator'

import { Server } from "http";

type HashType = string

const KILL_TIMEOUT = 60 * 1000

// TODO: Must warn if localStorage is going to replace connection after same tab opened
// TODO: New opened tab must be looking for a chance to connect instead of the other

// TODO: If server restart all pairs will be screwed
// TODO: Must write common interfaces and types between server and client (for sockets, everything)

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
        socket.emit('register', { hash: hash.value })
        socket.on('im-alive', (data) => this.recover(data, socket, hash))
        socket.on('pair-request', (data: {toHash: HashType}) => this.pairRequest(data.toHash, hash.value))
        socket.on('un-pair-request', () => this.unPairRequest(hash.value))
        socket.on('signal', (data: { action: string, data: any }) => this.emit(data.action, data.data, hash.value))
    }

    private emitToHash (hash: HashType, action: string, data: any) {
        const pairSocket = this.getSocket(hash)
        if (pairSocket) {
            pairSocket.emit('signal', { action, data })
        }
    }

    private emit (action: string, data: any, selfHash: HashType) {
        const pairHash = this.getPair(selfHash)
        if (pairHash) {
            this.emitToHash(pairHash, action, data)
        }
    }

    private pair (hash: HashType, toHash: HashType) {
        if (this.isBusy(hash) || this.isBusy(toHash)) {
            return false;
        }
        this.pairs.set(hash, toHash);
        this.pairsMirror.set(toHash, hash);
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
    private getPairSocket (hash: HashType): io.Socket | undefined {
        const pairHash = this.getPair(hash);
        if (pairHash) {
            return this.getSocket(pairHash)
        }
    }
    private arePaired (hash: HashType, anotherHash: HashType) {
        const pair = (this.getPair(hash) === anotherHash && this.getPair(anotherHash) === hash)
        return pair;
    }

    private pairRequest (toHash: HashType, hash: HashType) {
        const socket = this.getSocket(hash)
        const socketToPair = this.getSocket(toHash)
        if (!socket) {
            console.log('no socket')
            return false;
        }
        if (!socketToPair) {
            socket.emit('pair-request', {done: false, to: toHash, message: `socket not found`})
            return false;
        }
        if (this.arePaired(hash, toHash)) {
            socket.emit('pair-request', {done: true, to: toHash, message: `already paired`})
            return true;
        }
        if (this.isBusy(toHash)) {
            socket.emit('pair-request', { done: false, to: toHash, message: `socket is paired with another device` })
            socketToPair.emit('pair-request', { done: false, to: hash, message: `Tried to connect with you, however, you're busy right now` })
            return false;
        }
        if (this.isBusy(hash)) {
            this.unPair(hash)
            this.pair(hash, toHash)
            socket.emit('pair-request', {done: true, to: toHash, message: `unpaired from previous connection and paired to new one`})
            socketToPair.emit('pair-request', { done: true, to: hash, message: `connection requested and paired with you` })
            return true;
        }
        this.pair(hash, toHash)
        socket.emit('pair-request', {done: true, to: toHash, message: `paired`})
        socketToPair.emit('pair-request', { done: true, to: hash, message: `connection requested and paired with you` })
    }

    private unPairRequest (hash: HashType) {
        this.unPair(hash)
    }

    private disconnected (hash: { value: HashType }) {
        const socket = this.getPairSocket(hash.value)
        if (socket) {
            socket.emit('pair-status', { status: 'disconnected', time: Date.now() })
        }

        const timeout = setTimeout(() => {
            this.unPair(hash.value)
            this.killTimeouts.delete(hash.value)
            this.sockets.delete(hash.value)
        }, KILL_TIMEOUT)
        this.killTimeouts.set(hash.value, timeout)
    }

    private recover (data: {hash: HashType, lastSocketID: string}, socket: io.Socket, tempHash: { value: HashType }) {
        const { hash, lastSocketID } = data

        // Notify its pair that this socket is alive again
        const pairHash = this.getPair(hash)
        const pairSocket = this.getPairSocket(hash)
        if (pairSocket) {
            socket.emit('pair-request', {done: true, to: pairHash, message: `re-paired`})
            pairSocket.emit('pair-status', { status: 'connected', time: Date.now() })
        }

        const previousSocket = this.sockets.get(data.hash);
        const previousSocketId = previousSocket ? md5(previousSocket.id) : null;
        
        if (previousSocketId) {
            if (previousSocketId === lastSocketID) {
                this.sockets.delete(tempHash.value)
                this.sockets.set(data.hash, socket)
                tempHash.value = data.hash
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
            this.sockets.delete(tempHash.value)
            this.sockets.set(data.hash, socket)
            tempHash.value = data.hash
        }
    }

}

export default WRCServer
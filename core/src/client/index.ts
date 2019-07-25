import md5 from 'md5'
import io from 'socket.io-client'
import store from 'store'

// FIXME: One localStorage for all Emitter instances is a big mistake
// TODO: Methods for ask which behaves like http-server
const localStorage = store.namespace('web-remote-control_core_meta')

type SignalCB = (data?: any) => void;

class WRCClient {

    public onPair?: (hash: string) => void

    private connectionOK: boolean = true
    private pairOK: boolean = false

    private store: {
        hash?: string
        lastSocketID?: string
    }
    private socket: SocketIOClient.Socket
    private listeners: Map<string, Set<SignalCB>> = new Map<string, Set<SignalCB>>()

    private pairHash?: string

    constructor (server: string = 'ws://localhost', port: number = 3001) {
        this.socket = io(`${server}:${port}`)
        this.socket.on('message', console.log)
        this.socket.on('register', (data: { hash: string }) => this.register(data.hash))
        this.socket.on('signal', (signal: { action: string, data: any }) => this.onSignal(signal))

        this.socket.on('pair-request', this.pairRequestMessage.bind(this))
        this.socket.on('pair-status', this.pairStatusMessage.bind(this))

        this.store = {
            hash: localStorage.get('hash'),
            lastSocketID: localStorage.get('lastSocketID')
        }
    }

    public pair (toHash: string) {
        this.socket.emit('pair-request', { toHash })
    }

    public unpair () {
        this.socket.emit('un-pair-request')
    }

    public emit (action: string, data: any) {
        this.socket.emit('signal', { action, data })
    }

    public on (action: string, cb: SignalCB) {
        if (!this.listeners.has(action)) {
            const set = new Set<SignalCB>()
            set.add(cb)
            this.listeners.set(action, set)
        } else {
            const set = this.listeners.get(action)
            if (set) { set.add(cb) }
        }
    }
    
    public get hash () {
        return this.store.hash
    }

    public get isReady () {
        return this.isConnected && this.isPaired
    }

    public get isConnected () {
        return this.connectionOK
    }

    public get isPaired () {
        return this.pairOK
    }

    private onSignal (signal: { action: string, data: any }) {
        const { action, data } = signal
        const listeners = this.listeners.get(action)
        if (listeners) {
            listeners.forEach(cb => cb(data))
        }
    }

    private register (hashToRegister: string) {
        const { hash, lastSocketID } = this.store
        if (hash) {
            this.socket.emit('im-alive', { hash, lastSocketID })
        } else {
            this.store.hash = hashToRegister
            localStorage.set('hash', hashToRegister)
        }
        this.store.lastSocketID = md5(this.socket.id)
        localStorage.set('lastSocketID', this.store.lastSocketID)
    }

    private pairRequestMessage (data: { done: boolean, to: string, message: string }) {
        const { done, to, message } = data;
        if (done) {
            this.pairHash = to;
            this.pairOK = true
            if (this.onPair) { this.onPair(this.pairHash) }
            console.log(message)
        } else {
            console.error(`Couldn't connect to ${to}: ${message}`)
        }
    }

    private pairStatusMessage (data: { status: string, time: number }) {
        if (data.status === 'connected') {
            this.pairOK = true
        }
        if (data.status === 'disconnected') {
            this.pairOK = false
        }
    }

}

export default WRCClient
import md5 from 'md5'
import io from 'socket.io-client'
import store from 'store'

// TODO: Methods for ask which behaves like http-server

type SignalCB = (data?: any) => void;

interface IConfig {
    port?: number
    url?: string
}

class WRCClient {

    public onPair?: (hash: string) => void

    private _connectionConnected: boolean = false
    private _pairConnected: boolean = false

    private storage: StoreJsAPI

    private config: IConfig = {
        port: 3001,
        url: 'ws://localhost'
    }

    // TODO If there's a storage what the hell is a store?
    private store: {
        hash?: string
        lastSocketID?: string
    }
    private socket: SocketIOClient.Socket
    private listeners: Map<string, Set<SignalCB>> = new Map<string, Set<SignalCB>>()

    private pairHash?: string

    constructor (name: string, config?: IConfig) {
        if (config) { this.config = {...this.config, ...config} }
        const { port, url } = this.config
        
        this.storage = store.namespace(`wrc_core_meta_${name}`)

        this.socket = io(`${url}:${port}`)
        this.socket.on('connect', () => { this.connectionConnected = true });
        this.socket.on('disconnect', () => { this.connectionConnected = false });
        this.socket.on('message', console.log)
        this.socket.on('register', (data: { hash: string }) => this.register(data.hash))
        this.socket.on('signal', (signal: { action: string, data: any }) => this.onSignal(signal))

        this.socket.on('pair-request', this.pairRequestMessage.bind(this))
        this.socket.on('pair-status', this.pairStatusMessage.bind(this))

        this.store = {
            hash: this.storage.get('hash'),
            lastSocketID: this.storage.get('lastSocketID')
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
        return this._connectionConnected
    }

    public get isPaired () {
        return this._pairConnected
    }

    private set connectionConnected (to: boolean) {
        if (to === this.isConnected) { return; }
        if (!to) {
            this.pairConnected = false
        }
        this._connectionConnected = to;
    }
    private set pairConnected (to: boolean) {
        if (to === this.isPaired) { return; }
        this._pairConnected = to;
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
            this.storage.set('hash', hashToRegister)
        }
        this.store.lastSocketID = md5(this.socket.id)
        this.storage.set('lastSocketID', this.store.lastSocketID)
    }

    private pairRequestMessage (data: { done: boolean, to: string, message: string }) {
        const { done, to, message } = data;
        if (done) {
            this.pairHash = to;
            this.pairConnected = true
            if (this.onPair) { this.onPair(this.pairHash) }
        } else {
            console.error(`Couldn't connect to ${to}: ${message}`)
        }
    }

    private pairStatusMessage (data: { status: string, time: number }) {
        if (data.status === 'connected') {
            this.pairConnected = true
        }
        if (data.status === 'disconnected') {
            this.pairConnected = false
        }
    }

}

export default WRCClient
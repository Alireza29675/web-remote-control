import md5 from 'md5'
import io from 'socket.io-client'
import store from 'store'

// FIXME: One localStorage for all Emitter instances is a big mistake
const localStorage = store.namespace('web-remote-control_core_meta')

type SignalCB = (data?: any) => void;

class WRCClient {

    private store: {
        hash?: number
        lastSocketID?: string
    }
    private socket: SocketIOClient.Socket
    private listeners: Map<string, Set<SignalCB>> = new Map<string, Set<SignalCB>>()

    constructor (server: string = 'ws://localhost', port: number = 3001) {
        this.socket = io(`${server}:${port}`)
        this.socket.on('message', console.log)
        this.socket.on('register', (data: { hash: number }) => this.register(data.hash))
        this.socket.on('signal', (signal: { action: string, data: any }) => this.onSignal(signal))

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
            if (set) set.add(cb)
        }
    }

    // public get connected () {

    // }

    // public get paired () {

    // }

    private onSignal (signal: { action: string, data: any }) {
        const { action, data } = signal
        const listeners = this.listeners.get(action)
        if (listeners) {
            listeners.forEach(cb => cb(data))
        }
    }

    private register (hashToRegister: number) {
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

}

export default WRCClient
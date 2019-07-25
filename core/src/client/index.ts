import md5 from 'md5'
import io from 'socket.io-client'
import store from 'store'

// FIXME: One localStorage for all Emitter instances is a big mistake
const localStorage = store.namespace('web-remote-control_core_meta')

class WRCClient {

    private store: {
        hash?: number
        lastSocketID?: string
    }
    private socket: SocketIOClient.Socket

    constructor (server: string = 'ws://localhost', port: number = 3001) {
        this.socket = io(`${server}:${port}`)
        this.socket.on('message', console.log)
        this.socket.on('register', (data: { hash: number }) => this.register(data.hash))

        this.store = {
            hash: localStorage.get('hash'),
            lastSocketID: localStorage.get('lastSocketID')
        }
    }

    public pair (toHash: string) {
        this.socket.emit('pair-request', { toHash })
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
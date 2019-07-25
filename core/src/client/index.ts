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

    constructor (server: string = 'ws://localhost', port: number = 3001) {
        const socket = io(`${server}:${port}`)
        socket.on('message', console.log)
        socket.on('register', (data: { hash: number }) => this.register(data.hash, socket))
        this.store = {
            hash: localStorage.get('hash'),
            lastSocketID: localStorage.get('lastSocketID')
        }
    }

    private register (hashToRegister: number, socket: SocketIOClient.Socket) {
        const { hash, lastSocketID } = this.store
        if (hash) {
            socket.emit('im-alive', { hash, lastSocketID })
        } else {
            this.store.hash = hashToRegister
            localStorage.set('hash', hashToRegister)
        }
        this.store.lastSocketID = md5(socket.id)
        localStorage.set('lastSocketID', this.store.lastSocketID)
    }

}

export default WRCClient
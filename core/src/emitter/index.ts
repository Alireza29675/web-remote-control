import io from 'socket.io-client'

class Emitter {

    constructor (server: string = 'ws://localhost', port: number = 3001) {
        const socket = io(`${server}:${port}/emitter`)
        socket.on('message', console.log)
        socket.on('register', console.log)
    }

}

export default Emitter
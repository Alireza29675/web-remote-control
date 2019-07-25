import io from 'socket.io-client'

class Receiver {

    constructor (server: string = 'ws://localhost', port: number = 3001) {
        const socket = io(`${server}:${port}`)
        socket.on('message', console.log)
        socket.on('register', console.log)
    }

}

export default Receiver
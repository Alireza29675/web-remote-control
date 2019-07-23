import io from 'socket.io-client'

const emitter = (server: string = 'ws://localhost', port: number = 3001) => {
    const socket = io.connect(`${server}:${port}`)
    socket.on('connect', () => {
        console.log('hey im connected')
        console.log(socket.id)
    })
}

export default emitter
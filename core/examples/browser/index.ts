import Client from '../../src/client'

const client = new Client()

const $: (q: string) => HTMLElement | null = (q) => document.querySelector(q)

const selfHashElement = $('.self');
const pairHashElement = $('.paired');
const pairElement = $('.pair')
const unPairElement = $('.un-pair')

if (selfHashElement) { selfHashElement.innerHTML = client.hash + '' }
if (pairHashElement) { pairHashElement.innerHTML = '----------------------------------------------------' }

client.onPair = (hash) => {
    if (pairHashElement) { pairHashElement.innerHTML = hash; }
    console.log(client.isReady)
}

client.on('up', console.log)
const number = Math.floor(Math.random() * 5);
console.log(`I'm ${number}`)

setInterval(() => {
    client.emit('up', { data: number })
}, Math.floor(Math.random() * 2000) + 1000)

if (pairElement) {
    pairElement.addEventListener('click', () => {
        const hashToPair = prompt(`Enter connection's hash`) + ''
        client.pair(hashToPair)
    })
}

if (unPairElement) {
    unPairElement.addEventListener('click', () => {
        client.unpair()
    })
}
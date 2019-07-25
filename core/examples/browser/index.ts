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
}

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
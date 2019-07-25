import Client from '../../src/client'

const client = new Client()

const $: (q: string) => HTMLElement | null = (q) => document.querySelector(q)

const selfHashElement = $('.self');
const pairHashElement = $('.paired');
const buttonElement = $('button')

if (selfHashElement) { selfHashElement.innerHTML = client.hash + '' }
if (pairHashElement) { pairHashElement.innerHTML = '----------------------------------------------------' }

if (buttonElement) {
    buttonElement.addEventListener('click', () => {
        const el = prompt(`Enter connection's hash`)
        console.log(el)
    })
}
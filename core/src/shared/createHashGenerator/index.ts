import farmHash from 'farmhash'

function* createHashGenerator (salt: string = '') {
    const seed = Math.floor(Math.random() * 1000)
    let counter = 0;
    while (true) {
        yield farmHash.hash32WithSeed(salt + (counter++), seed)
    }
}

export default createHashGenerator
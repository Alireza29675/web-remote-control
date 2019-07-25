import md5 from 'md5'

function* createHashGenerator (salt: string = '') {
    let counter = 0;
    while (true) {
        yield md5(salt + (counter++))
    }
}

export default createHashGenerator
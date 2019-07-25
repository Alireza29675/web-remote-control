declare module 'farmhash' {
    export default {
        hash32: (value: string) => number,
        hash32WithSeed: (value: string, seed: number) => number
    }
};
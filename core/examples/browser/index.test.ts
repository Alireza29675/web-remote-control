import rewire from "rewire"
const index = rewire("./index")
const $ = index.__get__("$")
// @ponicode
describe("$", () => {
    test("0", () => {
        let callFunction: any = () => {
            $("Australian Freshwater Crocodile")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("1", () => {
        let callFunction: any = () => {
            $("Saltwater Crocodile")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("2", () => {
        let callFunction: any = () => {
            $("Dwarf Crocodile")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("3", () => {
        let callFunction: any = () => {
            $("Nile Crocodile")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("4", () => {
        let callFunction: any = () => {
            $("Spectacled Caiman")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("5", () => {
        let callFunction: any = () => {
            $("")
        }
    
        expect(callFunction).not.toThrow()
    })
})

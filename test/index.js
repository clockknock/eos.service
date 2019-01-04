let EosService = require('../src');
let eosService = new EosService({private_key: ""});

describe("test eos-service", function () {

    it('test hexAddOne', () => {
        let before = "abc";
        let after = before.hexAddOne();
        console.info(JSON.stringify(after, null, 2), "\n ");
    });

    it('test asset to amount 01', () => {
        let amount = eosService.assetToAmount("1.0000 EOS");
        console.info(JSON.stringify(amount, null, 2), "\n ");//10000
    });

    it('test asset to amount 02', () => {
        let amount = eosService.assetToAmount("1.0000 EOS", 4);
        console.info(JSON.stringify(amount, null, 2), "\n ");//10000
    });

    it('test asset to amount 03', () => {
        let amount = eosService.assetToAmount("1.0000 SYS", 6);
        console.info(JSON.stringify(amount, null, 2), "\n ");//1000000
    });

    it('test asset to Symbol', () => {
        let symbol = eosService.assetToSymbol("1.0000 EOS");
        console.info(JSON.stringify(symbol, null, 2), "\n ");//"EOS"
    });

    it('string to asset 01', () => {
       let amount=eosService.stringToAsset(10000,"EOS");
       console.info(JSON.stringify(amount, null, 2),"\n ");//"1.0000 EOS"
    });

    it('string to asset 02', () => {
       let amount=eosService.stringToAsset(3000,"EOS");
       console.info(JSON.stringify(amount, null, 2),"\n ");//"0.3000 EOS"
    });

    it('string to asset 03', () => {
       let amount=eosService.stringToAsset(10000,"SYS",6);
       console.info(JSON.stringify(amount, null, 2),"\n ");//"0.010000 SYS"
    });

});

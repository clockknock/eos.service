let EosService = require("eos-service");
let Config = require("./config");
let eosService = new EosService(Config.NET_CONFIG);

async function transferEos01() {
    let data = {
        from: "alice",
        to: "bob",
        quantity: "1.0000 EOS",
        memo: "transfer test"
    };
    let receipt = await eosService.pushAction("eosio.token", "transfer", "alice", data);
    console.info(JSON.stringify(receipt, null, 2), "\n ");
}

async function transferEos02() {
    let receipt = await eosService.transferEOS("alice", "bob", "1.0000 EOS");
    console.info(JSON.stringify(receipt, null, 2), "\n ");
}

async function transferTapos() {
    let data = {
        from: "alice",
        to: "bob",
        quantity: "1.0000 EOS",
        memo: "transfer test"
    };
    let receipt = await eosService.pushAction("eosio.token", "transfer", "alice", data);

    //sleep 500ms
    await new Promise(resolve => setTimeout(resolve, 500));

    let taposReceipt = await eosService.pushActionTapos("eosio.token", "transfer", "alice", data, receipt.processed.block_num);
    console.info(JSON.stringify(taposReceipt, null, 2), "\n ");
}

async function readTable() {
    let table=await eosService.readTable({code:"eosio.token",scope:"alice",table:"accounts"});
    console.info(JSON.stringify(table, null, 2),"\n ");
}

readTable();

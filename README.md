## EosService

Simple wrapper to [eosjs](https://github.com/EOSIO/eosjs). Make it easier to send transaction and make the function prrettier.

and some actions frequantly used.





### NodeJS Dependency



`npm install eos-service`



### Import

```js
let EosService=require("eos-service");
let NET_CONFIG = {//your net config(test net or main net)
    blockchain: 'eos',
    protocol: 'http',
    host: 'localhost',
    port: 80,
    chainId: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f',
    private_key: "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3"//the private key of the actor

};
let eosService = new EosService(NET_CONFIG);

```



### Usage

```js
let data = {
    from: "alice",
    to: "bob",
    quantity: "1.0000 EOS",
    memo: "transfer test"
};
let receipt = await eosService.pushAction("eosio.token", "transfer", "alice", data);
console.info(JSON.stringify(receipt, null, 2), "\n ");

```
more example at [here](https://github.com/clockknock/eos.service/tree/master/example)

and my other helpful repository about eos contract at [here](https://github.com/clockknock/eos-contract-wrapper), make we easier to react with eos contract

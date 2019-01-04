let {Api, JsonRpc, RpcError, Serialize} = require("eosjs");
let {dateToTimePointSec, timePointSecToDate} = Serialize;
let JsSignatureProvider = require('eosjs/dist/eosjs-jssig');
let Big = require('big.js');

const fetch = require('node-fetch');
const {TextDecoder, TextEncoder} = require('text-encoding');

/**
 * transfer string to hex and add one then back to string
 * use this to set read table's upper and lower
 *
 * example:
 * "abc"->"abd"
 * "BA"->"BB"
 *
 * @returns {string}
 */
String.prototype.hexAddOne = function () {
    let hex, i;

    let result = "";
    for (i = 0; i < this.length; i++) {
        hex = this.charCodeAt(i).toString(16);
        if (i === this.length - 1) {
            hex++;
        }
        result += ("000" + hex).slice(-4);
    }

    let j;
    let hexes = result.match(/.{1,4}/g) || [];
    let back = "";
    for (j = 0; j < hexes.length; j++) {
        back += String.fromCharCode(parseInt(hexes[j], 16));
    }

    return back
};

class EosService {

    constructor({blockchain, protocol, host, port, chainId, private_key}) {
        this.rpc = new JsonRpc(`${protocol}://${host}:${port}`, {fetch});
        if (private_key === "") {
            this.hasPrivateKey = false;
            return;
        }
        this.hasPrivateKey = true;
        const signatureProvider = new JsSignatureProvider.default([private_key]);
        this.api = new Api({
            rpc: this.rpc,
            signatureProvider,
            textDecoder: new TextDecoder,
            textEncoder: new TextEncoder
        });
    }

    /**
     *
     * @param from
     * @param to
     * @param quantity
     * the asset you want send without symbol,such as "1.5",and you will get "1.5000 EOS"
     * @param memo
     * @param permission
     * @returns {Promise<*>}
     */
    async transferEOS(from, to, quantity, memo, permission = "active") {
        let data = {from, to, quantity, memo};
        return await this.pushAction('eosio.token', "transfer", from, data, permission);
    }

    async buyRam(payer, receiver, bytes, permission = "active") {
        let data = {payer, receiver, bytes};
        return await this.pushAction("eosio", "buyrambytes", payer, data, permission);
    }

    async stackCpu(payer, receiver, stake_cpu_quantity, permission = "active") {
        let data = {
            from: payer,
            receiver: receiver,
            stake_net_quantity: '0.0000 EOS',
            stake_cpu_quantity,
            transfer: false,

        };
        return await this.pushAction("eosio", "delegatebw", payer, data, permission);
    }

    async stackNet(payer, receiver, stake_net_quantity, permission = "active") {
        let data = {
            from: payer,
            receiver: receiver,
            stake_net_quantity,
            stake_cpu_quantity: '0.0000 EOS',
            transfer: false,

        };
        return await this.pushAction("eosio", "delegatebw", payer, data, permission);
    }

    /**
     *
     * @param contractName
     * the contract you want to call
     * @param actionName
     * the action you want to call
     * @param actor
     * the action sender
     * @param data
     * parameters of the action you want pass
     * @param permission
     * default:"active"
     * @returns {Promise<receipt>}
     */
    async pushAction(contractName, actionName, actor, data, permission = "active") {
        if (!this.hasPrivateKey) {
            throw new Error("you have not pass privateKey to EosService");
        }
        return await this.api.transact({
            actions: [{
                account: contractName,
                name: actionName,
                authorization: [{
                    actor,
                    permission,
                }],
                data: data
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    }

    /**
     * just like `pushActionTapos`, but you need pass ref_block_num to make thike transaction tapos
     *
     * @param contractName
     * @param actionName
     * @param actor
     * @param data
     * @param ref_block_num
     * @param permission
     * @returns {Promise<any>}
     */
    async pushActionTapos(contractName, actionName, actor, data, ref_block_num, permission = "active") {

        let refBlock = await this.rpc.get_block(ref_block_num);

        return await this.api.transact({
            expiration: timePointSecToDate(dateToTimePointSec(refBlock.timestamp) + 30),
            ref_block_num: refBlock.block_num & 0xffff,
            ref_block_prefix: refBlock.ref_block_prefix,
            actions: [{
                account: contractName,
                name: actionName,
                authorization: [{
                    actor,
                    permission,
                }],
                data: data
            }]
        });
    }

    //============================================================================================
    //==                                                                                        ==
    //                                RPC
    //==                                                                                        ==
    //============================================================================================


    /**
     *
     * @param code
     * string
     * @param scope
     * string
     * @param table
     * string
     * @param lower_bound
     * string
     * @param upper_bound
     * string
     * @param limit
     * number
     * @param json
     * boolean
     * @param index_position
     * string
     * @param key_type
     * string
     *
     * @returns {Promise<Promise<any> | Promise<any>>}
     */
    async readTable({
                        code, scope, table, lower_bound = "", upper_bound = "", limit = 10,
                        json = true, index_position = "1", key_type = "i64"
                    }) {
        return await this.rpc.get_table_rows({
            code, scope, table, lower_bound, upper_bound, limit, json, index_position, key_type
        });
    }

    /**
     *
     * @param accountName
     * @returns {Promise<object>}
     */
    async getAccount(accountName) {
        return await this.rpc.get_account(accountName);
    }

    /**
     *
     * @param accountName
     * @returns {Promise<{account_name: *, ram_quota: (ram_quota|{type}), ram_usage: (ram_usage|{type})}>}
     */
    async getRam(accountName) {
        let account = await this.rpc.get_account(accountName);
        return {
            account_name: account.account_name,
            ram_quota: account.ram_quota,
            ram_usage: account.ram_usage
        }
    }

    /**
     *
     * @param accountName
     * @returns {Promise<{account_name: *, net_weight: (net_weight|{type}), net_limit: (net_limit|{used, available, max, used_percentage})}>}
     */
    async getNet(accountName) {
        let account = await this.rpc.get_account(accountName);
        return {
            account_name: account.account_name,
            net_weight: account.net_weight,
            net_limit: account.net_limit
        }
    }

    /**
     *
     * @param accountName
     * @returns {Promise<{account_name: *, cpu_weight: (cpu_weight|{type}), cpu_limit: (cpu_limit|{used, available, max})}>}
     */
    async getCpu(accountName) {
        let account = await this.rpc.get_account(accountName);
        return {
            account_name: account.account_name,
            cpu_weight: account.cpu_weight,
            cpu_limit: account.cpu_limit
        }
    }

    //============================================================================================
    //==                                                                                        ==
    //                                enhance
    //==                                                                                        ==
    //============================================================================================

    /**
     *
     * @param asset string like:"1.0000 EOS"
     * @param precision default: 4
     * @returns {number}
     */
    assetToAmount(asset, precision = 4) {
        let array = asset.split(" ");
        let scale = new Big(10).pow(precision);
        let amount = new Big(array[0]).times(scale);

        return parseInt(amount);
    }

    /**
     *
     * @param asset string like:"1.0000 EOS"
     * @returns {*|string}
     */
    assetToSymbol(asset) {
        let array = asset.split(" ");
        return array[1];
    }

    /**
     *
     * @param amount
     * @param symbol
     * @param precision default: 4
     *
     * example:
     * stringToAsset(10000,"EOS")//"1.0000 EOS"
     *
     * @returns {number}
     */
    stringToAsset(amount, symbol, precision = 4) {
        let scale = new Big(10).pow(precision);
        let prefix=Big(amount).div(scale);
        prefix = Number.parseFloat(prefix).toFixed(precision);

        return prefix+" "+symbol

    }
}

module.exports = EosService;

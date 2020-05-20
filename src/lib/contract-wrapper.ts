/*
    Copyright 2019-2020 eMobilify GmbH

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

import { ethers } from "ethers";
import { toHex } from "web3-utils"
import { networks } from "../networks";


export class ContractWrapper {

    private provider: ethers.providers.JsonRpcProvider
    private wallet?: ethers.Wallet
    protected contract: ethers.Contract

    /**
     * Read/write mode of contract wrapper. If signer is provided in constructor arguments,
     * mode will be read+write, else just read.
     */
    public mode: "r" | "r+w"

    constructor(type: string, environment: string, signer?: string) {
        if (!networks[environment]) {
            throw new Error(`Option \"${environment}\" not found in configured networks.`)
        }
        const provider = networks[environment].provider
        const contract = networks[environment].contracts[type]

        console.log(`connecting to ${provider.protocol}://${provider.host}:${provider.port}`)

        this.provider = new ethers.providers.JsonRpcProvider(`${provider.protocol}://${provider.host}:${provider.port}`)

        if (signer) {
            this.wallet = new ethers.Wallet(signer, this.provider)
            this.mode = "r+w"
        } else {
            this.mode = "r"
        }
    
        this.contract = new ethers.Contract(contract.address, contract.abi, this.wallet || this.provider)
    }

    protected verifyAddress(address: string): void {
        try { 
            ethers.utils.getAddress(address)
        } catch (err) {
            throw Error(`Invalid address. Expected Ethereum address, got "${address}".`)
        }
    }

    protected verifyWritable(): void {
        if (this.mode !== "r+w") {
            throw Error("No signer provided. Unable to send transaction.")
        }
    }

    protected verifyStringLen(str: string, len: number): void {
        if (str.length !== len) {
            throw Error(`Invalid string length. Wanted ${len}, got "${str}" (${str.length})`)
        }
    }

    protected toHex(str: string): string {
        return toHex(str.toUpperCase())
    }

}
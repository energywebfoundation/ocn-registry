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
import { ContractWrapper } from "./contract-wrapper";
import { App, Permission } from "./types";
import { setAppRaw } from "./lib/sign"

/**
 * Permissions contract wrapper
 */
export class Permissions extends ContractWrapper {

    constructor(environment: string, signer?: string) {
        super("Permissions", environment, signer)
    }

    /**
     * Get a single app's details
     * @param {string} owner the address of the party running the app
     */
    public async getApp(owner: string): Promise<App | undefined> {
        const result = await this.contract.getApp(owner)
        if (result.permissions.length > 0) {
            return
        }
        return {
            owner,
            name: result.name,
            url: result.url,
            permissions: result.permissions
        }
    }

    /**
     * Get a list of all apps registered
     */
    public async getAllApps(): Promise<App[]> {
        const owners: string[] = await this.contract.owners()
        const apps: App[] = []
        for (const owner of owners) {
            const result = await this.getApp(owner)
            if (result) {
                apps.push(result)
            }
        }
        return apps
    }

    /**
     * Adds or updates App entry
     * @param {string} name name of the app (optional - can leave empty)
     * @param {string} url public url to further information  (optional - can leave empty)
     * @param {uint[]} permissions list of permissions required by the app
     */
    public async setApp(name: string, url: string, permissions: Permission[]): Promise<ethers.providers.TransactionReceipt> {
        this.verifyWritable()
        const tx = await this.contract.setApp(name, url, permissions)
        await tx.wait()
        return tx
    }

    /**
     * Adds or updates App entry via raw transaction
     * @param {string} name name of the app (optional - can leave empty)
     * @param {string} url public url to further information  (optional - can leave empty)
     * @param {uint[]} permissions list of permissions required by the app
     * @param signer the private key of the owner of the registry listing. The signer configured in the
     * constructor is the "spender": they send and pay for the transaction on the network. 
     */
    public async setAppRaw(name: string, url: string, permissions: Permission[], signer: string): Promise<ethers.providers.TransactionReceipt> {
        this.verifyWritable()
        const wallet = new ethers.Wallet(signer)
        const sig = await setAppRaw(name, url, permissions, wallet)
        const tx = await this.contract.setAppRaw(name, url, permissions, sig.v, sig.r, sig.s)
        await tx.wait()
        return tx
    }

}

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
import { setAppRaw, createAgreementRaw } from "./lib/sign"

/**
 * Permissions contract wrapper
 */
export class Permissions extends ContractWrapper {

    constructor(environment: string, signer?: string) {
        super("Permissions", environment, signer)
    }

    /**
     * Get a single app's details
     * @param {string} provider the address of the party running the app
     */
    public async getApp(provider: string): Promise<App | undefined> {
        const result = await this.contract.getApp(provider)
        if (result.permissions.length === 0) {
            return
        }
        return {
            provider,
            name: result.name,
            url: result.url,
            permissions: result.permissions.map((permission) => Permission[permission.toNumber()])
        }
    }

    /**
     * Get a list of all apps registered
     */
    public async getAllApps(): Promise<App[]> {
        const providers: string[] = await this.contract.getProviders()
        const apps: App[] = []
        for (const provider of providers) {
            const result = await this.getApp(provider)
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

    /**
     * Gets a list of providers used by a given user
     * @param {string} user the address of the app user
     */
    public async getUserAgreements(user: string): Promise<App[]> {
        const providers = await this.contract.getUserAgreements(user)
        const apps: App[] = []
        
        for (const provider of providers) {
            const result = await this.getApp(provider)
            if (result) {
                apps.push(result)
            }
        }
        return apps
    }

    /**
     * Bind app user to provider, agreeing to app's permissions
     * @param {string} provider the address of the app provider
     */
    public async createAgreement(provider: string): Promise<ethers.providers.TransactionReceipt> {
        this.verifyWritable()
        const tx = await this.contract.createAgreement(provider)
        await tx.wait()
        return tx
    }

    /**
     * Bind app user to provider, agreeing to app's permissions, via raw transaction
     * @param {string} provider the address of the app provider
     * @param signer the private key of the owner of the registry listing. The signer configured in the
     * constructor is the "spender": they send and pay for the transaction on the network. 
     */
    public async createAgreementRaw(provider: string, signer: string): Promise<ethers.providers.TransactionReceipt> {
        this.verifyWritable()
        const wallet = new ethers.Wallet(signer)
        const signature = await createAgreementRaw(provider, wallet)
        const tx = await this.contract.createAgreementRaw(provider, signature.s, signature.r, signature.s)
        await tx.wait()
        return tx
    }

}

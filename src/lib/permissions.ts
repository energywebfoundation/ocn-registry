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

import { ethers } from "ethers"
import { ContractWrapper } from "./contract-wrapper"
import { Service, Permission } from "./types"
import { Network } from "../types/network"
import { setServiceRaw, createAgreementRaw, deleteServiceRaw, revokeAgreementRaw } from "./sign"


/**
 * Permissions contract wrapper
 */
export class Permissions extends ContractWrapper {

    constructor(environment: string, signer?: string, environmentOptions?: Partial<Network>) {
        super("Permissions", environment, signer, environmentOptions)
    }

    /**
     * Get a single service's details
     * @param {string} provider the address of the party running the service
     */
    public async getService(provider: string): Promise<Service | undefined> {
        const result = await this.contract.getService(provider)
        if (result.permissions.length === 0) {
            return
        }
        return {
            name: result.name,
            url: result.url,
            permissions: result.permissions.map((permission) => Permission[permission.toNumber()]),
            provider: {
                address: provider,
                countryCode: ethers.utils.toUtf8String(result.countryCode),
                partyId: ethers.utils.toUtf8String(result.partyId)
            }
        }
    }

    /**
     * Get a list of all services registered
     */
    public async getAllServices(): Promise<Service[]> {
        const providers: string[] = await this.contract.getProviders()
        const services: Service[] = []
        for (const provider of providers) {
            const result = await this.getService(provider)
            if (result) {
                services.push(result)
            }
        }
        return services
    }

    /**
     * Adds or updates Service entry
     * @param {string} name name of the service (optional - can leave empty)
     * @param {string} url public url to further information  (optional - can leave empty)
     * @param {uint[]} permissions list of permissions required by the service
     */
    public async setService(name: string, url: string, permissions: Permission[]): Promise<ethers.providers.TransactionReceipt> {
        this.verifyWritable()
        const tx = await this.contract.setService(name, url, permissions)
        await tx.wait()
        return tx
    }

    /**
     * Adds or updates Service entry via raw transaction
     * @param {string} name name of the service (optional - can leave empty)
     * @param {string} url public url to further information  (optional - can leave empty)
     * @param {uint[]} permissions list of permissions required by the service
     * @param signer the private key of the owner of the registry listing. The signer configured in the
     * constructor is the "spender": they send and pay for the transaction on the network.
     */
    public async setServiceRaw(name: string, url: string, permissions: Permission[], signer: string): Promise<ethers.providers.TransactionReceipt> {
        this.verifyWritable()
        const wallet = new ethers.Wallet(signer)
        const sig = await setServiceRaw(name, url, permissions, wallet)
        const tx = await this.contract.setServiceRaw(name, url, permissions, sig.v, sig.r, sig.s)
        await tx.wait()
        return tx
    }

    /**
     * Direct transaction by signer to delete a service from the OCN Registry.
     */
    public async deleteService(): Promise<ethers.providers.TransactionReceipt> {
        this.verifyWritable()
        const tx = await this.contract.deleteService()
        await tx.wait()
        return tx
    }

    /**
     * Remove the service of a given signer, using a raw transaction.
     * @param signer the private key of the owner of the registry listing. The signer configured in the
     * constructor is the "spender": they send and pay for the transaction on the network.
     */
    public async deleteServiceRaw(signer: string): Promise<ethers.providers.TransactionReceipt> {
        this.verifyWritable()
        const wallet = new ethers.Wallet(signer)
        const sig = await deleteServiceRaw(wallet)
        const tx = await this.contract.deleteServiceRaw(wallet.address, sig.v, sig.r, sig.s)
        await tx.wait()
        return tx
    }

    /**
     * Gets a list of providers used by a given user by their address
     * @param {string} user the address of the service user
     */
    public async getUserAgreementsByAddress(user: string): Promise<Service[]> {
        const providers = await this.contract.getUserAgreementsByAddress(user)
        const hasUserAgreement = async (provider: string) => await this.contract.hasUserAgreementByAddress(user, provider)
        return this.getUserAgreements(providers, hasUserAgreement)
    }

    public async getUserAgreementsByOcpi(countryCode: string, partyId: string): Promise<Service[]> {
        this.verifyStringLen(countryCode, 2)
        this.verifyStringLen(partyId, 3)

        const country = this.toHex(countryCode)
        const id = this.toHex(partyId)

        const providers = await this.contract.getUserAgreementsByOcpi(country, id)
        const hasUserAgreement = async (provider: string) => await this.contract.hasUserAgreementByOcpi(country, id, provider)
        return this.getUserAgreements(providers, hasUserAgreement)
    }

    /**
     * Bind service user to provider, agreeing to service's permissions
     * @param {string} provider the address of the service provider
     */
    public async createAgreement(provider: string): Promise<ethers.providers.TransactionReceipt> {
        this.verifyWritable()
        const tx = await this.contract.createAgreement(provider)
        await tx.wait()
        return tx
    }

    /**
     * Bind service user to provider, agreeing to service's permissions, via raw transaction
     * @param {string} provider the address of the service provider
     * @param signer the private key of the owner of the registry listing. The signer configured in the
     * constructor is the "spender": they send and pay for the transaction on the network.
     */
    public async createAgreementRaw(provider: string, signer: string): Promise<ethers.providers.TransactionReceipt> {
        this.verifyWritable()
        const wallet = new ethers.Wallet(signer)
        const signature = await createAgreementRaw(provider, wallet)
        const tx = await this.contract.createAgreementRaw(provider, signature.v, signature.r, signature.s)
        await tx.wait()
        return tx
    }

    /**
     * Revoke Service agreement
     * @param {string} provider the address of the service provider
     */
    public async revokeAgreement(provider: string): Promise<ethers.providers.TransactionReceipt> {
        this.verifyWritable()
        const tx = await this.contract.revokeAgreement(provider)
        await tx.wait()
        return tx
    }

    /**
     * Revoke Service agreement via raw transaction
     * @param {string} provider the address of the service provider
     * @param signer the private key of the owner of the registry listing. The signer configured in the
     * constructor is the "spender": they send and pay for the transaction on the network.
     */
    public async revokeAgreementRaw(provider: string, signer: string): Promise<ethers.providers.TransactionReceipt> {
        this.verifyWritable()
        const wallet = new ethers.Wallet(signer)
        const signature = await revokeAgreementRaw(provider, wallet)
        const tx = await this.contract.revokeAgreementRaw(provider, signature.s, signature.r, signature.s)
        await tx.wait()
        return tx
    }


    private async getUserAgreements(providers: string[], hasUserAgreement: (provider: string) => Promise<boolean>): Promise<Service[]> {
        const services: Service[] = []

        for (const provider of providers) {
            const hasAgreement = await hasUserAgreement(provider)
            if (hasAgreement) {
                const result = await this.getService(provider)
                if (result) {
                    services.push(result)
                }
            }
        }
        return services
    }

}

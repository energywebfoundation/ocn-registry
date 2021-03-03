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

import { ethers, Wallet } from "ethers";
import { URL } from "url"
import * as sign from "./sign"
import * as types from "./types"
import { Network } from "../types/network"
import { ContractWrapper } from "./contract-wrapper"

/**
 * Registry contract wrapper
 */
export class Registry extends ContractWrapper {

    constructor(environment: string, signer?: string, environmentOptions?: Partial<Network>) {
        super("Registry", environment, signer, environmentOptions)
    }

    /**
     * Get a registry node listing for a given operator.
     * @param operator Ethereum address of the operator.
     * @returns the domain name/url if listing exists.
     */
    public async getNode(operator: string): Promise<string | undefined> {
        this.verifyAddress(operator)
        const node = await this.contract.getNode(operator)
        return node || undefined
    }

    /**
     * Get the list of all nodes registered on the contract.
     * @returns array of Node objects, e.g.
     *   [
     *     {
     *       operator: "0x9bC1169Ca09555bf2721A5C9eC6D69c8073bfeB4",
     *       url: "https://node.ocn.org"
     *     }
     *   ]
     */
    public async getAllNodes(): Promise<Array<types.Node>> {
        const operators = await this.contract.getNodeOperators()
        const nodes: Array<types.Node> = []
        for (const operator of operators) {
            const url = await this.contract.getNode(operator)
            if (url) {
                nodes.push({ operator, url })
            }
        }
        return nodes
    }

    /**
     * Create or update a registry node operator listing. Uses the signer's wallet as configured
     * in the constructor to identify the node operator.
     * @param domain the domain name/url to link to the operator's Etheruem wallet.
     */
    public async setNode(domain: string): Promise<ethers.providers.TransactionReceipt> {
        this.verifyWritable()
        const url = new URL(domain)
        if (!this.wallet) {
            throw new Error("Signer address is needed to verify for existing node registration")
        }
        await this.checkForExistingNode(this.wallet)
        const tx = await this.contract.setNode(url.origin)
        await tx.wait()
        return tx
    }

    /**
     * Create or update a registry node operator listing using a raw transaction.
     * @param domain the domain name/url to link to the operator's Ethereum wallet.
     * @param signer the private key of the owner of the registry listing. The signer configured in the
     * constructor is the "spender": they send and pay for the transaction on the network.
     */
    public async setNodeRaw(domain: string, signer: string): Promise<ethers.providers.TransactionReceipt> {
        this.verifyWritable()
        const wallet = new ethers.Wallet(signer)
        await this.checkForExistingNode(wallet)
        const sig = await sign.setNodeRaw(domain, wallet)
        const tx = await this.contract.setNodeRaw(wallet.address, domain, sig.v, sig.r, sig.s)
        await tx.wait()
        return tx
    }

    /**
     * Remove the registry listing linked to the signer's wallet.
     */
    public async deleteNode(): Promise<ethers.providers.TransactionReceipt> {
        this.verifyWritable()
        const tx = await this.contract.deleteNode()
        await tx.wait()
        return tx
    }

    /**
     * Remove the registry listing of a given signer, using a raw transaction.
     * @param signer the private key of the owner of the registry listing. The signer configured in the
     * constructor is the "spender": they send and pay for the transaction on the network.
     */
    public async deleteNodeRaw(signer: string): Promise<ethers.providers.TransactionReceipt> {
        this.verifyWritable()
        const wallet = new ethers.Wallet(signer)
        const sig = await sign.deleteNodeRaw(wallet)
        const tx = await this.contract.deleteNodeRaw(wallet.address, sig.v, sig.r, sig.s)
        await tx.wait()
        return tx
    }


    /**
     * Get full party details of a given OCPI party by their address
     * @param address the wallet address of the party
     */
    public async getPartyByAddress(address: string): Promise<types.PartyDetails | undefined> {
        const details = await this.contract.getPartyDetailsByAddress(address)
        const result = this.toPartyDetails(Object.assign({ partyAddress: address }, details))
        return result.node.operator !== "0x0000000000000000000000000000000000000000" ? result : undefined
    }

    /**
     * Get full party details of a given OCPI party by their country_code/party_id
     * @param countryCode OCPI "country_code" of party (ISO-3166 alpha-2).
     * @param partyId OCPI "party_id" of party (ISO-15118).
     */
    public async getPartyByOcpi(countryCode: string, partyId: string): Promise<types.PartyDetails | undefined> {
        this.verifyStringLen(countryCode, 2)
        this.verifyStringLen(partyId, 3)

        const country = this.toHex(countryCode)
        const id = this.toHex(partyId)

        const details = await this.contract.getPartyDetailsByOcpi(country, id)
        const result = this.toPartyDetails(Object.assign({ countryCode: country, partyId: id }, details))
        return result.node.operator !== "0x0000000000000000000000000000000000000000" ? result : undefined
    }

    /**
     * Get a list of all registered OCPI parties on the network.
     */
    public async getAllParties(): Promise<types.PartyDetails[]> {
        const partyAddresses = await this.contract.getParties()
        const details: types.PartyDetails[] = []
        for (const address of partyAddresses) {
            const result = await this.contract.getPartyDetailsByAddress(address)
            if (result.operatorAddress !== "0x0000000000000000000000000000000000000000") {
                details.push(this.toPartyDetails(Object.assign({ partyAddress: address }, result)))
            }
        }
        return details
    }

    /**
     * List an OCPI party in the OCN Registry, linking it to a node operator.
     * @param countryCode OCPI "country_code" of party (ISO-3166 alpha-2).
     * @param partyId OCPI "party_id" of party (ISO-15118).
     * @param roles list of roles implemented by party (i.e. might only be CPO, or the same "platform" could implement
     * EMSP and CPO roles under the same country_code/party_id).
     * @param operator the operator address of the OCN Node used by the party.
     */
    public async setParty(countryCode: string, partyId: string, roles: types.Role[], operator: string): Promise<ethers.providers.TransactionReceipt> {
        this.verifyWritable()
        this.verifyStringLen(countryCode, 2)
        this.verifyStringLen(partyId, 3)
        this.verifyAddress(operator)

        const tx = await this.contract.setParty(this.toHex(countryCode), this.toHex(partyId), roles, operator)
        await tx.wait()
        return tx
    }


    /**
     * List an OCPI party in the OCN registry using a raw transaction.
     * @param countryCode OCPI "country_code" of party (ISO-3166 alpha-2).
     * @param partyId OCPI "party_id" of party (ISO-15118).
     * @param roles list of roles implemented by party (i.e. might only be CPO, or the same "platform" could implement
     * EMSP and CPO roles under the same country_code/party_id).
     * @param operator the operator address of the OCN Node used by the party.
     * @param signer the private key of the owner of the registry listing. The signer configured in the
     * constructor is the "spender": they send and pay for the transaction on the network.
     */
    public async setPartyRaw(countryCode: string, partyId: string, roles: types.Role[], operator: string, signer: string): Promise<ethers.providers.TransactionReceipt> {
        this.verifyWritable()
        this.verifyStringLen(countryCode, 2)
        this.verifyStringLen(partyId, 3)
        this.verifyAddress(operator)

        const country = this.toHex(countryCode)
        const id = this.toHex(partyId)

        const wallet = new ethers.Wallet(signer)
        const sig = await sign.setPartyRaw(country, id, roles, operator, wallet)
        const tx = await this.contract.setPartyRaw(wallet.address, country, id, roles, operator, sig.v, sig.r, sig.s)
        await tx.wait()
        return tx
    }

    /**
     * Direct transaction to provide module interfaces supported by the signer's OCPI implementation.
     * Can also be used to delete previously-set party modules by providing empty arrays.
     * (note: this is an opt-in feature).
     * @param sender array of sender interface role module Ids.
     * @param receiver array of receiver interface role module Ids.
     */
    public async setPartyModules(sender: types.Module[], receiver: types.Module[]): Promise<ethers.providers.TransactionReceipt> {
        this.verifyWritable()
        const tx = await this.contract.setPartyModules(sender, receiver)
        await tx.wait()
        return tx
    }

    /**
     * Raw transaction allowing another wallet to provide module interfaces supported by the signer's OCPI implementation.
     * Can also be used to delete previously-set party modules by providing empty arrays.
     * (note: this is an opt-in feature).
     * @param sender array of sender interface role module Ids.
     * @param receiver array of receiver interface role module Ids.
     * @param signer the private key of the owner of the registry listing. The signer configured in the
     * constructor is the "spender": they send and pay for the transaction on the network.
     */
    public async setPartyModulesRaw(sender: types.Module[], receiver: types.Module[], signer: string): Promise<ethers.providers.TransactionReceipt> {
        this.verifyWritable()
        const wallet = new ethers.Wallet(signer)
        const sig = await sign.setPartyModulesRaw(sender, receiver, wallet)
        const tx = await this.contract.setPartyModulesRaw(wallet.address, sender, receiver, sig.v, sig.r, sig.s)
        await tx.wait()
        return tx
    }

    /**
     * Direct transaction by signer to delete a party from the OCN Registry.
     */
    public async deleteParty(): Promise<ethers.providers.TransactionReceipt> {
        this.verifyWritable()
        const tx = await this.contract.deleteParty()
        await tx.wait()
        return tx
    }

    /**
     * Raw transaction allowing another wallet to delete the signer's OCN Registry party listing.
     * @param signer the private key of the owner of the registry listing. The signer configured in the
     * constructor is the "spender": they send and pay for the transaction on the network.
     */
    public async deletePartyRaw(signer: string): Promise<ethers.providers.TransactionReceipt> {
        this.verifyWritable()
        const wallet = new ethers.Wallet(signer)
        const sig = await sign.deletePartyRaw(wallet)
        const tx = await this.contract.deletePartyRaw(wallet.address, sig.v, sig.r, sig.s)
        await tx.wait()
        return tx
    }

    private toPartyDetails(input: any): types.PartyDetails {
        return {
            countryCode: ethers.utils.toUtf8String(input.countryCode),
            partyId: ethers.utils.toUtf8String(input.partyId),
            address: input.partyAddress,
            roles: input.roles.map((index: number) => types.Role[index]),
            modules: {
                sender: input.modulesSender.map((index: number) => types.Module[index]),
                receiver: input.modulesReceiver.map((index: number) => types.Module[index])
            },
            node: {
                operator: input.operatorAddress,
                url: input.operatorDomain
            }
        }
    }

    private async checkForExistingNode(signer: Wallet) {
        const existingNode = await this.getNode(signer.address)
        if (existingNode) {
            throw new Error("This operator has an existing node. Call delete-node to remove prior to updating.")
        }
    }

}

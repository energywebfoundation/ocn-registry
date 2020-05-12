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
import { soliditySha3 } from "web3-utils"
// const {toBN} = require('./utils')

interface SignatureWithHash extends ethers.utils.Signature {
    hash: Uint8Array
}

async function sign(txMsg: string, wallet: ethers.Wallet): Promise<SignatureWithHash> {
  const messageHashBytes = ethers.utils.arrayify(txMsg)
  const flatSig = await wallet.signMessage(messageHashBytes)
  const sig = ethers.utils.splitSignature(flatSig)

  return {
    ...sig,
    hash: messageHashBytes
  }
}

export async function setNodeRaw(domain: string, wallet: ethers.Wallet) {
  const txMsg = soliditySha3(wallet.address, domain)
  return sign(txMsg as string, wallet)
}

export async function deleteNodeRaw(wallet: ethers.Wallet) {
  const txMsg = soliditySha3(wallet.address)
  return sign(txMsg as string, wallet)
}

export async function setPartyRaw(countryCode: string, partyId: string, roles: number[], operator: string, wallet: ethers.Wallet) {
    const txMsg = soliditySha3(wallet.address, countryCode, partyId, ...roles, operator)
    return sign(txMsg as string, wallet)
}

export async function setPartyModulesRaw(sender: number[], receiver: number[], wallet: ethers.Wallet) {
    const txMsg = soliditySha3(wallet.address, ...sender, ...receiver)
    return sign(txMsg as string, wallet)
}

export async function deletePartyRaw(wallet: ethers.Wallet) {
    const txMsg = soliditySha3(wallet.address)
    return sign(txMsg as string, wallet)
}

export async function setAppRaw(name: string, url: string, permissions: number[], wallet: ethers.Wallet) {
    const txMsg = soliditySha3(name, url, ...permissions)
    return sign(txMsg as string, wallet)
}

export async function createAgreementRaw(provider: string, wallet: ethers.Wallet) {
    const txMsg = soliditySha3(provider)
    return sign(txMsg as string, wallet)
}
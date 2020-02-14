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
const ethers = require('ethers')
const contracts = require('../lib/contracts')
const sign = require('../lib/sign')
const {networks} = require('./networks')

class SnC {
  constructor(network, privateKey, provider) {
    if (!contracts[network]) throw new Error(`the network ${network} does not exist`)
    if (!provider) {
      provider = new ethers.providers.JsonRpcProvider(`${networks[network].protocol}://${networks[network].host}:${networks[network].port}`)
    }
    this.provider = provider
    this.wallet = new ethers.Wallet(privateKey, provider)

    this.registryJson = contracts[network].Registry
    this.registry = new ethers.Contract(this.registryJson.address, this.registryJson.abi, this.wallet)
  }

  async getSignedRegisterOrUpdate(countryCode, partyID, nodeURL, nodeAddress) {
    countryCode = '0x' + Buffer.from(countryCode).toString('hex')
    partyID = '0x' + Buffer.from(partyID).toString('hex')
    return sign.registerOrUpdate(countryCode, partyID, nodeURL, nodeAddress, this.wallet)
  }

  async getSignedDeregister(countryCode, partyID) {
    countryCode = '0x' + Buffer.from(countryCode).toString('hex')
    partyID = '0x' + Buffer.from(partyID).toString('hex')
    return sign.deregister(countryCode, partyID, this.wallet)
  }

  async register(countryCode, partyID, nodeURL, nodeAddress, signature) {
    const tx = await this.registry.register(
      '0x' + Buffer.from(countryCode).toString('hex'),
      '0x' + Buffer.from(partyID).toString('hex'),
      nodeURL,
      nodeAddress,
      signature.v,
      signature.r,
      signature.s,
      {gasLimit: 1000000})
    await tx.wait()
    const receipt = await this.provider.getTransactionReceipt(tx.hash)
    return receipt.transactionHash
  }

  async updateNodeInfo(countryCode, partyID, newNodeURL, newNodeAddress, signature) {
    const tx = await this.registry.updateNodeInfo(
      '0x' + Buffer.from(countryCode).toString('hex'),
      '0x' + Buffer.from(partyID).toString('hex'),
      newNodeURL,
      newNodeAddress,
      signature.v,
      signature.r,
      signature.s,
      {gasLimit: 1000000})
    await tx.wait()
    const receipt = await this.provider.getTransactionReceipt(tx.hash)
    return receipt.transactionHash
  }

  async deregister(countryCode, partyID, signature) {
    const tx = await this.registry.deregister(
      '0x' + Buffer.from(countryCode).toString('hex'),
      '0x' + Buffer.from(partyID).toString('hex'),
      signature.v,
      signature.r,
      signature.s,
      {gasLimit: 1000000})
    await tx.wait()
    const receipt = await this.provider.getTransactionReceipt(tx.hash)
    return receipt.transactionHash
  }

}

module.exports = SnC

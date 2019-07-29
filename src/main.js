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

  async getSignedRegisterOrUpdate(countryCode, partyID, clientURL, clientAddress) {
    countryCode = '0x' + Buffer.from(countryCode).toString('hex')
    partyID = '0x' + Buffer.from(partyID).toString('hex')
    return sign.registerOrUpdate(countryCode, partyID, clientURL, clientAddress, this.wallet)
  }

  async getSignedDeregister(countryCode, partyID) {
    countryCode = '0x' + Buffer.from(countryCode).toString('hex')
    partyID = '0x' + Buffer.from(partyID).toString('hex')
    return sign.deregister(countryCode, partyID, this.wallet)
  }

  async register(countryCode, partyID, clientURL, clientAddress, signature) {
    const tx = await this.registry.register(
      '0x' + Buffer.from(countryCode).toString('hex'),
      '0x' + Buffer.from(partyID).toString('hex'),
      clientURL,
      clientAddress,
      signature.v,
      signature.r,
      signature.s,
      {gasLimit: 1000000})
    await tx.wait()
    const receipt = await this.provider.getTransactionReceipt(tx.hash)
    return receipt.transactionHash
  }

  async updateClientInfo(countryCode, partyID, newClientURL, newClientAddress, signature) {
    const tx = await this.registry.updateClientInfo(
      '0x' + Buffer.from(countryCode).toString('hex'),
      '0x' + Buffer.from(partyID).toString('hex'),
      newClientURL,
      newClientAddress,
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

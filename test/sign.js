const ethers = require('ethers')
const utils = require('web3-utils')

async function sign(txMsg, wallet) {
  const messageHashBytes = ethers.utils.arrayify(txMsg)
  const flatSig = await wallet.signMessage(messageHashBytes)
  const sig = ethers.utils.splitSignature(flatSig)

  return {
    ...sig,
    hash: messageHashBytes
  }
}

async function setNodeRaw(domain, wallet) {
  const txMsg = utils.soliditySha3(wallet.address, domain)
  return sign(txMsg, wallet)
}

async function deleteNodeRaw(wallet) {
  const txMsg = utils.soliditySha3(wallet.address)
  return sign(txMsg, wallet)
}

async function setPartyRaw(countryCode, partyId, roles, operator, wallet) {
  const txMsg = utils.soliditySha3(wallet.address, countryCode, partyId, ...roles, operator)
  return sign(txMsg, wallet)
}

async function setPartyModulesRaw(sender, receiver, wallet) {
  const txMsg = utils.soliditySha3(wallet.address, ...sender, ...receiver)
  return sign(txMsg, wallet)
}

async function deletePartyRaw(wallet) {
  const txMsg = utils.soliditySha3(wallet.address)
  return sign(txMsg, wallet)
}

async function setServiceRaw(name, url, permissions, wallet) {
  const txMsg = utils.soliditySha3(name, url, ...permissions)
  return sign(txMsg, wallet)
}

async function deleteServiceRaw(wallet) {
  const txMsg = utils.soliditySha3(wallet.address)
  return sign(txMsg, wallet)
}

async function createAgreementRaw(provider, wallet) {
  const txMsg = utils.soliditySha3(provider)
  return sign(txMsg, wallet)
}

async function revokeAgreementRaw(provider, wallet) {
  const txMsg = utils.soliditySha3(provider)
  return sign(txMsg, wallet)
}

module.exports = {
  setNodeRaw,
  deleteNodeRaw,
  setPartyRaw,
  setPartyModulesRaw,
  deletePartyRaw,
  setServiceRaw,
  deleteServiceRaw,
  createAgreementRaw,
  revokeAgreementRaw
}

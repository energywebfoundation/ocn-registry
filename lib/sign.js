const ethers = require('ethers')
const utils = require('web3-utils')
const {toBN} = require('./utils')

async function sign(txMsg, wallet) {
  const messageHashBytes = ethers.utils.arrayify(txMsg)
  const flatSig = await wallet.signMessage(messageHashBytes)
  const sig = ethers.utils.splitSignature(flatSig)

  return {
    ...sig,
    hash: messageHashBytes
  }
}

async function registerOrUpdate(countryCode, partyID, clientURL, clientAddress, wallet) {
  const txMsg = utils.soliditySha3(countryCode, partyID, clientURL, clientAddress)
  return sign(txMsg, wallet)
}

async function deregister(countryCode, partyID, wallet) {
  const txMsg = utils.soliditySha3(countryCode, partyID)
  return sign(txMsg, wallet)
}

module.exports = {
  registerOrUpdate,
  deregister
}

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

async function registerOrUpdate(countryCode, partyID, nodeURL, nodeAddress, wallet) {
  const txMsg = utils.soliditySha3(countryCode, partyID, nodeURL, nodeAddress)
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

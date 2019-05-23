const utils = require('web3-utils')
const BigNumber = require('bignumber.js')
// the purpose of this function is to be able to create BN from exponent numbers like '2e22' they must be formatted as string in this case
const toBN = (num) => utils.toBN(new BigNumber(num.toString()).toString(10))

module.exports = {
  toBN
}

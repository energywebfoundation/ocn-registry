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
const utils = require('web3-utils')
const BigNumber = require('bignumber.js')
// the purpose of this function is to be able to create BN from exponent numbers like '2e22' they must be formatted as string in this case
const toBN = (num) => utils.toBN(new BigNumber(num.toString()).toString(10))

module.exports = {
  toBN
}

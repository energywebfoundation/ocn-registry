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
const HDWalletProvider = require("truffle-hdwallet-provider")

const MNEMONIC = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat'

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8544,
      network_id: '9',
      gas: 8000000
    },
    volta: {
      protocol: 'http',
      host: '35.178.1.16',
      port: 80,
      network_id: '73799',
      gasPrice: 1
    }
  }
}



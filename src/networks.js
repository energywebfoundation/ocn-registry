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



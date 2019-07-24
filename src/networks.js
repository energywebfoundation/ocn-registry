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
    local: {
      protocol: 'http',
      host: 'localhost',
      port: 8544,
      network_id: '9',
      gas: 4000000
    },
    tobalaba: {
      protocol: 'http',
      host: 'node38817-test-cpo-api.hidora.com',
      port: 11076,
      network_id: '*',
      gas: 4000000
    },
    vpn_tobalaba: {
      protocol: 'http',
      host: '10.102.4.68',
      port: 8545,
      network_id: '*',
      gas: 4000000
    },
    poa: {
      protocol: 'http',
      host: 'node35590-env-2351721.hidora.com',
      port: 11009,
      network_id: '17',
      from: "0x00a329c0648769a73afac7f9381e08fb43dbea72",
      gas: 4000000
    },
    vpn_poa: {
      protocol: 'http',
      host: '10.102.0.199',
      port: 8545,
      network_id: '17',
      from: "0x627306090abaB3A6e1400e9345bC60c78a8BEf57",
      gas: 4000000
    },
    volta: {
      protocol: 'http',
      host: '35.178.1.16',
      port: 80,
      network_id: '73799',
      gasPrice: 1
    },
    production: {
      protocol: 'http',
      host: 'localhost',
      port: 8545,
      network_id: '*',
      gas: 4000000
    }
  }
}



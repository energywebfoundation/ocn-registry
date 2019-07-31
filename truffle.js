var HDWalletProvider = require("truffle-hdwallet-provider")
const MNEMONIC = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat'

module.exports = {
  compilers: {
    solc: {
      version: "0.5.2",
      docker: false,
    }
  },
  networks: {
    development: {
      host: 'localhost',
      port: 8544,
      network_id: '9',
      gas: 8000000
    },
    docker: {
      protocol: 'http',
      host: '172.16.238.10',
      port: 8544,
      network_id: "*"
    },
    local: {
      protocol: 'http',
      host: 'localhost',
      port: 8545,
      network_id: '9',
      gas: 4000000
    },
    test: {
      protocol: 'http',
      host: '18.185.68.194',
      port: 8545,
      from: '0x00bd138abd70e2f00903268f3db08f2d25677c9e',
      gasPrice: 49,
      network_id: '*',
      gas: 4700000
    },
    pilot: {
      protocol: 'http',
      host: '18.185.85.20',
      port: 8545,
      from: '0x00bd138abd70e2f00903268f3db08f2d25677c9e',
      gasPrice: 0,
      network_id: '*',
      gas: 4000000
    },
    tobalaba: {
      provider: function() {
        return new HDWalletProvider("CAB468AF941365618E45836E3C4E08F53A330C87C37941F011F68BA3D448C47B", "http://node38817-test-cpo-api.hidora.com:11076")
      },
      gasPrice: 0,
      network_id: '*',
      gas: 4000000
    },
    poa: {
      host: 'node35590-env-2351721.hidora.com',
      port: 11009,
      network_id: '17',
      from: "0x00a329c0648769a73afac7f9381e08fb43dbea72",
      gas: 4000000
    },
    poa_hd: {
      provider: () => new HDWalletProvider(MNEMONIC, "http://node35590-env-2351721.hidora.com:11009"),
      network_id: '17',
      from: "0x627306090abaB3A6e1400e9345bC60c78a8BEf57",
      gas: 4000000
    },
    poalocal: {
      protocol: 'http',
      host: 'localhost',
      port: 8545,
      network_id: '0x11',
      from: "0x00a329c0648769a73afac7f9381e08fb43dbea72",
      gas: 4000000
    },
    volta: {
      provider: () => new HDWalletProvider(process.env.VOLTA_PKEY, "http://35.178.1.16/"),
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



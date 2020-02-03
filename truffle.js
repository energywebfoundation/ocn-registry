var HDWalletProvider = require("truffle-hdwallet-provider")

module.exports = {
  compilers: {
    solc: {
      version: "0.5.14",
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
    volta: {
      provider: () => new HDWalletProvider(process.env.VOLTA_PKEY, "http://35.178.1.16/"),
      network_id: '73799',
      gasPrice: 100
    }
  }
}



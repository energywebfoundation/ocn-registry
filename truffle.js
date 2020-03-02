var HDWalletProvider = require("truffle-hdwallet-provider")

module.exports = {
  compilers: {
    solc: {
      version: "0.5.15",
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
      provider: () => new HDWalletProvider(process.env.VOLTA_PKEY, "https://volta-rpc.energyweb.org/"),
      network_id: '73799',
      gasPrice: 100
    },
    prod: {
      provider: () => new HDWalletProvider(process.env.PROD_KEY, "https://rpc.energyweb.org/"),
      network_id: "246",
      gasPrice: 100
    }
  }
}



[![Codacy Badge](https://api.codacy.com/project/badge/Grade/a24c1584300a4c758d8da109a3e6cb80)](https://www.codacy.com?utm_source=bitbucket.org&amp;utm_medium=referral&amp;utm_content=shareandcharge/registry&amp;utm_campaign=Badge_Grade)

Share&Charge Registry Smart Contracts

Share&Charge eMobility smart contracts written in Solidity for Ethereum-based networks.

## Usage

The package provides a class `SnC` which simplifies the work with the smart-contracts. 
The constructor takes 3 parameters:

* stage - one of `local`, `poa`, `test` and `tobalaba`
* privateKey - the private key of the account you want to sign your transactions with
* provider - optionally you can override the default configuration for accessing the node by supplying your own provider

the packages uses [ethers](https://docs.ethers.io/ethers.js/html/) for communicating 
with the parity node. 

the SnC class provides access to the smart contracts in the form of instantiated objects which expose 
all the implemented functions. The available smart-contracts are:

* registry - a list of parties in the network and the broker that they are connected to.


## Development

Clone and install dependencies:

```
$ git clone https://bitbucket.org/shareandcharge/registry.git
$ cd registry
$ npm install
```

In two different terminal sessions, ensure the contracts are working as expected:

```
$ npm run ganache
$ npm test
```

Initial deployment of the smart contracts:

```
truffle migrate --network=<STAGE>
```

Publish contract definitions (<STAGE> defaults to "local"):

```
npm run publish-dev <STAGE>
```

The contract definitions are now available to be used in `./contract.defs.<STAGE>.json`.
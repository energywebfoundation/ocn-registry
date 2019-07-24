[![Codacy Badge](https://api.codacy.com/project/badge/Grade/a24c1584300a4c758d8da109a3e6cb80)](https://www.codacy.com?utm_source=bitbucket.org&amp;utm_medium=referral&amp;utm_content=shareandcharge/registry&amp;utm_campaign=Badge_Grade)

Share&Charge Registry Smart Contracts

Share&Charge eMobility smart contracts written in Solidity for Ethereum-based networks.

## Usage

The package provides a class `SnC` which simplifies the work with the smart-contracts. 
The constructor takes 3 parameters:

* stage - one of `local`, `tobalaba` and `volta`
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

## Docker

You may also use Docker to aid development of other services using the registry. Simply run 
`docker-compose up` to start ganache and have the contracts deployed automatically. The registry 
contract will always have the same owner and address:

- **Address**: `0x345cA3e014Aaf5dcA488057592ee47305D9B3e10`
- **Owner**: `0x627306090abaB3A6e1400e9345bC60c78a8BEf57`

If you make changes to the contracts, run `docker-compose --build`. This will ensure that the
above is true, giving you the same address. Otherwise, run `truffle migrate --reset`, making 
note of the newly deployed contract's address for your application development.

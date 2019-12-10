[![Codacy Badge](https://api.codacy.com/project/badge/Grade/a24c1584300a4c758d8da109a3e6cb80)](https://www.codacy.com?utm_source=bitbucket.org&amp;utm_medium=referral&amp;utm_content=shareandcharge/registry&amp;utm_campaign=Badge_Grade)

Share&Charge Registry Smart Contracts

Share&Charge eMobility smart contracts written in Solidity for Ethereum-based networks.


## Contract Wrappers and Usage

### JavaScript Wrapper

The provided JavaScript wrapper a class `SnC` which simplifies the work with the smart-contracts. It is not
currently published, but can be used as so:

```js
const SnC = require("./src/main")

const snc = new SnC("volta", PRIVATE_KEY)
```

The constructor takes 3 parameters:

* stage - one of `local`, `tobalaba` and `volta`
* privateKey - the private key of the account you want to sign your transactions with
* provider - optionally you can override the default configuration for accessing the node by supplying your own provider

The packages uses [ethers](https://docs.ethers.io/ethers.js/html/) for communicating with the desired network (based on the 
stage provided in the first parameter) node. 

The SnC class provides access to the smart contracts in the form of instantiated objects which expose 
all the implemented functions. The available smart-contracts are:

* registry - a list of parties in the network and the broker that they are connected to.

Contract transactions (paid for) which change the state of the Registry contract are:

* `register()`
* `updateNodeInfo()`
* `deregister()`

These functions require the state change parameters **plus** the signed state change parameters. You can get the
latter by calling a `getSigned*` function beforehand, e.g.:

```js
const countryCode = "DE"
const partyID = "SNC"
const nodeURL = "http://some.node.addr"
const nodeEthAddress = "0x7fA5e01A6f907B707601443929B1289F89994808"

const signature = await snc.getSignedRegisterOrUpdate(countryCode, partyID, nodeURL, nodeEthAddress))

const transactionHash = await snc.register(countryCode, partyID, nodeURL, nodeEthAddress, signature)

// or alternatively, if you wish to change your connected node information:
const transactionHashAlt = await snc.updateNodeInfo(countryCode, partyID, nodeURL, nodeEthAddress, signature)
```

To "deregister", the same can be done with `getSignedDeregister`:

```js
const signature = await snc.getSignedDeregister(countryCode, partyID)
const txHash = await snc.deregister(countryCode, partyID, signature)
```

To read contract state data, call functions are available through the ethers Registry contract facade:

```js
const countryCodeHex = "0x" + Buffer.from(countryCode).toString("hex")
const partyIDHex = "0x" + Buffer.from(partyID).toString("hex")

const url = await snc.registry.nodeURLOf(countryCodeHex, partyIDHex)
```

Note that this method assumes that both the signer and sender of the transaction are both the same and therefore can
afford the gas to pay for the transaction. To see a registration example without the contract wrapper, check out the 
[ocn-demo](https://bitbucket.org/shareandcharge/ocn-demo) repository. 

### Java Wrapper

Note: usage examples provided in Kotlin.

Include the package `./java/snc in your project under `src` or `src/java`.

Instantiate the contract with an address, a web3j instance, txManager and gasProvider:

```kotlin
import org.web3j.protocol.Web3j
import org.web3j.crypto.Credentials
import org.web3j.protocol.http.HttpService
import org.web3j.tx.gas.StaticGasProvider
import snc.openchargingnetwork.Registry

// connect web3j to your node
val web3j = Web3j.build(HttpService("http://localhost:8545"))

// initialize the credentials of the wallet paying for transactions
val credentials = Credentials.create(PRIVATE_KEY)

// initialize a gas provider (gas price and limit values dependent on network)
val gasProvider = StaticGasProvider(0.toBigInteger(), 100000.toBigInteger())

// initialize the Registry contract wrapper based on the address of the contract to use
val registry = Registry.load("0x345cA3e014Aaf5dcA488057592ee47305D9B3e10", web3j, credentials, gasProvider)
```

Then, to sign and send a register transaction, for example: 

```kotlin
// load the credentials of the signing address (i.e. the owner of the Registry state data to be entered)
val signer = Credentials.create(SIGNER_PRIVATE_KEY)

// compose and hash the transaction parameters
val countryCode = "DE"
val partyID = "SNC"
val nodeURL = "http://some.node.addr"
val nodeEthAddress = "0x7fA5e01A6f907B707601443929B1289F89994808"
val message = countryCode + partyID + nodeURL = nodeEthAddress
val hash = Hash.sha3(message.toByteArray(StandardCharsets.UTF_8))

// sign the transaction parameters with the credentials from above
val signature = Sign.signPrefixedMessage(hash, signer.ecKeyPair)

// send the transaction to the 
val transaction = registry.register(
        countryCode.toByteArray(),
        partyID.toByteArray(),
        nodeURL,
        nodeEthAddress,
        BigInteger(signature.v),
        signature.r,
        signature.s).sendAsync().get()
```

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


## Updating contract wrappers

The JavaScript wrapper requires manual updating.

The Java wrapper can be updated using `web3j`:

```
npm run compile
web3j truffle generate ./build/contracts/Registry.json -o ./java -p snc.openchargingnetwork.contracts
```

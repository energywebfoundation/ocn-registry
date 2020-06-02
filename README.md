# Open Charging Network Registry

Decentralized Registry smart contracts for Node operators, OCPI party and App providers. For Ethereum-based networks.

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/a24c1584300a4c758d8da109a3e6cb80)](https://www.codacy.com?utm_source=bitbucket.org&amp;utm_medium=referral&amp;utm_content=shareandcharge/registry&amp;utm_campaign=Badge_Grade)

## Pre-amble

There are a few concepts which first need to be explained. The Registry smart contracts works on Ethereum-based 
blockchains. That might be [ganache](https://github.com/trufflesuite/ganache-cli) if running a local development 
blockchain, or the pre-production or production chain of the 
[Energy Web Foundation's blockchain](https://energyweb.atlassian.net/wiki/spaces/EWF/overview). These chains use 
[Etheruem's public-private key cryptography](https://ethereum.org/wallets/). In the OCN they are used to identify 
Node operators and OCPI parties on the Open Charging Network and can be generated in a variety of ways, for 
example by [Metamask](https://metamask.io/).

### Signers and Spenders

The OCN Registry allows for two ways of adding and maintaining listings. It can be done directly, whereby a 
single keypair signs the registry data and sends a transaction to the blockchain network, paying for the 
transaction fee in the process. This is arguably simpler but requires each keypair to be funded. Alternatively, 
"raw" transactions can be used, whereby the registry data is signed by the data owner's keypair and sent to the 
blockchain network using a different, funded keypair.

Therefore, in "direct" transactions, the signer and spender are one, named just the "signer". In contrast, in
raw transactions, the "signer" is the data owner, and the "spender" is the one paying for the transaction.

### Node Operators, OCPI Parties and App providers

The principle behind the registry is that the nodes, comprising the Open Charging Network, need a way of discovering 
counterparties they are not directly connected to. This works in two stages: OCN Node operators (i.e. administrators) 
can list their node in the registry, which allows OCPI parties (i.e. Charge Point Operators or E-Mobility Service
Providers) to link their services to a registered node. 

Note that the registry listing must be done by the OCPI party before an OCN Node accepts their credentials 
registration, so that the OCN Node can ensure the party has correctly linked themselves to that node in the registry. 

An OCN App is an OCPI party that requires additional permissions from their customers. We make this distinction
from other "Apps" that might only require customers to send OCPI messages (including custom OCPI modules) directly.
Such permissions could include the forwarding of session or charge detail record data, for example in a payment
app. Once a customer/user has agreed to the App's permissions, the OCN Node tied to the customer will automate
any such required permissions, lessening the cost of integration with an App.

OCN Apps are first and foremost OCPI parties - they must be listed in the Registry smart contract. To be granted
the aforementioned permissions, such a party must then list their app and the permissions required in a separate
smart contract, entitled "Permissions". Thereafter, a user can make their agreement explicit in the same smart
contract.

#### OCPI Party connection steps:

1. Operator signs a transaction stating they run the OCN Node on domain `https://node.ocn.org`. The address of their
wallet (`0x9bC1169Ca09555bf2721A5C9eC6D69c8073bfeB4`), used to sign the transaction, now points to the domain name. 

2. OCPI party signs a transaction stating they use the OCN Node of `0x9bC1169Ca09555bf2721A5C9eC6D69c8073bfeB4`. The
address of their wallet, (`0x0B2E57DDB616175950e65dE47Ef3F5BA3bc29979`) now points to the wallet address of their
OCN Node operator. 

3. OCPI party does the credentials registration handshake with the OCN Node at `https://node.ocn.org`.

4. Party is now able to send and receive OCPI requests from other OCPI parties on the network. 

---

## Usage

There are several ways to interact with the OCN Registry, including:

- [CLI](#cli)
- [TypeScript Library](#typescript-library)
- [Java Library](#java-library)

---

## [Command Line Interface](#cli)

### Getting started

Clone this repository or install the registry npm package:

#### Using this repository

```
git clone https://bitbucket.org/shareandcharge/ocn-registry.git
cd ocn-registry
npm install
npx ts-node src/cli --help
```

#### Using the npm package

```
npm install -g @shareandcharge/ocn-registry
ocn-registry --help
```

#### Setting the signer

The private keys of the signer (and optionally spender) are needed for each transaction (modifying state of the 
contract). Contract calls (i.e. getting data) do not require this. 

This can be done in two ways: environment variables or command line flags.

```
EXPORT SIGNER=0xbe367b774603c65850ee2cf479df809174f95cdb847483db2a6bcf1aad0fa5fd
```

If using a raw command, the spender is also required:

```
EXPORT SENDER=0x2f0810c5fc949c846ff64edb26b0b00ca28effaffb9ac867a7b9256c034fe849
```

**Important: do not use these private keys outside of development! They were generated for this guide only.**

Alternatively, flags allow setting the signer and spender for each command. Add `--help` to any command to get 
information about available flags.


#### Choosing the network

By default, the registry will look for a local ganache instance running on `http://localhost:8544`. This is the
development chain which can be started with `npm run ganache`. This also provides 20 funded keypairs to play around
with (they are generated from a mnemonic, so won't change between restarts). 

Each command can be run against additional networks on which the OCN Registry has been deployed using the `-n` flag. 
This includes [Volta](https://energyweb.atlassian.net/wiki/spaces/EWF/pages/702677023/Chain+Volta+Test+Network), 
for the OCN public test environment, as well as the 
[Energy Web Chain](https://energyweb.atlassian.net/wiki/spaces/EWF/pages/718078071/Chain+Energy+Web+Chain+Production+Network)
for production.


### Get an operator's node

To check the domain of a single node operator on the network, use:

```
ocn-registry get-node 0xEada1b2521115e07578DBD9595B52359E9900104
```

Where `0xEada1b2521115e07578DBD9595B52359E9900104` is the operator's keypair address.

To choose the network to use (as outlined above), set the `-n` (`--network`) flag:

```
ocn-registry get-node 0xEada1b2521115e07578DBD9595B52359E9900104 --network=volta
ocn-registry get-node 0xEada1b2521115e07578DBD9595B52359E9900104 -n prod
```

### Get all nodes

To return a list of all nodes and operators, use:

```
ocn-registry list-nodes
```

### Listing a node

OCN Node operators can make their node visible on the network by adding it to the OCN Registry. Creating and updating
a listing can be done using the same command:

```
ocn-registry set-node https://node.provider.net
```

Alternatively, using a raw transaction:

```
ocn-registry set-node-raw https://node.provider.net
```

Remember to set the signer AND spender for the raw transaction. If not using environment variables, set with the following flags:

```
ocn-registry set-node-raw https://node.provider.net
        --signer=0xbe367b774603c65850ee2cf479df809174f95cdb847483db2a6bcf1aad0fa5fd 
        --spender=0x2f0810c5fc949c846ff64edb26b0b00ca28effaffb9ac867a7b9256c034fe849
```

Type `--help` after any command for more information.

```
ocn-registry set-node-raw --help
```

### De-listing a node

If an operator decides not to provide a node any longer, they can remove it from the registry:

```
ocn-registry delete-node
```

Or as a raw transaction:

```
ocn-registry delete-node-raw
```

### Get party information

Check the registered information of a given party using their address or OCPI credentials (`country_code` and 
`party_id`):

```
ocn-registry get-party -a 0x0B2E57DDB616175950e65dE47Ef3F5BA3bc29979
ocn-registry get-party -c CH CPO
```

### Get all parties

List all registered parties on the network:

```
ocn-registry list-parties
```

### Listing a party

To list a party, the following information is required:
- `country_code` and `party_id`
- role
- OCN Node operator wallet address

The following commands can be used to both create and update the party information.


#### Scenario 1: party_id with single role

Using a direct transaction:
```
ocn-registry set-party -c CH CPO -r CPO -o 0x9bC1169Ca09555bf2721A5C9eC6D69c8073bfeB4
```

Using a raw transaction:
```
ocn-registry set-party-raw -c CH CPO -r CPO -o 0x9bC1169Ca09555bf2721A5C9eC6D69c8073bfeB4
```

#### Scenario 2: party_id with multiple roles

```
ocn-registry set-party -c CH ABC -r CPO EMSP -o 0x9bC1169Ca09555bf2721A5C9eC6D69c8073bfeB4
```

#### Scenario 3: platform with multiple roles under different `party_id`s

In this case, the platform must use different wallets for each `party_id`:

```
ocn-registry set-party -c CH CPO -r CPO -o 0x9bC1169Ca09555bf2721A5C9eC6D69c8073bfeB4 -s 0xd37f60f3a7c78a72d24e50b9105879c89d249e299699ba762d890276dea73fea
ocn-registry set-party -c CH MSP -r EMSP -o 0x9bC1169Ca09555bf2721A5C9eC6D69c8073bfeB4 -s 0x0bdea97cf8736a66f85283d7b0241b5cba51edd809a67af5e8971f441aa8e22b
```

### Listing OCPI modules implemented by the party

In this opt-in feature, an OCPI party can list their module implementations, so that other parties on the network
can learn which requests are supported. As the usual OCPI version endpoints cannot be used by counterparties, 
this provides a way for them to discover supported OCPI 2.2 modules.

Implementations are split into `sender` and `receiver` interfaces. For example, an EMSP may implement the `command` 
module's `sender` interface, and a CPO the `receiver` interface. Alternatively, a single `party_id` with both CPO and 
EMSP roles may implement both.

Note that as the purpose of this is to provide modules used typically used in peer-to-peer communication, not every
module is available. The following modules can be listed: cdrs, chargingprofiles, commands, locations, sessions,
tariffs, tokens.

#### Scenario 1: CPO or EMSP providing their implementations

Following [typical OCPI implementations](https://github.com/ocpi/ocpi/blob/master/terminology.asciidoc#typical-ocpi-implementations-per-role), a CPO could register their modules like so:

```
ocn-registry set-modules \
    --sender-interface cdrs locations session tariffs \
    --receiver-interface chargingprofiles commands tokens
```

Whereas an EMSP may register the following modules:

```
ocn-registry set-modules \
    --sender-interface commands tokens \
    --receiver-interface locations sessions tariffs
```

#### Scenario 2: CPO and EMSP providing combined implementations

In the case that a `party_id` implements multiple OCPI roles, both sets of interfaces can be listed.
When sending a request to either interface, the OCN Node of the recipient will know which interface it should
be forwarded to. 

```
ocn-registry set-modules \ 
    --sender-interface commands cdrs locations \
    --receiver-interface commands cdrs locations
```

Updating modules is done by the same command and can also be used to remove all listed modules (by providing
none):

```
ocn-registry set-modules 
```

Raw transactions can also be used:

```
ocn-registry set-modules-raw
```

### De-listing a party

Use the following command to remove a party listing from the registry:

```
ocn-registry delete-party
```

And with raw transaction:

```
ocn-registry delete-party-raw
```

### Get all Apps' details

```
ocn-registry list-apps
```

### Get a specific App's details

Use the positional argument for the provider of the App: the Ethereum address of the owner.

```
ocn-registry get-app {{PROVIDER}}
```

### List an App

Ensure that before adding an App to the Registry, the owner of the App is listed as an OCPI party.

To add an App, use the `set-app` command. Note that the name and URL are optional - their aim is
to provide more information for potential customers:

```
ocn-registry set-app --name {{NAME_OF_APP}} --url {{SOME_URL}} --permissions FORWARD_SENDER
```

[Full list of permissions](Permissions.md)

### Delete an App

use the following command to remove an APP from the Registry

```
ocn-registry delete-app
```

And with raw transaction:

```
ocn-registry delete-app-raw
```

### Get App agreements for a user

To list all agreements for a particular user, using their address or OCPI credentials
(`country_code` and `party_id`):

```
ocn-registry get-agreements -a {{ADDRESS}}
```
or
```
ocn-registry get-agreements -c DE MSP
```

### Agree to an App permissions

As an App user, agree to an App's permissions using the `set-agreement` command. The positional
provider argument is the App owner's Ethereum address (their identity on the OCN).

```
ocn-registry set-agreement {{PROVIDER}}
```

### Revoke an App Permissions

App user can revoke an App's permissions using the `revoke-agreement` command. The positional
provider argument is the App owner's Ethereum address (their identity on the OCN).

```
ocn-registry revoke-agreement {{PROVIDER}}
```


---

## [TypeScript Library](#typescript-library)

```
npm install @shareandcharge/registry
```

In your project source file, import the registry:

TypeScript:

```ts
import { Registry, Permissions } from "@shareandcharge/registry"
```
JavaScript:

```js
const Registry = require("@shareandcharge/registry").Registry
const Permissions = require("@shareandcharge/registry").Permissions
```

Then, instantiate each class with the required environment (`"local"` or `"volta"`). Optionally set the signer to gain
access to write methods on the contract:

```ts
const registryReadOnly = new Registry("local")
console.log(registryReadOnly.mode)
// "r"

const permissionsReadWrite = new Permissions("local", "0xbe367b774603c65850ee2cf479df809174f95cdb847483db2a6bcf1aad0fa5fd")
console.log(permissionsReadWrite.mode)
// "r+w"
```

And use the contract:

```ts
registryReadOnly.getAllNodes().then(console.log)

permissionsReadWrite.setApp("My Awesome App", "https://my.awesome.app", [1, 2]).then(console.log)
```

---

## [Java Library](#java-library)

Auto-generated Java libraries are provided in `./java`.

Copy to a project's sourcepath, then connect using Web3j:

```kotlin
import snc.openchargingnetwork.contracts.Registry
import snc.openchargingnetwork.contracts.Permissions
import org.web3j.protocol.Web3j
import org.web3j.protocol.http.HttpService
import org.web3j.tx.ClientTransactionManager
import org.web3j.tx.gas.StaticGasProvider
```

```kotlin
val web3 = Web3j.build(HttpService("http://localhost:8544"))
val txManager = ClientTransactionManager(web3, "0x9bC1169Ca09555bf2721A5C9eC6D69c8073bfeB4")
val gasProvider = StaticGasProvider(0.toBigInteger(), 10000000.toBigInteger())
val registry = Registry.load(contractAddress, web3, txManager, gasProvider)
val permissions = Permissions.load(contractAddress, web3, txManager, gasProvider)
```

And use it:
```kotlin
val tx = registry.setNode("https://node.provider.net").sendAsync().get()
val tx2 = permissions.setApp("Awesome App", "https://awesome.app", listOf(1, 2)).sendAsync().get()
```

---

## Development

Clone and install dependencies:

```
git clone https://bitbucket.org/shareandcharge/ocn-registry.git
cd ocn-registry
npm install
```

Run Ganache for your local development blockchain:

```
npm run ganache
```

Ensure tests are working as expected:

```
npm test
```

### Migrating contracts

Initial deployment of the smart contracts (STAGE defaults to "local" - see `truffle.js` for more options):

```
npm migrate --network={{STAGE}}
```

Publish new contract definitions:

```
node bin/publish.js {{STAGE}}
```

The contract definitions are now available to be used in `./contract.defs.{{STAGE}}.json`.

### Updating contract wrappers

The Java wrapper can be updated using `web3j`:

```
npm run compile
web3j truffle generate ./build/contracts/Registry.json -o ./java -p snc.openchargingnetwork.contracts
web3j truffle generate ./build/contracts/Permissions.json -o ./java -p snc.openchargingnetwork.contracts
```

### Publishing new versions

Build the TypeScript library:

```
npm run build
```

Bump the version number (see https://docs.npmjs.com/cli/version for more):

```
npm version patch 
```

Publish:

```
npm publish
```

## Docker

TODO: update for Permissions contract.

You may also use Docker to aid development of other services using the registry. Simply run 
`docker-compose up` to start ganache and have the contracts deployed automatically. The registry 
contract will always have the same owner and address:

- **Address**: `0x345cA3e014Aaf5dcA488057592ee47305D9B3e10`
- **Owner**: `0x627306090abaB3A6e1400e9345bC60c78a8BEf57`

If you make changes to the contracts, run `docker-compose --build`. This will ensure that the
above is true, giving you the same address.

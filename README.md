# Open Charging Network Registry

Decentralized Registry smart contracts for Node operators, OCPI party and Service providers. For Ethereum-based networks.

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

### Node Operators and OCPI Parties

The principle behind the registry is that the nodes, comprising the Open Charging Network, need a way of discovering
counterparties they are not directly connected to. This works in two stages: OCN Node operators (i.e. administrators)
can list their node in the registry, which allows OCPI parties (i.e. Charge Point Operators or E-Mobility Service
Providers) to link their services to a registered node.

Note that the registry listing must be done by the OCPI party before an OCN Node accepts their credentials
registration, so that the OCN Node can ensure the party has correctly linked themselves to that node in the registry.

### Service Providers and Users

An OCN Service is an OCPI party that requires additional permissions from their customers. We make this distinction
from other "Services" that might only require customers to send OCPI messages (including custom OCPI modules) directly.
Such permissions could include the forwarding of session or charge detail record data, for example in a payment
service. Once a customer/user has agreed to the Service's permissions, the OCN Node tied to the customer will automate
any such required permissions, lessening the cost of integration with a service.

OCN Services are first and foremost OCPI parties - they must be listed in the Registry smart contract. To be granted
the aforementioned permissions, such a party must then list their service and the permissions required in a separate
smart contract, entitled "Permissions". Thereafter, a user can make their agreement explicit in the same smart
contract.

#### Example OCPI Party connection steps:

1. Operator signs a transaction stating they run the OCN Node on domain `https://node.ocn.org`. The address of their
wallet (`0x9bC1169Ca09555bf2721A5C9eC6D69c8073bfeB4`), used to sign the transaction, now points to the domain name.

2. OCPI party signs a transaction stating they use the OCN Node of `0x9bC1169Ca09555bf2721A5C9eC6D69c8073bfeB4`. The
address of their wallet, (`0x0B2E57DDB616175950e65dE47Ef3F5BA3bc29979`) now points to the wallet address of their
OCN Node operator.

3. OCPI party does the credentials registration handshake with the OCN Node at `https://node.ocn.org`.

4. Party is now able to send and receive OCPI requests from other OCPI parties on the network. Likewise, they gain
access to the setting of Service permissions.

---

## Usage

There are several ways to interact with the OCN Registry, including:

- [CLI](#cli)
- [TypeScript Library](#typescript-library)
- [Java Library](#java-library)

---

## [Command Line Interface](#cli)

### Getting started

Install the registry npm package:

```
npm install -g @shareandcharge/ocn-registry
```

Alternatively, it is possible to clone this repository:

```
git clone https://bitbucket.org/shareandcharge/ocn-registry.git
cd ocn-registry
npm install
```

### Basic Usage

To make sure your installation is correctly working, verify with the following command, which will
print the version number:
```
$ ocn-registry --version
1.0.0
```

If the repository has been cloned instead, the CLI can be accessed via `npx`:
```
$ npx ts-node src/cli --version
1.0.0
```

For the remainder of the documentation, it will be assumed that the CLI npm package has been installed globally.

#### Getting Help

The CLI and all of its sub-commands have help text relating to usage. The top-level help flag prints all possible
sub-commands which can be used:

```
$ ocn-registry --help
[...]

Commands:
  cli get-node <address>               Get OCN Node operator entry by their
                                       wallet address
  cli list-nodes                       Get all OCN Nodes listed in registry

[...]
```

Meanwhile, using the help flag on a particular sub-command will show more detailed information:
```
$ ocn-registry get-party --help
[...]

Options:
  --network, --net, -n  Specifies the target network.
                          [choices: "local", "volta", "prod"] [default: "local"]
  --address, -a         Wallet address of the party                     [string]
  --credentials, -c     OCPI country_code (ISO-3166 alpha-2) and party_id
                        (ISO-15118)                                      [array]

[...]
```

#### Setting the signer

The private keys of the signer (and optionally spender) are needed for each transaction (modifying state of the
contract). Think of this like setting your credentials for a cloud infrastructure provider's CLI (where an
environment variable like `AWS_ACCESS_KEY` dictates to the AWS CLI which user/role is accessing assets). Note that
contract calls (i.e. reading data) do not require this as data is public.

Setting this can be done in two ways: environment variables or command line flags.

The first method allows all subsequent commands to use the same value for signer/spender. This also means that
it is not necessary to state the signer with a command line flag.

Use `export` on Linux/MacOS to set your shell variables:

```
export SIGNER=0xbe367b774603c65850ee2cf479df809174f95cdb847483db2a6bcf1aad0fa5fd
```

If using a raw command, the spender is also required:

```
export SENDER=0x2f0810c5fc949c846ff64edb26b0b00ca28effaffb9ac867a7b9256c034fe849
```

**Important: do not use these private keys outside of development! They were generated for this guide only.**

Alternatively, flags allow setting the signer and spender for each command:

```
Transactions:
  --signer, -s   Data owner's private key. Required for modifying contract
                 state.                                                 [string]
  --spender, -x  Spender's private key. Required for sending raw transactions.
                                                                        [string]
```


#### Choosing the network

By default, the registry will look for a local ganache instance running on `http://localhost:8544`. This is the
development chain which can be started with `npm run ganache`. This also provides 20 funded keypairs to play around
with (they are generated from a mnemonic, so won't change between restarts).

Each command can be run against additional networks on which the OCN Registry has been deployed using the `-n` flag.
This includes [Volta](https://energyweb.atlassian.net/wiki/spaces/EWF/pages/702677023/Chain+Volta+Test+Network),
for the OCN public test environment, as well as the
[Energy Web Chain](https://energyweb.atlassian.net/wiki/spaces/EWF/pages/718078071/Chain+Energy+Web+Chain+Production+Network)
for production.

Additionally, overrides can be provided to change default network variables. A JSON network file can be specified
to tell the CLI of custom variables we want to use over defaults. A common situation where we might need this is in
a local development setup using docker-compose, where we need to modify the host to point to a container's IP in our
docker network.

A network file should implement the `Network` interface in [`src/types/network.ts`](./src/types/network.ts), though it
is not necessary to provide every field. For example, in the aforementioned docker-compose setup, we could override
only the provider host in our JSON file:
```json
{
    "provider": {
        "host": "172.16.238.20"
    }
}
```

We would then use the CLI by specifying our JSON file with the `--network-file` flag, which can be absolute or
relative to the current working directory:
```
ocn-registry list-nodes --network-file ./overrides.json
```

In this case, we are using the rest of the fields from the default `local` environment. We could do the
same with the test (volta) network:
```
ocn-registry list-nodes --network volta --network-file /path/to/overrides-volta.json
```

For a list of defaults for each network, see [`src/networks.ts`](./src/networks.ts).

### Get an operator's node

To check the domain of a single node operator on a particular network, use:

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

OCN Node operators can make their node visible on the network by adding it to the OCN Registry. Creating and updating a listing can be done using the same command. 

**Note**: If changing the domain of an existing operator, call `delete-node` before `set-node` (see [issue #8](https://bitbucket.org/shareandcharge/ocn-registry/issues/8/))

```
ocn-registry set-node https://node.provider.net
```

Alternatively, using a raw transaction:

```
ocn-registry set-node-raw https://node.provider.net
```

Remember to set the signer AND spender for the raw transaction. If not using environment variables, set with the following flags:

```
ocn-registry set-node-raw https://node.provider.net \
        --signer=0xbe367b774603c65850ee2cf479df809174f95cdb847483db2a6bcf1aad0fa5fd \
        --spender=0x2f0810c5fc949c846ff64edb26b0b00ca28effaffb9ac867a7b9256c034fe849
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
ocn-registry get-party --address 0x0B2E57DDB616175950e65dE47Ef3F5BA3bc29979
ocn-registry get-party --credentials CH CPO
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
ocn-registry set-party --credentials CH CPO \
    --roles CPO \
    --operator 0x9bC1169Ca09555bf2721A5C9eC6D69c8073bfeB4
```

Using a raw transaction:
```
ocn-registry set-party-raw --credentials CH CPO
    --roles CPO \
    --operator 0x9bC1169Ca09555bf2721A5C9eC6D69c8073bfeB4
```

#### Scenario 2: party_id with multiple roles

```
ocn-registry set-party --credentials CH ABC \
    -roles CPO EMSP \
    --operator 0x9bC1169Ca09555bf2721A5C9eC6D69c8073bfeB4
```

#### Scenario 3: platform with multiple roles under different `party_id`s

In this case, the platform must use different wallets for each `party_id`:

```
ocn-registry set-party --credentials CH CPO \
    --roles CPO \
    --operator 0x9bC1169Ca09555bf2721A5C9eC6D69c8073bfeB4 \
    --signer 0xd37f60f3a7c78a72d24e50b9105879c89d249e299699ba762d890276dea73fea
```
```
ocn-registry set-party --credentials CH MSP \
    --roles EMSP \
    --operator 0x9bC1169Ca09555bf2721A5C9eC6D69c8073bfeB4 \
    --signer 0x0bdea97cf8736a66f85283d7b0241b5cba51edd809a67af5e8971f441aa8e22b
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

### Get all services' details

```
ocn-registry list-services
```

### Get a specific service's details

Use the positional argument for the provider of the Service (the Ethereum address of the owner):

```
ocn-registry get-service 0x9bC1169Ca09555bf2721A5C9eC6D69c8073bfeB4
```

### List a service

Ensure that before adding a service to the Registry, the owner of the Service is listed as an OCPI party.

To add a Service, use the `set-service` command. Note that the name and URL are optional - their aim is
to provide more information for potential customers.

Warning: you may encounter errors with names containing spaces. You can run this command as many times
as necessary - it will always overwrite your current entry.

```
ocn-registry set-service --name 'Smart Payment Service' \
    --url https://smart.payment.service \
    --permissions FORWARD_SENDER
```

The `--permissions` flag takes an array of permissions. For example, the following would require
all requests sent to the receiver interfaces of the `sessions` and `cdrs` module to be forwarded
to the service:
```
--permissions FORWARD_SESSIONS_RECEIVER FORWARD_CDRS_RECEIVER
```

See the [full list of permissions](Permissions.md) for more. These are the permissions
which the OCN Node has currently implmented, but this list can be expanded in the future.

Note that this list is also available from the command line:
```
ocn-registry set-service --help
```

### Delete a service

use the following command to remove a service from the Registry

```
ocn-registry delete-service
```

### Get service agreements for a user

To list all agreements for a particular user, using their address or OCPI credentials
(`country_code` and `party_id`):

```
ocn-registry get-agreements --address 0x9bC1169Ca09555bf2721A5C9eC6D69c8073bfeB4
```
or
```
ocn-registry get-agreements --credentials DE MSP
```

### Agree to service permissions

As a service user, agree to a service's permissions using the `set-agreement` command. The positional
provider argument is the Service owner's Ethereum address (their identity on the OCN).

```
ocn-registry set-agreement 0x9bC1169Ca09555bf2721A5C9eC6D69c8073bfeB4
```

### Revoke service permissions

Service user can revoke a service's permissions using the `revoke-agreement` command. The positional
provider argument is the Service owner's Ethereum address (their identity on the OCN).

```
ocn-registry revoke-agreement 0x9bC1169Ca09555bf2721A5C9eC6D69c8073bfeB4
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

permissionsReadWrite.setService("My Awesome Service", "https://my.awesome.service", [1, 2]).then(console.log)
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
val tx2 = permissions.setService("Awesome Service", "https://awesome.service", listOf(1, 2)).sendAsync().get()
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

Optionally, tag as "stable":

```
npm dist-tag add @shareandcharge/ocn-registry@<version> stable
```

## Docker

You may also use Docker to aid development of other services using the registry. Simply run
`docker-compose up` to start ganache and have the contracts deployed automatically. The registry and permissions contract will always have the same owner and addresses:

- **Registry Address**: `0x345cA3e014Aaf5dcA488057592ee47305D9B3e10`
- **Permissions Address**: `0xf25186b5081ff5ce73482ad761db0eb0d25abfbf`
- **Owner**: `0x627306090abaB3A6e1400e9345bC60c78a8BEf57`

If you make changes to the contracts, run `docker-compose --build`. This will ensure that the
above is true, giving you the same address.

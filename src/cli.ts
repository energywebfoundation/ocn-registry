#!/usr/bin/env node

/*
    Copyright 2019-2020 eMobilify GmbH

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

import yargs from "yargs"
import { Registry } from "./lib/registry"
import { getPartyBuilder, setPartyBuilder, setPartyModulesBuilder, setServiceBuilder, providerBuilder } from "./cli/builders"
import { PartyDetails, Role, Module, Permission, Service } from "./lib/types"
import { networks } from "./networks"
import { Permissions } from "./lib/permissions"
import { getOverrides } from "./lib/helpers"

yargs
    .option("network", {
        alias: ["net", "n"],
        choices: Object.keys(networks),
        describe: "Specifies the target network.",
        default: "local"
    })
    .option("network-file", {
        alias: ["net-file", "nf"],
        string: true,
        describe: "Specify a custom JSON network file instead of a default network."
    })
    .option("signer", {
        alias: "s",
        string: true,
        describe: "Data owner's private key. Required for modifying contract state.",
    })
    .option("spender", {
        alias: "x",
        string: true,
        describe: "Spender's private key. Required for sending raw transactions."
    })
    .command("get-node <address>", "Get OCN Node operator entry by their wallet address", () => {}, async (args) => {
        const registry = new Registry(args.network, undefined, getOverrides(args["network-file"]))
        const result = await registry.getNode(args.address as string)
        console.log(result || "Node operator not listed in registry.")
    })
    .command("list-nodes", "Get all OCN Nodes listed in registry", () => {}, async (args) => {
        const registry = new Registry(args.network, undefined, getOverrides(args["network-file"]))
        const result = await registry.getAllNodes()
        console.log(JSON.stringify(result, null, 2))
    })
    .command("set-node <domain>", "Create or update OCN Node operator entry", () => {}, async (args) => {
        const signer = process.env.SIGNER || args.signer
        const registry = new Registry(args.network, signer, getOverrides(args["network-file"]))
        const result = await registry.setNode(args.domain as string)
        console.log(result)
    })
    .command("set-node-raw <domain>", "Create or update OCN Node operator entry using raw transaction", () => {}, async (args) => {
        const signer = process.env.SIGNER || args.signer
        const spender = process.env.SPENDER || args.spender
        const registry = new Registry(args.network, spender, getOverrides(args["network-file"]))
        const result = await registry.setNodeRaw(args.domain as string, signer as string)
        console.log(result)
    })
    .command("delete-node", "Delete OCN Node operator entry", () => {}, async (args) => {
        const signer = process.env.SIGNER || args.signer
        const registry = new Registry(args.network, signer, getOverrides(args["network-file"]))
        const result = await registry.deleteNode()
        console.log(result)
    })
    .command("delete-node-raw", "Delete OCN Node operator entry using raw transaction", () => {}, async (args) => {
        const signer = process.env.SIGNER || args.signer
        const spender = process.env.SPENDER || args.spender
        const registry = new Registry(args.network, spender, getOverrides(args["network-file"]))
        const result = await registry.deleteNodeRaw(signer as string)
        console.log(result)
    })
    .command("get-party", "Get OCPI party entry listed in the registry", getPartyBuilder, async (args) => {
        const registry = new Registry(args.network, undefined, getOverrides(args["network-file"]))
        let result: PartyDetails | undefined
        if (args.address) {
            result = await registry.getPartyByAddress(args.address as string)
        } else {
            const [countryCode, partyId] = args.credentials as string[]
            result = await registry.getPartyByOcpi(countryCode, partyId)
        }
        console.log(result ? JSON.stringify(result, null, 2) : "OCPI Party not listed in registry.")
    })
    .command("list-parties", "List all OCPI parties listed in registry", () => {}, async (args) => {
        const registry = new Registry(args.network, undefined, getOverrides(args["network-file"]))
        const result = await registry.getAllParties()
        console.log(JSON.stringify(result, null, 2))
    })
    .command("set-party", "Create or update OCPI party entry", setPartyBuilder, async (args) => {
        const signer = process.env.SIGNER || args.signer
        const registry = new Registry(args.network, signer, getOverrides(args["network-file"]))
        const [countryCode, partyId] = args.credentials as string[]
        const roles: Role[] = Array.from(new Set(args.roles as string[])).map(role => Role[role])
        const result = await registry.setParty(countryCode, partyId, roles, args.operator as string)
        console.log(result)
    })
    .command("set-party-raw", "Create or update OCPI party entry using raw transaction", setPartyBuilder, async (args) => {
        const signer = process.env.SIGNER || args.signer
        const spender = process.env.SPENDER || args.spender
        const registry = new Registry(args.network, spender, getOverrides(args["network-file"]))
        const [countryCode, partyId] = args.credentials as string[]
        const roles: Role[] = Array.from(new Set(args.roles as string[])).map(role => Role[role])
        const result = await registry.setPartyRaw(countryCode, partyId, roles, args.operator as string, signer as string)
        console.log(result)
    })
    .command(["set-party-modules", "set-modules"], "Set OCPI module implementations for an OCPI party", setPartyModulesBuilder, async (args) => {
        const signer = process.env.SIGNER || args.signer
        const registry = new Registry(args.network, signer, getOverrides(args["network-file"]))
        const sender: Module[] = Array.from(new Set(args.si as string[] || [])).map(mod => Module[mod])
        const receiver: Module[] = Array.from(new Set(args.ri as string[] || [])).map(mod => Module[mod])
        const result = await registry.setPartyModules(sender, receiver)
        console.log(result)
    })
    .command(["set-party-modules-raw", "set-modules-raw"], "Set OCPI module implementations for an OCPI party using raw transaction", setPartyModulesBuilder, async (args) => {
        const signer = process.env.SIGNER || args.signer
        const spender = process.env.SPENDER || args.spender
        const registry = new Registry(args.network, spender, getOverrides(args["network-file"]))
        const sender: Module[] = Array.from(new Set(args.si as string[] || [])).map(mod => Module[mod])
        const receiver: Module[] = Array.from(new Set(args.ri as string[] || [])).map(mod => Module[mod])
        const result = await registry.setPartyModulesRaw(sender, receiver, signer as string)
        console.log(result)
    })
    .command("delete-party", "Remove OCPI party entry", () => {}, async (args) => {
        const signer = process.env.SIGNER || args.signer
        const registry = new Registry(args.network, signer, getOverrides(args["network-file"]))
        const result = await registry.deleteParty()
        console.log(result)
    })
    .command("delete-party-raw", "Remove OCPI party entry by raw transaction", () => {}, async (args) => {
        const signer = process.env.SIGNER || args.signer
        const spender = process.env.SPENDER || args.spender
        const registry = new Registry(args.network, spender, getOverrides(args["network-file"]))
        const result = await registry.deletePartyRaw(signer as string)
        console.log(result)
    })
    .command("get-service <provider>", "Retrieve service details and required permissions", providerBuilder, async (args) => {
        const permissions = new Permissions(args.network, undefined, getOverrides(args["network-file"]))
        const result = await permissions.getService(args.provider as string)
        console.log(result ? JSON.stringify(result, null, 2) : "Provider has no Service listed")
    })
    .command("list-services", "List all registered services", () => {}, async (args) => {
        const permissions = new Permissions(args.network, undefined, getOverrides(args["network-file"]))
        const result = await permissions.getAllServices()
        console.log(JSON.stringify(result, null, 2))
    })
    .command("set-service", "Add or update an OCN Service's details", setServiceBuilder, async (args) => {
        const signer = process.env.SIGNER || args.signer
        const permissions = new Permissions(args.network, signer, getOverrides(args["network-file"]))
        const needs: Permission[] = Array.from(new Set(args.permissions as string[])).map((permission) => Permission[permission])
        const result = await permissions.setService(args.name as string, args.url as string, needs)
        console.log(result)
    })
    .command("set-service-raw", "Add or update an OCN Service's details via raw transaction", setServiceBuilder, async (args) => {
        const signer = process.env.SIGNER || args.signer
        const spender = process.env.SPENDER || args.spender
        const permissions = new Permissions(args.network, spender, getOverrides(args["network-file"]))
        const needs: Permission[] = Array.from(new Set(args.permissions as string[])).map((permission) => Permission[permission])
        const result = await permissions.setServiceRaw(args.name as string, args.url as string, needs, signer as string)
        console.log(result)
    })
    .command("delete-service", "Delete OCN Service's details", () => {}, async (args) => {
        const signer = process.env.SIGNER || args.signer
        const permissions = new Permissions(args.network, signer, getOverrides(args["network-file"]))
        const result = await permissions.deleteService()
        console.log(result)
    })
    .command("delete-service-raw", "Detele OCN Service's details via raw transaction", () => {}, async (args) => {
        const signer = process.env.SIGNER || args.signer
        const spender = process.env.SPENDER || args.spender
        const permissions = new Permissions(args.network, spender, getOverrides(args["network-file"]))
        const result = await permissions.deleteServiceRaw(signer as string)
        console.log(result)
    })
    .command("get-agreements", "Lists the services used by a given user", getPartyBuilder, async (args) => {
        const permissions = new Permissions(args.network, undefined, getOverrides(args["network-file"]))
        let result: Service[]
        if (args.address) {
            result = await permissions.getUserAgreementsByAddress(args.address as string)
        } else {
            const [countryCode, partyId] = args.credentials as string[]
            result = await permissions.getUserAgreementsByOcpi(countryCode, partyId)
        }
        console.log(JSON.stringify(result, null, 2))
    })
    .command("set-agreement <provider>", "Create an agreement with a particular service provider", providerBuilder, async (args) => {
        const signer = process.env.SIGNER || args.signer
        const permissions = new Permissions(args.network, signer, getOverrides(args["network-file"]))
        const result = await permissions.createAgreement(args.provider as string)
        console.log(result)
    })
    .command("set-agreement-raw <provider>", "Create an agreement with a particular service provider via raw transaction", providerBuilder, async (args) => {
        const signer = process.env.SIGNER || args.signer
        const spender = process.env.SPENDER || args.spender
        const permissions = new Permissions(args.network, spender, getOverrides(args["network-file"]))
        const result = await permissions.createAgreementRaw(args.provider as string, signer as string)
        console.log(result)
    })
    .command("revoke-agreement <provider>", "Revoke an agreement with a particular service provider", () => {} , async (args) => {
        const signer = process.env.SIGNER || args.signer
        const permissions = new Permissions(args.network, signer, getOverrides(args["network-file"]))
        const result = await permissions.revokeAgreement(args.provider as string)
        console.log(result)
    })
    .command("revoke-agreement-raw <provider>", "Revoke an agreement with a particular service provider via raw transaction", () => {}, async (args) => {
        const signer = process.env.SIGNER || args.signer
        const spender = process.env.SPENDER || args.spender
        const permissions = new Permissions(args.network, spender, getOverrides(args["network-file"]))
        const result = await permissions.revokeAgreementRaw(args.provider as string, signer as string)
        console.log(result)
    })
    .completion()
    .group(["version", "help"], "Information:")
    .group(["signer", "spender"], "Transactions:")
    .help()
    .parse()

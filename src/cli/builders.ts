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

import * as yargs from "yargs"

export const getPartyBuilder = (context: yargs.Argv) => {
    context
        .example("get-party -a 0x9bC11...bfeB4", "Get a party by its wallet address")
        .example("get-party -c DE CPO", "Get a party by its OCPI country_code and party_id")
        .option("address", {
            alias: "a",
            string: true,
            conflicts: "credentials",
            describe: "Wallet address of the party"
        })
        .option("credentials", {
            alias: "c",
            array: true,
            nargs: 2,
            conflicts: "address",
            describe: "OCPI country_code (ISO-3166 alpha-2) and party_id (ISO-15118)"
        })
        .check((argv, _) => {
            if (!argv.address && !argv.credentials) {
                throw Error("Expected one of the following arguments: address, ocpi")
            }
            return true
        })
}

export const setPartyBuilder = (context: yargs.Argv) => {
    context
        .option("credentials", {
            alias: "c",
            array: true,
            nargs: 2,
            required: true,
            describe: "OCPI country_code (ISO-3166 alpha-2) and party_id (ISO-15118)"
        })
        .option("roles", {
            alias: "r",
            array: true,
            choices: ["CPO", "EMSP", "HUB", "NAP", "NSP", "OTHER", "SCSP"],
            required: true,
            describe: "OCPI roles implemented by party."
        })
        .options("operator", {
            alias: "o",
            string: true,
            required: true,
            describe: "Wallet address of operator of OCN Node used by OCPI party"
        })
}

export const setPartyModulesBuilder = (context: yargs.Argv) => {
    context
        .option("sender-interface", {
            alias: "si",
            array: true,
            choices: ["cdrs", "chargingprofiles", "commands", "locations", "sessions", "tariffs", "tokens"],
            describe: "OCPI module sender interface implementations."
        })
        .option("receiver-interface", {
            alias: "ri",
            array: true, 
            choices: ["cdrs", "chargingprofiles", "commands", "locations", "sessions", "tariffs", "tokens"],
            describe: "OCPI module receiver interface implementations."
        })
}

export const setServiceBuilder = (context: yargs.Argv) => {
    context
        .option("name", {
            string: true,
            default: "",
            describe: "Name of the Service"
        })
        .option("url", {
            alias: "u",
            string: true,
            default: "",
            describe: "Public URL where users can find further information."
        })
        .option("permissions", {
            alias: "p",
            array: true,
            choices: ["FORWARD_ALL", "FORWARD_ALL_SENDER", "FORWARD_ALL_RECEIVER", "FORWARD_MODULE_LOCATIONS_SENDER", "FORWARD_MODULE_LOCATIONS_RECEIVER", "FORWARD_MODULE_SESSIONS_SENDER", "FORWARD_MODULE_SESSIONS_RECEIVER", "FORWARD_MODULE_CDRS_SENDER", "FORWARD_MODULE_CDRS_RECEIVER", "FORWARD_MODULE_TARIFFS_SENDER", "FORWARD_MODULE_TARIFFS_RECEIVER", "FORWARD_MODULE_TOKENS_SENDER", "FORWARD_MODULE_TOKENS_RECEIVER", "FORWARD_MODULE_COMMANDS_SENDER", "FORWARD_MODULE_COMMANDS_RECEIVER", "FORWARD_MODULE_CHARGINGPROFILES_SENDER", "FORWARD_MODULE_CHARGINGPROFILES_RECEIVER"],
            describe: "List of required permissions that the Service needs."
        })
}

export const providerBuilder = (context: yargs.Argv) => {
    context
        .positional("provider", {
            describe: "Address of the Service provider the agreement should be for"
        })
}
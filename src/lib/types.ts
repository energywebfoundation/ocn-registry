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

export interface Node {
    operator: string
    url: string
}

export interface PartyDetails {
    countryCode: string
    partyId: string
    address: string
    roles: Role[]
    modules: {
        sender: Module[]
        receiver: Module[]
    }
    node: Node
}

export enum Role {
    CPO,
    EMSP,
    HUB,
    NAP,
    NSP,
    OTHER,
    SCSP
}

export enum Module {
    cdrs,
    chargingprofiles,
    commands,
    locations,
    sessions,
    tariffs,
    tokens
}

export interface Service {
    name: string
    url: string
    permissions: Permission[]
    provider: {
        address: string
        countryCode: string
        partyId: string
    }
}

// examples; not full list
export enum Permission {
    FORWARD_ALL,
    FORWARD_ALL_SENDER,
    FORWARD_ALL_RECEIVER,
    FORWARD_MODULE_LOCATIONS_SENDER,
    FORWARD_MODULE_LOCATIONS_RECEIVER,
    FORWARD_MODULE_SESSIONS_SENDER,
    FORWARD_MODULE_SESSIONS_RECEIVER,
    FORWARD_MODULE_CDRS_SENDER,
    FORWARD_MODULE_CDRS_RECEIVER,
    FORWARD_MODULE_TARIFFS_SENDER,
    FORWARD_MODULE_TARIFFS_RECEIVER,
    FORWARD_MODULE_TOKENS_SENDER,
    FORWARD_MODULE_TOKENS_RECEIVER,
    FORWARD_MODULE_COMMANDS_SENDER,
    FORWARD_MODULE_COMMANDS_RECEIVER,
    FORWARD_MODULE_CHARGINGPROFILES_SENDER,
    FORWARD_MODULE_CHARGINGPROFILES_RECEIVER
}

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

import { AbiItem } from "web3-utils"

export interface Provider {
    protocol: 'http' | 'https'
    host: string
    port: number
    network_id: string
    gas?: number
    gasPrice?: number
}

export interface Contract {
    abi: AbiItem[]
    address: string
    bytecode?: string
}

export interface Network {
    provider: Provider,
    contracts: Record<string, Contract>
}

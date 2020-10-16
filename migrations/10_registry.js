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
const Registry = artifacts.require("Registry")
const Permissions = artifacts.require("Permissions")

module.exports = function (deployer, network) {
    if (network === "development" || network === "docker") {
        // always deploy both new contracts
        deployer.deploy(Registry)
            .then(() => deployer.deploy(Permissions, Registry.address))
    } else if (network === "volta" || network === "prod") {
        // only deploy new Permissions contract using previously deployed Registry address (for now)
        const registryAddress = process.env.REGISTRY_ADDRESS
        if (!registryAddress) {
            throw Error("No REGISTRY_ADDRESS env var given")
        }
        console.log("Permissions contract using Registry at", registryAddress)
        deployer.deploy(Permissions, registryAddress);
    }
};

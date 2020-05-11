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

pragma solidity ^0.5.15;

import "./Registry.sol";

contract Permissions {
    // message prefix included in any signed data
    string private constant prefix = "\u0019Ethereum Signed Message:\n32";

    Registry private registry;

    struct App {
        string name;
        string url;
        uint[] permissions;
    }

    address[] public owners;

    // stores unique owners so we don't need to iterate over the array above to find out
    mapping(address => bool) private uniqueOwners;

    // app storage linked to a particular owner (must have a registry party listing)
    mapping(address => App) private apps;

    // create registry dependency using its deployed address
    constructor(address registryAddress) public {
        registry = Registry(registryAddress);
    }

    /**
     * Add or update an OCN App entry
     * @param name name of the app
     * @param url optional public url for more information
     * @param permissions array of permissions required by the app
     */
    function setApp(address owner, string memory name, string memory url, uint[] memory permissions) private  {
        // get the node operator of an OCPI party to determine if they are already in the Registry
        (address operator, ) = registry.getOperatorByAddress(owner);
        require(operator != address(0), "Trying to register an app without party listing in Registry");

        // add or overwrite app list entry for sender
        apps[owner] = App(name, url, permissions);

        // add to unique owners list if not seen before (iterating over an array is costly)
        if (uniqueOwners[owner] == false) {
            owners.push(owner);
            uniqueOwners[owner] = true;
        }
    }

    // set App using msg.sender as owner (direct transaction)
    function setApp(string memory name, string memory url, uint[] memory permissions) public {
        setApp(msg.sender, name, url, permissions);
    }

    // set App using signer as owner (raw transaction)
    function setAppRaw(
        string memory name,
        string memory url,
        uint[] memory permissions,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        bytes32 paramHash = keccak256(abi.encodePacked(name, url, permissions));
        address signer = ecrecover(keccak256(abi.encodePacked(prefix, paramHash)), v, r, s);
        setApp(signer, name, url, permissions);
    }

    // read app data
    function getApp(address owner) public view returns (
            string memory name,
            string memory url,
            uint[] memory permissions
        ) {
            name = apps[owner].name;
            url = apps[owner].url;
            permissions = apps[owner].permissions;
    }

}
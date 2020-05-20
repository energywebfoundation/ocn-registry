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

    /**
     * EVENTS
     */
    event AppUpdate(
        string name,
        string url,
        uint[] permissions,
        address provider
    );

    event AppAgreement(
        address user,
        address provider
    );
    

    /**
     * APP PROVIDERS
     */

    struct App {
        string name;
        string url;
        uint[] permissions;
    }

    address[] public providers;

    // stores unique providers/owners so we don't need to iterate over the array
    // above to check existence
    mapping(address => bool) private uniqueProviders;

    // app storage linked to a particular provider (must have a registry party listing)
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
    function setApp(address provider, string memory name, string memory url, uint[] memory permissions) private  {
        // get the node operator of an OCPI party to determine if they are already in the Registry
        (address operator, ) = registry.getOperatorByAddress(provider);
        require(operator != address(0), "Trying to register an app without party listing in Registry.");
        require(permissions.length > 0, "No permissions given.");

        // add or overwrite app list entry for sender
        apps[provider] = App(name, url, permissions);

        // add to unique owners list if not seen before (iterating over an array is costly)
        if (uniqueProviders[provider] == false) {
            providers.push(provider);
            uniqueProviders[provider] = true;
        }

        emit AppUpdate(name, url, permissions, provider);
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
    function getApp(address provider) public view returns (
            bytes2 countryCode,
            bytes3 partyId,
            string memory name,
            string memory url,
            uint[] memory permissions
        ) {
            (countryCode, partyId,,,,,) = registry.getPartyDetailsByAddress(provider);
            name = apps[provider].name;
            url = apps[provider].url;
            permissions = apps[provider].permissions;
    }

    /**
     * Delete OCN App entry
     * @param provider the app provider address (owner of the app)
     */
    function deleteApp(address provider) private {
        // check the app list entry
        require(uniqueProviders[provider] == true, "Cannot delete app that does not exist.");
        App memory details = apps[provider];

        // delete app list entry for sender
        delete apps[provider];
        uniqueProviders[provider] = false;

        emit AppUpdate("", "", details.permissions, provider);
    }

    // delete App using msg.sender as owner (direct transaction)
    function deleteApp() public {
        deleteApp(msg.sender);
    }

    // delete App using signer as owner (raw transaction)
    function deleteAppRaw(address provider, uint8 v, bytes32 r, bytes32 s) public {
        bytes32 paramHash = keccak256(abi.encodePacked(provider));
        address signer = ecrecover(keccak256(abi.encodePacked(prefix, paramHash)), v, r, s);
        deleteApp(signer);
    }

    // return list of owners
    function getProviders() public view returns (address[] memory) {
        return providers;
    }

    /**
     * APP USERS
     */

    // stores agreements (user => provider => true/false)
    mapping(address => mapping(address => bool)) private userAgreements;

    // stores agreement list (user => provider[])
    mapping(address => address[]) private providersOf;

    /**
     * Binds an app user to provider, granting the app any given permissions
     * @param user the app user addresss
     * @param provider the app provider address (owner of the app)
     */
    function createAgreement(address user, address provider) private {
        (address operator, ) = registry.getOperatorByAddress(user);
        require(operator != address(0), "App user has no party listing in Registry.");
        require(uniqueProviders[provider] == true, "Provider has no registered App.");
        require(userAgreements[user][provider] == false, "Agreement already made between user and provider.");
        userAgreements[user][provider] = true;
        providersOf[user].push(provider);

        emit AppAgreement(user, provider);
    }

    // create agreement using direct transaction
    function createAgreement(address provider) public {
        createAgreement(msg.sender, provider);
    }

    // create agreement using raw transaction
    function createAgreementRaw(address provider, uint8 v, bytes32 r, bytes32 s) public {
        bytes32 paramHash = keccak256(abi.encodePacked(provider));
        address signer = ecrecover(keccak256(abi.encodePacked(prefix, paramHash)), v, r, s);
        createAgreement(signer, provider);
    }

    /**
     * revoke agreement of app
     * @param user the app user addresss
     * @param provider the app provider address (owner of the app)
     */
    function revokeAgreement(address user, address provider) private {
        (address operator, ) = registry.getOperatorByAddress(user);
        require(operator != address(0), "App user has no party listing in Registry.");
        require(uniqueProviders[provider] == true, "Provider has no registered App.");
        require(userAgreements[user][provider] == true, "No Agreement made between user and provider.");
        userAgreements[user][provider] = false;

        emit AppAgreement(user, provider);
    }

    // revoke agreement using direct transaction
    function revokeAgreement(address provider) public {
        revokeAgreement(msg.sender, provider);
    }

    // revoke agreement using raw transaction
    function revokeAgreementRaw(address provider, uint8 v, bytes32 r, bytes32 s) public {
        bytes32 paramHash = keccak256(abi.encodePacked(provider));
        address signer = ecrecover(keccak256(abi.encodePacked(prefix, paramHash)), v, r, s);
        revokeAgreement(signer, provider);
    }

    // read provider agreements of a given user by their address
    function getUserAgreementsByAddress(address user) public view returns (address[] memory) {
        return providersOf[user];
    }

    // read provider agreements of a given user by their OCPI credentials
    function getUserAgreementsByOcpi(bytes2 countryCode, bytes3 partyId) public view returns (address[] memory) {
        address user;
        (user,,,,,) = registry.getPartyDetailsByOcpi(countryCode, partyId);
        return providersOf[user];
    }

    // get the provider agreements of a given user by their address
    function hasUserAgreementByAddress(address user, address provider) public view returns (bool) {
        return userAgreements[user][provider];
    }

    // get the provider agreements of a given user by their ocpi credentials
    function hasUserAgreementByOcpi(bytes2 countryCode, bytes3 partyId, address provider) public view returns (bool) {
        address user;
        (user,,,,,) = registry.getPartyDetailsByOcpi(countryCode, partyId);
        return userAgreements[user][provider];
    }


}
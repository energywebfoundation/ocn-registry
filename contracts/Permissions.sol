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
    event ServiceUpdate(
        string name,
        string url,
        uint[] permissions,
        address provider
    );

    event ServiceAgreement(
        address user,
        address provider
    );
    

    /**
     * SERVICE PROVIDERS
     */

    struct Service {
        string name;
        string url;
        uint[] permissions;
    }

    address[] public providers;

    // stores unique providers/owners so we don't need to iterate over the array
    // above to check existence
    mapping(address => bool) private uniqueProviders;

    // service storage linked to a particular provider (must have a registry party listing)
    mapping(address => Service) private services;

    // create registry dependency using its deployed address
    constructor(address registryAddress) public {
        registry = Registry(registryAddress);
    }

    /**
     * Add or update an OCN Service entry
     * @param name name of the service
     * @param url optional public url for more information
     * @param permissions array of permissions required by the service
     */
    function setService(address provider, string memory name, string memory url, uint[] memory permissions) private  {
        // get the node operator of an OCPI party to determine if they are already in the Registry
        (address operator, ) = registry.getOperatorByAddress(provider);
        require(operator != address(0), "Trying to register a service without party listing in Registry.");
        require(permissions.length > 0, "No permissions given.");

        // add or overwrite service list entry for sender
        services[provider] = Service(name, url, permissions);

        // add to unique owners list if not seen before (iterating over an array is costly)
        if (uniqueProviders[provider] == false) {
            providers.push(provider);
            uniqueProviders[provider] = true;
        }

        emit ServiceUpdate(name, url, permissions, provider);
    }

    // set Service using msg.sender as owner (direct transaction)
    function setService(string memory name, string memory url, uint[] memory permissions) public {
        setService(msg.sender, name, url, permissions);
    }

    // set Service using signer as owner (raw transaction)
    function setServiceRaw(
        string memory name,
        string memory url,
        uint[] memory permissions,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        bytes32 paramHash = keccak256(abi.encodePacked(name, url, permissions));
        address signer = ecrecover(keccak256(abi.encodePacked(prefix, paramHash)), v, r, s);
        setService(signer, name, url, permissions);
    }

    // read service data
    function getService(address provider) public view returns (
            bytes2 countryCode,
            bytes3 partyId,
            string memory name,
            string memory url,
            uint[] memory permissions
        ) {
            (countryCode, partyId,,,,,) = registry.getPartyDetailsByAddress(provider);
            name = services[provider].name;
            url = services[provider].url;
            permissions = services[provider].permissions;
    }

    /**
     * Delete OCN Service entry
     * @param provider the service provider address (owner of the service)
     */
    function deleteService(address provider) private {
        // check the service list entry
        require(uniqueProviders[provider] == true, "Cannot delete service that does not exist.");
        Service memory details = services[provider];

        // delete service list entry for sender
        delete services[provider];
        uniqueProviders[provider] = false;

        emit ServiceUpdate("", "", details.permissions, provider);
    }

    // delete Service using msg.sender as owner (direct transaction)
    function deleteService() public {
        deleteService(msg.sender);
    }

    // delete Service using signer as owner (raw transaction)
    function deleteServiceRaw(address provider, uint8 v, bytes32 r, bytes32 s) public {
        bytes32 paramHash = keccak256(abi.encodePacked(provider));
        address signer = ecrecover(keccak256(abi.encodePacked(prefix, paramHash)), v, r, s);
        deleteService(signer);
    }

    // return list of owners
    function getProviders() public view returns (address[] memory) {
        return providers;
    }

    /**
     * SERVICE USERS
     */

    // stores agreements (user => provider => true/false)
    mapping(address => mapping(address => bool)) private userAgreements;

    // stores agreement list (user => provider[])
    mapping(address => address[]) private providersOf;

    /**
     * Binds a service user to provider, granting the service any given permissions
     * @param user the service user addresss
     * @param provider the service provider address (owner of the service)
     */
    function createAgreement(address user, address provider) private {
        (address operator, ) = registry.getOperatorByAddress(user);
        require(operator != address(0), "Service user has no party listing in Registry.");
        require(uniqueProviders[provider] == true, "Provider has no registered Service.");
        require(userAgreements[user][provider] == false, "Agreement already made between user and provider.");
        userAgreements[user][provider] = true;
        providersOf[user].push(provider);

        emit ServiceAgreement(user, provider);
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
     * revoke agreement of service
     * @param user the service user addresss
     * @param provider the service provider address (owner of the service)
     */
    function revokeAgreement(address user, address provider) private {
        (address operator, ) = registry.getOperatorByAddress(user);
        require(operator != address(0), "Service user has no party listing in Registry.");
        require(uniqueProviders[provider] == true, "Provider has no registered Service.");
        require(userAgreements[user][provider] == true, "No Agreement made between user and provider.");
        userAgreements[user][provider] = false;

        emit ServiceAgreement(user, provider);
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
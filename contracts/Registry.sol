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

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract Registry is Ownable {
    // message prefix included in any signed data
    string private constant prefix = "\u0019Ethereum Signed Message:\n32";

    /**
     * Events
     */

    event OperatorUpdate(address indexed operator, string domain);

    event PartyUpdate(
        bytes2 countryCode,
        bytes3 partyId,
        address indexed partyAddress,
        Role[] roles,
        Module[] modulesSender,
        Module[] modulesReceiver,
        address indexed operatorAddress
    );

    event DebugPacked(bytes packed);
    event DebugHash(bytes32 hash);

    /**
     * Admin methods
     */

    // allow S&C to delete operator (e.g. if operator's private key is lost)
    function adminDeleteOperator(address operator) public onlyOwner {
        deleteNode(operator);
    }

    // allows owner of contract to overwrite an entry in the registry
    function adminDeleteParty(bytes2 countryCode, bytes3 partyId) public onlyOwner {
        address party = uniqueParties[countryCode][partyId];
        deleteParty(party);
    }

    /**
     * OCN Node Operator Listings
     */

    // address => domain name/url
    mapping(address => string) private nodeOf;

    // domain name/url => true/false
    mapping(string => bool) private uniqueDomains;

    // address => true/false
    mapping(address => bool) private uniqueOperators;

    // store operators to get list
    address[] private operators;


    /**
     * Create/Update the domain linked to a given operator (internal).
     */
    function setNode(address operator, string memory domain) private {
        require(bytes(domain).length != 0, "Cannot set empty domain name. Use deleteNode method instead.");

        // check for domain uniqueness
        require(uniqueDomains[domain] == false, "Domain name already registered.");
        uniqueDomains[domain] = true;

        // store operator if new
        if (uniqueOperators[operator] == false) {
            operators.push(operator);
        }

        // store and log new node info
        uniqueOperators[operator] = true;
        nodeOf[operator] = domain;
        emit OperatorUpdate(operator, domain);
    }

    /**
     * Direct transaction by signer to create/update their linked domain.
     */
    function setNode(string memory domain) public {
        setNode(msg.sender, domain);
    }

    /**
     * Raw transaction by signer to create/update another wallet's linked domain.
     * Requires the other wallet to have signed the same data provided.
     */
    function setNodeRaw(address operator, string memory domain, uint8 v, bytes32 r, bytes32 s) public {
        bytes32 paramHash = keccak256(abi.encodePacked(operator, domain));
        address signer = ecrecover(keccak256(abi.encodePacked(prefix, paramHash)), v, r, s);
        setNode(signer, domain);
    }

    /**
     * Removes a domain linked to a given node operator (internal).
     */
    function deleteNode(address operator) private {
        string memory domain = nodeOf[operator];
        require(bytes(domain).length > 0, "Cannot delete node that does not exist.");

        // delete node and log
        uniqueDomains[domain] = false;
        delete nodeOf[operator];
        emit OperatorUpdate(operator, "");
    }

    /**
     * Direct transaction allowing node operater to unlink their domain
     */
    function deleteNode() public {
        deleteNode(msg.sender);
    }

    /**
     * Raw transaction by signer allowing them to delete another wallet's linked domain.
     * Requires the other wallet to have signed the same data provided.
     */
    function deleteNodeRaw(address operator, uint8 v, bytes32 r, bytes32 s) public {
        bytes32 paramHash = keccak256(abi.encodePacked(operator));
        address signer = ecrecover(keccak256(abi.encodePacked(prefix, paramHash)), v, r, s);
        deleteNode(signer);
    }

    /**
     * Get the domain name of a given operator.
     */
    function getNode(address operator) public view returns (string memory) {
        return nodeOf[operator];
    }

    /**
     * Get list of node operators.
     */
    function getNodeOperators() public view returns (address[] memory) {
        return operators;
    }

    /**
     * OCPI Party Listings
     */

    enum Role {
        CPO,
        EMSP,
        HUB,
        NAP,
        NSP,
        OTHER,
        SCSP
    }

    enum Module {
        cdrs,
        chargingprofiles,
        commands,
        locations,
        sessions,
        tariffs,
        tokens
    }

    struct PartyDetails {
        bytes2 countryCode;
        bytes3 partyId;
        Role[] roles;
        PartyModules modules;
    }

    struct PartyModules {
        Module[] sender;
        Module[] receiver;
    }

    // country_code => party_id => ocpi party address
    mapping(bytes2 => mapping(bytes3 => address)) private uniqueParties;

    // ocpi party => true/false
    mapping(address => bool) private uniquePartyAddresses;

    // ocpi party => party details
    mapping(address => PartyDetails) private partyOf;

    // ocpi party => node operator
    mapping(address => address) private operatorOf;

    // store parties to get list
    address[] private parties;


    /**
     * Create/update OCPI party details and node (internal).
     */
    function setParty(address party, bytes2 countryCode, bytes3 partyId, Role[] memory roles, address operator) private {
        require(countryCode != bytes2(0), "Cannot set empty country_code. Use deleteParty method instead.");
        require(partyId != bytes3(0), "Cannot set empty party_id. Use deleteParty method instead.");
        require(roles.length > 0, "No roles provided.");
        require(operator != address(0), "Cannot set empty operator. Use deleteParty method instead.");

        // check for unique country_code and party_id combination
        address registeredParty = uniqueParties[countryCode][partyId];
        require(
            registeredParty == address(0) || registeredParty == party,
            "Party with country_code/party_id already registered under different address."
        );
        uniqueParties[countryCode][partyId] = party;

        require(bytes(nodeOf[operator]).length != 0, "Provided operator not registered.");

        if (uniquePartyAddresses[party] == false) {
            parties.push(party);
        }

        uniquePartyAddresses[party] = true;

        PartyModules memory modules;
        partyOf[party] = PartyDetails(countryCode, partyId, roles, modules);
        operatorOf[party] = operator;

        emit PartyUpdate(countryCode, partyId, party, roles, modules.sender, modules.receiver, operator);
    }

    /**
     * Direct transaction by signer to create/update OCPI party details.
     */
    function setParty(bytes2 countryCode, bytes3 partyId, Role[] memory roles, address operator) public {
        setParty(msg.sender, countryCode, partyId, roles, operator);
    }

    /**
     * Raw transaction by signer to create/update another wallet's OCPI party details.
     * Requires the other wallet to have signed the same data provided.
     */
    function setPartyRaw(
        address party,
        bytes2 countryCode,
        bytes3 partyId,
        Role[] memory roles,
        address operator,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        bytes32 paramHash = keccak256(abi.encodePacked(party, countryCode, partyId, roles, operator));
        address signer = ecrecover(keccak256(abi.encodePacked(prefix, paramHash)), v, r, s);
        require(signer == party, "Signer and provided party address different.");
        setParty(signer, countryCode, partyId, roles, operator);
    }

    /**
     * Set optional party module implementations (internal).
     */
    function setPartyModules(address party, Module[] memory sender, Module[] memory receiver) private {
        address operator = operatorOf[party];

        require(operator != address(0), "Party not registered. Use setParty method first.");
        partyOf[party].modules.sender = sender;
        partyOf[party].modules.receiver = receiver;

        PartyDetails memory details = partyOf[party];
        emit PartyUpdate(details.countryCode, details.partyId, party, details.roles, sender, receiver, operator);
    }

    /**
     * Direct transaction by signer to set their module implementations
     */
    function setPartyModules(Module[] memory sender, Module[] memory receiver) public {
        setPartyModules(msg.sender, sender, receiver);
    }

    /**
     * Raw transaction by signer to set another wallet's module implementations.
     * Requires the other wallet to have signed the same data provided.
     */
    function setPartyModulesRaw(address party, Module[] memory sender, Module[] memory receiver, uint8 v, bytes32 r, bytes32 s) public {
        bytes32 paramHash = keccak256(abi.encodePacked(party, sender, receiver));
        address signer = ecrecover(keccak256(abi.encodePacked(prefix, paramHash)), v, r, s);
        require(signer == party, "Signer and provided party address different.");
        setPartyModules(signer, sender, receiver);
    }

    /**
     * Delete OCPI party details and node (internal).
     */
    function deleteParty(address party) private {
        require(operatorOf[party] != address(0), "Cannot delete party that does not exist. No operator found for given party.");
        delete operatorOf[party];
        PartyDetails memory details = partyOf[party];
        delete uniqueParties[details.countryCode][details.partyId];
        delete partyOf[party];

        Role[] memory emptyRoles;
        Module[] memory emptyModules;
        emit PartyUpdate(details.countryCode, details.partyId, party, emptyRoles, emptyModules, emptyModules, address(0));
    }

    /**
     * Direct transaction by signer to delete OCPI party details.
     */
    function deleteParty() public {
        deleteParty(msg.sender);
    }

    /**
     * Raw transaction by signer to delete another wallet's OCPI party details.
     * Requires the other wallet to have signed the same data provided.
     */
    function deletePartyRaw(address party, uint8 v, bytes32 r, bytes32 s) public {
        bytes32 paramHash = keccak256(abi.encodePacked(party));
        address signer = ecrecover(keccak256(abi.encodePacked(prefix, paramHash)), v, r, s);
        require(signer == party, "Signer and provided party address different.");
        deleteParty(signer);
    }

    /**
     * Gets operator iformation for a given OCPI party (address).
     */
    function getOperatorByAddress(address party) public view returns (address operator, string memory domain) {
        operator = operatorOf[party];
        domain = nodeOf[operator];
    }

    /**
     * Gets operator information for a given OCPI party (country_code and party_id combination).
     */
    function getOperatorByOcpi(bytes2 countryCode, bytes3 partyId) public view returns (address operator, string memory domain) {
        address party = uniqueParties[countryCode][partyId];
        operator = operatorOf[party];
        domain = nodeOf[operator];
    }

    /**
     * Gets the party details, roles and node by the address of the party
     */
    function getPartyDetailsByAddress(address partyAddress) public view returns (
        bytes2 countryCode,
        bytes3 partyId,
        Module[] memory modulesSender,
        Module[] memory modulesReceiver,
        Role[] memory roles,
        address operatorAddress,
        string memory operatorDomain
    ) {
        PartyDetails memory details = partyOf[partyAddress];
        countryCode = details.countryCode;
        partyId = details.partyId;
        roles = details.roles;
        modulesSender = details.modules.sender;
        modulesReceiver = details.modules.receiver;
        operatorAddress = operatorOf[partyAddress];
        operatorDomain = nodeOf[operatorAddress];
    }

    /**
     * Gets the party details, roles and node by the country_code/party_id of the party
     */
    function getPartyDetailsByOcpi(bytes2 countryCode, bytes3 partyId) public view returns (
        address partyAddress,
        Role[] memory roles,
        Module[] memory modulesSender,
        Module[] memory modulesReceiver,
        address operatorAddress,
        string memory operatorDomain
    ) {
        partyAddress = uniqueParties[countryCode][partyId];
        PartyDetails memory details = partyOf[partyAddress];
        roles = details.roles;
        modulesSender = details.modules.sender;
        modulesReceiver = details.modules.receiver;
        operatorAddress = operatorOf[partyAddress];
        operatorDomain = nodeOf[operatorAddress];
    }

    /**
     * Get the list of parties registered
     */
    function getParties() public view returns (address[] memory) {
        return parties;
    }

}

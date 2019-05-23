pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract Registry is Ownable {

    // message prefix included in signatures
    string constant private prefix = "\u0019Ethereum Signed Message:\n32";

    // country_code => party_id => eth_address (identity)
    mapping(bytes2 => mapping(bytes3 => address)) private parties;

    // collection of client identities and the server they are connected to
    // eth_address (identity) => server_address
    mapping(address => string) private brokers;

    // allows owner of contract to overwrite an entry in the registry
    function adminOverwrite(bytes2 countryCode, bytes3 partyID, address identity, string memory brokerURL) public onlyOwner {
        address oldIdentity = parties[countryCode][partyID];
        parties[countryCode][partyID] = identity;
        if (identity != oldIdentity) {
            brokers[oldIdentity] = brokerURL;
        } else {
            brokers[identity] = brokerURL;
        }
    }

    // register a party/client to the S&C network
    function register(bytes2 countryCode, bytes3 partyID, string memory brokerURL, uint8 v, bytes32 r, bytes32 s) public {
        require(parties[countryCode][partyID] == address(0), "Party ID already exists in registry");
        bytes32 paramHash = keccak256(abi.encodePacked(countryCode, partyID, brokerURL));
        address signer = ecrecover(keccak256(abi.encodePacked(prefix, paramHash)), v, r, s);
        parties[countryCode][partyID] = signer;
        brokers[signer] = brokerURL;
    }

    // remove a party/client from the S&C network
    function deregister(bytes2 countryCode, bytes3 partyID, uint8 v, bytes32 r, bytes32 s) public {
        bytes32 paramHash = keccak256(abi.encodePacked(countryCode, partyID));
        address signer = ecrecover(keccak256(abi.encodePacked(prefix, paramHash)), v, r, s);
        require(parties[countryCode][partyID] == signer, "Unauthorized to remove this entry from the registry");
        parties[countryCode][partyID] = address(0);
        brokers[signer] = "";
    }

    function updateBrokerURL(bytes2 countryCode, bytes3 partyID, string memory brokerURL, uint8 v, bytes32 r, bytes32 s) public {
        bytes32 paramHash = keccak256(abi.encodePacked(countryCode, partyID, brokerURL));
        address signer = ecrecover(keccak256(abi.encodePacked(prefix, paramHash)), v, r, s);
        require(parties[countryCode][partyID] == signer, "Unauthorized to update this entry in the registry");
        brokers[signer] = brokerURL;
    }

    function addressOf(bytes2 countryCode, bytes3 partyID) public view returns (address partyAddress) {
        return parties[countryCode][partyID];
    }

    function brokerOf(address partyAddress) public view returns (string memory brokerURL) {
        return brokers[partyAddress];
    }

}

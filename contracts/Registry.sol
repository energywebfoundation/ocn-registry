pragma solidity ^0.5.14;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract Registry is Ownable {

    // message prefix which should be included in any signed data
    string constant private prefix = "\u0019Ethereum Signed Message:\n32";

    // links OCPI role to their address
    mapping(bytes2 => mapping(bytes3 => address)) private addressOf;

    // describes a node on the OCN
    struct NodeInfo {
        string url;
        address addr;
    }

    // collection of role identities and the server they are connected to
    // role identity => server information
    mapping(address => NodeInfo) private nodeOf;

    // allows owner of contract to overwrite an entry in the registry
    function adminOverwrite(bytes2 countryCode,
                            bytes3 partyID,
                            address newRoleAddress,
                            string memory newNodeURL,
                            address newNodeAddress) public onlyOwner {

        address oldNodeAddress = addressOf[countryCode][partyID];
        addressOf[countryCode][partyID] = newRoleAddress;
        nodeOf[newRoleAddress] = NodeInfo(newNodeURL, newNodeAddress);
        if (newRoleAddress != oldNodeAddress) {
            delete nodeOf[oldNodeAddress];
        }
    }

    // register a role on the S&C network
    function register(bytes2 countryCode,
                      bytes3 partyID,
                      string memory nodeURL,
                      address nodeAddress,
                      uint8 v,
                      bytes32 r,
                      bytes32 s) public {

        require(addressOf[countryCode][partyID] == address(0), "Party ID already exists in registry");
        bytes32 paramHash = keccak256(abi.encodePacked(countryCode, partyID, nodeURL, nodeAddress));
        address signer = ecrecover(keccak256(abi.encodePacked(prefix, paramHash)), v, r, s);
        addressOf[countryCode][partyID] = signer;
        nodeOf[signer] = NodeInfo(nodeURL, nodeAddress);
    }

    // remove a party/node from the S&C network
    function deregister(bytes2 countryCode,
                        bytes3 partyID,
                        uint8 v,
                        bytes32 r,
                        bytes32 s) public {

        bytes32 paramHash = keccak256(abi.encodePacked(countryCode, partyID));
        address signer = ecrecover(keccak256(abi.encodePacked(prefix, paramHash)), v, r, s);
        require(addressOf[countryCode][partyID] == signer, "Unauthorized to remove this entry from the registry");
        delete addressOf[countryCode][partyID];
        delete nodeOf[signer];
    }

    function updateNodeInfo(bytes2 countryCode,
                              bytes3 partyID,
                              string memory newNodeURL,
                              address newNodeAddress,
                              uint8 v,
                              bytes32 r,
                              bytes32 s) public {

        bytes32 paramHash = keccak256(abi.encodePacked(countryCode, partyID, newNodeURL, newNodeAddress));
        address signer = ecrecover(keccak256(abi.encodePacked(prefix, paramHash)), v, r, s);
        require(addressOf[countryCode][partyID] == signer, "Unauthorized to update this entry in the registry");
        nodeOf[signer] = NodeInfo(newNodeURL, newNodeAddress);
    }

    function partyAddressOf(bytes2 countryCode, bytes3 partyID) public view returns (address partyAddress) {
        return addressOf[countryCode][partyID];
    }

    function nodeURLOf(bytes2 countryCode, bytes3 partyID) public view returns (string memory nodeURL) {
        address roleAddress = addressOf[countryCode][partyID];
        return nodeOf[roleAddress].url;
    }

    function nodeAddressOf(bytes2 countryCode, bytes3 partyID) public view returns (address nodeAddress) {
        address roleAddress = addressOf[countryCode][partyID];
        return nodeOf[roleAddress].addr;
    }

}

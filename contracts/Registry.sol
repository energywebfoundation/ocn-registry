pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract Registry is Ownable {

    // message prefix which should be included in any signed data
    string constant private prefix = "\u0019Ethereum Signed Message:\n32";

    // links OCPI role to their address
    mapping(bytes2 => mapping(bytes3 => address)) private addressOf;

    // describes a client on the OCN
    struct ClientInfo {
        string url;
        address addr;
    }

    // collection of role identities and the server they are connected to
    // role identity => server information
    mapping(address => ClientInfo) private clientOf;

    // allows owner of contract to overwrite an entry in the registry
    function adminOverwrite(bytes2 countryCode,
                            bytes3 partyID,
                            address newRoleAddress,
                            string memory newClientURL,
                            address newClientAddress) public onlyOwner {

        address oldClientAddress = addressOf[countryCode][partyID];
        addressOf[countryCode][partyID] = newRoleAddress;
        clientOf[newRoleAddress] = ClientInfo(newClientURL, newClientAddress);
        if (newRoleAddress != oldClientAddress) {
            delete clientOf[oldClientAddress];
        }
    }

    // register a role on the S&C network
    function register(bytes2 countryCode,
                      bytes3 partyID,
                      string memory clientURL,
                      address clientAddress,
                      uint8 v,
                      bytes32 r,
                      bytes32 s) public {

        require(addressOf[countryCode][partyID] == address(0), "Party ID already exists in registry");
        bytes32 paramHash = keccak256(abi.encodePacked(countryCode, partyID, clientURL, clientAddress));
        address signer = ecrecover(keccak256(abi.encodePacked(prefix, paramHash)), v, r, s);
        addressOf[countryCode][partyID] = signer;
        clientOf[signer] = ClientInfo(clientURL, clientAddress);
    }

    // remove a party/client from the S&C network
    function deregister(bytes2 countryCode,
                        bytes3 partyID,
                        uint8 v,
                        bytes32 r,
                        bytes32 s) public {

        bytes32 paramHash = keccak256(abi.encodePacked(countryCode, partyID));
        address signer = ecrecover(keccak256(abi.encodePacked(prefix, paramHash)), v, r, s);
        require(addressOf[countryCode][partyID] == signer, "Unauthorized to remove this entry from the registry");
        delete addressOf[countryCode][partyID];
        delete clientOf[signer];
    }

    function updateClientInfo(bytes2 countryCode,
                              bytes3 partyID,
                              string memory newClientURL,
                              address newClientAddress,
                              uint8 v,
                              bytes32 r,
                              bytes32 s) public {

        bytes32 paramHash = keccak256(abi.encodePacked(countryCode, partyID, newClientURL, newClientAddress));
        address signer = ecrecover(keccak256(abi.encodePacked(prefix, paramHash)), v, r, s);
        require(addressOf[countryCode][partyID] == signer, "Unauthorized to update this entry in the registry");
        clientOf[signer] = ClientInfo(newClientURL, newClientAddress);
    }

    function partyAddressOf(bytes2 countryCode, bytes3 partyID) public view returns (address partyAddress) {
        return addressOf[countryCode][partyID];
    }

    function clientURLOf(bytes2 countryCode, bytes3 partyID) public view returns (string memory clientURL) {
        address roleAddress = addressOf[countryCode][partyID];
        return clientOf[roleAddress].url;
    }

    function clientAddressOf(bytes2 countryCode, bytes3 partyID) public view returns (address clientAddress) {
        address roleAddress = addressOf[countryCode][partyID];
        return clientOf[roleAddress].addr;
    }

}

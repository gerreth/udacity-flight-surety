// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

abstract contract FlightSuretyDataAuthorization {
    address payable private contractOwner;

    mapping(address => bool) private authorizedContracts;

    /**
     * @dev The deploying account becomes contractOwner
     */
    constructor() {
        contractOwner = msg.sender;
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /**
     * @dev Modifier that requires that the caller is authorized
     */
    modifier requireAuthorizedContract() {
        require(
            authorizedContracts[msg.sender] == true,
            "Caller is not authorized"
        );
        _;
    }

    /**
     * @dev Authorize app contract
     */
    function authorizeContract(address appContract)
        external
        requireContractOwner
    {
        authorizedContracts[appContract] = true;
    }

    /**
     * @dev Authorize app contract
     */
    function deauthorizedContract(address appContract)
        external
        requireContractOwner
    {
        delete authorizedContracts[appContract];
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./FlightSuretyDataAuthorization.sol";

contract FlightSuretyData is FlightSuretyDataAuthorization {
    using SafeMath for uint256;

    /********************************************************************************************/
    /* DATA VARIABLES
    /********************************************************************************************/

    bool private operational = true; // Blocks all state changes throughout the contract if false

    struct Airline {
        address id;
        string name;
        bool isFunded;
        uint256 funds;
    }

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address airline;
    }

    mapping(address => bool) private authorizedContracts;

    uint16 numRegisteredAirlines = 0;
    mapping(address => Airline) private airlines;

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    mapping(bytes32 => Flight) private flights;

    mapping(bytes32 => address[]) private insuranceHolders;
    mapping(bytes32 => mapping(address => uint256)) private insurances;
    mapping(address => uint256) private insuranceCredits;

    /********************************************************************************************/
    /* EVENT DEFINITIONS
    /********************************************************************************************/

    /********************************************************************************************/
    /* CONSTRUCTOR
    /********************************************************************************************/

    /**
     * @dev The deploying account becomes contractOwner
     */
    constructor(address airline, string memory name) {
        // contractOwner = msg.sender;
        // Register first airline when contract is deployed
        Airline storage newAirline = airlines[airline];
        newAirline.id = airline;
        newAirline.name = name;

        numRegisteredAirlines += 1;
    }

    /********************************************************************************************/
    /* MODIFIERS
    /********************************************************************************************/

    /**
     * @dev Modifier that requires the "operational" boolean variable to be "true"
     *      This is used on all state changing functions to pause the contract in
     *      the event there is an issue that needs to be fixed
     */
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _; // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
     * @dev Modifier that requires ...
     */
    modifier requireFundedAirline(address caller) {
        require(
            airlines[caller].isFunded,
            "Already need to be funded to participate"
        );
        _;
    }

    /**
     * @dev Modifier that requires ...
     */
    modifier requireNotAirline(address caller) {
        require(
            airlines[caller].id ==
                address(0x0000000000000000000000000000000000000000),
            "Already need to be funded to participate"
        );
        _;
    }

    /********************************************************************************************/
    /* UTILITY FUNCTIONS
    /********************************************************************************************/

    /**
     * @dev Get operating status of contract
     *
     * @return A bool that is the current operating status
     */
    function isRegisteredAirline(address airline)
        public
        view
        requireAuthorizedContract
        returns (bool)
    {
        return
            airlines[airline].id !=
            address(0x0000000000000000000000000000000000000000);
    }

    /**
     * @dev Get operating status of contract
     *
     * @return A bool that is the current operating status
     */
    // requireAuthorizedContract
    function isOperational() public view returns (bool) {
        return operational;
    }

    function isFundedAirline(address airline)
        external
        view
        requireFundedAirline(airline)
        returns (bool)
    {
        return true;
    }

    function isExistingFlight(bytes32 flightKey) external view returns (bool) {
        return flights[flightKey].isRegistered;
    }

    /**
     * @dev ...
     */
    function getNumRegisteredAirlines()
        external
        view
        requireAuthorizedContract
        returns (uint256)
    {
        return numRegisteredAirlines;
    }

    /********************************************************************************************/
    /* CONTRACT FUNCTIONS
    /********************************************************************************************/

    /**
     * @dev Sets contract operations on/off
     *
     * When operational mode is disabled, all write transactions except for this one will fail
     */
    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     */
    function getAirline(address airline)
        external
        view
        returns (
            address id,
            string memory name,
            bool isFunded,
            uint256 funds
        )
    {
        Airline memory currentAirline = airlines[airline];

        id = currentAirline.id;
        name = currentAirline.name;
        isFunded = currentAirline.isFunded;
        funds = currentAirline.funds;

        return (id, name, isFunded, funds);
    }

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     */
    function registerAirline(
        address caller,
        address airline,
        string memory name
    ) external requireAuthorizedContract requireFundedAirline(caller) {
        Airline storage newAirline = airlines[airline];
        newAirline.id = airline;
        newAirline.name = name;

        numRegisteredAirlines += 1;
    }

    function registerFlight(
        bytes32 flightKey,
        uint256 timestamp,
        address airline
    ) external requireIsOperational requireAuthorizedContract {
        Flight memory newFlight =
            Flight(true, STATUS_CODE_UNKNOWN, timestamp, airline);
        flights[flightKey] = newFlight;
    }

    function updateFlight(bytes32 flightKey, uint8 statusCode)
        external
        requireIsOperational
        requireAuthorizedContract
    {
        flights[flightKey].statusCode = statusCode;
        flights[flightKey].updatedTimestamp = block.timestamp;

        if (statusCode == STATUS_CODE_LATE_AIRLINE) {
            creditInsurees(flightKey);
        }
    }

    function getFlight(
        address airline,
        string memory flightName,
        uint256 timestamp
    ) external view requireIsOperational returns (uint8 statusCode) {
        bytes32 flightKey = getFlightKey(airline, flightName, timestamp);

        Flight memory flight = flights[flightKey];

        statusCode = flight.statusCode;

        return (statusCode);
    }

    /**
     * @dev Buy insurance for a flight
     */
    function buyInsurance(
        address caller,
        bytes32 flightKey,
        uint256 amount
    )
        external
        requireIsOperational
        requireAuthorizedContract
        requireNotAirline(caller)
    {
        require(amount > 0, "Passenger needs to provide ether");
        require(
            insurances[flightKey][caller] == 0,
            "Passenger already bought an insurance"
        );
        insurances[flightKey][caller] = amount;
        insuranceHolders[flightKey].push(caller);
    }

    /**
     *  @dev Credits payouts to insurees
     */
    function creditInsurees(bytes32 flightKey) internal {
        address[] memory insurees = insuranceHolders[flightKey];

        for (uint256 i = 0; i < insurees.length; i++) {
            address account = insurees[i];
            uint256 amount = insurances[flightKey][account];

            require(amount > 0, "Insurance already credited");

            insurances[flightKey][account].sub(amount);
            insuranceCredits[account] = insuranceCredits[account].add(
                amount.mul(3).div(2)
            );
        }
    }

    function getCredit() external view returns (uint256) {
        return insuranceCredits[msg.sender];
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     */
    function pay() external payable {
        uint256 amount = insuranceCredits[msg.sender];

        require(amount > 0, "No funds to transfer");

        insuranceCredits[msg.sender] = insuranceCredits[msg.sender].sub(amount);

        msg.sender.transfer(amount);
    }

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     */
    function fund() public payable {
        uint256 funds = airlines[msg.sender].funds;

        uint256 amount = msg.value;

        funds = funds.add(amount);

        airlines[msg.sender].funds = funds;

        if (funds >= 10 ether) {
            airlines[msg.sender].isFunded = true;
        }
    }

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
     * @dev Fallback function for funding smart contract.
     */
    receive() external payable {}

    /**
     * @dev Fallback function for funding smart contract.
     */
    fallback() external payable {
        fund();
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./FlightSuretyData.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    FlightSuretyData flightSuretyData;
    /********************************************************************************************/
    /* DATA VARIABLES
    /********************************************************************************************/

    uint256 MULTIPARTY_CONSENSUS_THRESHOLD = 4;

    address private contractOwner; // Account used to deploy contract

    mapping(address => uint256) airlineQueueVotes;
    mapping(address => mapping(address => bool)) airlineQueue;

    /********************************************************************************************/
    /* EVENTS
    /********************************************************************************************/

    event AirlineRegistered(address airline);

    event FlightRegistered(string flight, uint256 timestamp, address airline);

    event InsuranceBought(string flight, uint256 timestamp, address passenger);

    /********************************************************************************************/
    /* CONSTRUCTOR
    /********************************************************************************************/

    /**
     * @dev Contract constructor
     */
    constructor(address payable dataContract) {
        contractOwner = msg.sender;
        flightSuretyData = FlightSuretyData(dataContract);
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
        require(true, "Contract is currently not operational");
        _;
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /**
     * @dev ...
     */
    modifier isRegisteredAirline() {
        require(flightSuretyData.isRegisteredAirline(msg.sender), "");
        _;
    }

    /**
     * @dev ...
     */
    modifier requireFundedAirline() {
        require(flightSuretyData.isFundedAirline(msg.sender));
        _;
    }

    /**
     * @dev Modifier that requires that this flight exists
     */
    modifier requireExistingFlight(
        address airline,
        string memory flight,
        uint256 timestamp
    ) {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);

        require(
            flightSuretyData.isExistingFlight(flightKey),
            "Flight does not exists (for this airline)"
        );
        _;
    }

    /********************************************************************************************/
    /* UTILITY FUNCTIONS
    /********************************************************************************************/

    function isOperational() public view returns (bool) {
        return flightSuretyData.isOperational(); // Modify to call data contract's status
    }

    function isContractOwner() public view returns (bool) {
        return contractOwner == msg.sender;
    }

    /********************************************************************************************/
    /* CONTRACT FUNCTIONS
    /********************************************************************************************/

    /**
     * @dev Add an airline to the registration queue
     */
    function registerAirline(address airline, string memory name)
        external
        isRegisteredAirline
        requireFundedAirline
        returns (bool success, uint256 votes)
    {
        require(
            airlineQueue[airline][msg.sender] == false,
            "Airline already voted"
        );

        votes = 0;
        success = false;
        uint256 numRegisteredAirlines =
            flightSuretyData.getNumRegisteredAirlines();

        if (numRegisteredAirlines <= MULTIPARTY_CONSENSUS_THRESHOLD) {
            flightSuretyData.registerAirline(msg.sender, airline, name);
            success = true;
        } else {
            airlineQueue[airline][msg.sender] = true;
            votes = airlineQueueVotes[airline].add(1);

            if (votes <= numRegisteredAirlines.div(2)) {
                airlineQueueVotes[airline] = votes;
            } else {
                flightSuretyData.registerAirline(msg.sender, airline, name);
                success = true;
            }
        }

        if (success) {
            emit AirlineRegistered(airline);
        }

        return (success, 0);
    }

    /**
     * @dev Register a future flight for insuring.
     */
    function registerFlight(string memory flight, uint256 timestamp)
        external
        requireFundedAirline
    {
        bytes32 flightKey = getFlightKey(msg.sender, flight, timestamp);

        flightSuretyData.registerFlight(flightKey, timestamp, msg.sender);

        emit FlightRegistered(flight, timestamp, msg.sender);
    }

    /**
     * @dev Called after oracle has updated flight status
     */
    function processFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp,
        uint8 statusCode
    )
        internal
        requireExistingFlight(airline, flight, timestamp)
        returns (bytes32 flightKey)
    {
        flightKey = getFlightKey(airline, flight, timestamp);

        flightSuretyData.updateFlight(flightKey, statusCode);

        return (flightKey);
    }

    /**
     * @dev Generate a request for oracles to fetch flight information
     */
    function fetchFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp
    ) external requireExistingFlight(airline, flight, timestamp) {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key =
            keccak256(abi.encodePacked(index, airline, flight, timestamp));

        ResponseInfo storage responseInfo = oracleResponses[key];

        responseInfo.requester = msg.sender;
        responseInfo.isOpen = true;

        emit OracleRequest(index, airline, flight, timestamp);
    }

    function buyInsurance(
        address airline,
        string memory flight,
        uint256 timestamp
    ) public payable requireExistingFlight(airline, flight, timestamp) {
        address passenger = msg.sender;

        bytes32 flightKey = getFlightKey(airline, flight, timestamp);

        flightSuretyData.buyInsurance(passenger, flightKey, msg.value);

        emit InsuranceBought(flight, timestamp, passenger);
    }

    /********************************************************************************************/
    /*                                     ORACLE MANAGEMENT                                    */
    /********************************************************************************************/

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;

    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester; // Account that requested status
        bool isOpen; // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses; // Mapping key is the status code reported
        // This lets us group responses and identify
        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    event OracleRegistered(uint8[3] indexes);

    event OracleReport(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(
        uint8 index,
        address airline,
        string flight,
        uint256 timestamp
    );

    // Register an oracle with the contract
    function registerOracle() external payable {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({isRegistered: true, indexes: indexes});

        emit OracleRegistered(indexes);
    }

    function getMyIndexes() external view returns (uint8[3] memory) {
        require(
            oracles[msg.sender].isRegistered,
            "Not registered as an oracle"
        );

        return oracles[msg.sender].indexes;
    }

    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse(
        uint8 index,
        address airline,
        string memory flight,
        uint256 timestamp,
        uint8 statusCode
    ) external {
        require(
            (oracles[msg.sender].indexes[0] == index) ||
                (oracles[msg.sender].indexes[1] == index) ||
                (oracles[msg.sender].indexes[2] == index),
            "Index does not match oracle request"
        );

        bytes32 key =
            keccak256(abi.encodePacked(index, airline, flight, timestamp));

        require(
            oracleResponses[key].isOpen,
            "Flight or timestamp do not match oracle request"
        );

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (
            oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES
        ) {
            oracleResponses[key].isOpen = false;

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    function getInsuranceKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes(address account)
        internal
        returns (uint8[3] memory)
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while (indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while ((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex(address account) internal returns (uint8) {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random =
            uint8(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            blockhash(block.number - nonce++),
                            account
                        )
                    )
                ) % maxValue
            );

        if (nonce > 250) {
            nonce = 0; // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }
}

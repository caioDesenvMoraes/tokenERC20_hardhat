// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "./Token.sol";

contract Airdrop  {
    
    // enum
    enum Status { ACTIVE, PAUSED, CANCELLED } // mesmo que uint8

    // Properties
    address public owner;
    address public tokenAddress;
    uint256 private maxSubscribers = 5;
    address[] private subscribers;
    Status contractState; 

    // Modifiers
    modifier isOwner() {
        require(msg.sender == owner , "Sender is not owner!");
        _;
    }

    modifier isActive() {
        require(contractState == Status.ACTIVE, "the contract is not active");
        _;
    }

    modifier notCancelled() {
        require(contractState != Status.CANCELLED, "The contract is cancelled!");
        _;
    }

    // Events
    event WinnersAirdrop(address beneficiary, uint amount);
    event Kill(address owner);

    // Constructor
    constructor(address token) {
        owner = msg.sender;
        tokenAddress = token;
        contractState = Status.ACTIVE;
    }

    function getState() public notCancelled view returns(Status) {
        return contractState;
    }

    function getSubscribes() public notCancelled view returns(address[] memory) {
        return subscribers;
    }

    function getLengthSubscribes() public notCancelled view returns(uint256) {
        return subscribers.length;
    }

    function changeState(uint8 newState) public isOwner returns(bool) {

        require(newState < 3, "Invalid status option!");

        if (newState == 0) {
            require(contractState != Status.ACTIVE, "The status is already ACTIVE");
            contractState = Status.ACTIVE;
        } else if (newState == 1) {
            require(contractState != Status.PAUSED, "The status is already PAUSED");
            contractState = Status.PAUSED;
        } else {
            require(contractState != Status.CANCELLED, "The status is already CANCELLED");
            contractState = Status.CANCELLED;
        }

        return true;
    }
    
    function subscribe() public isActive returns(bool) {
        require(subscribers.length < maxSubscribers, "maximum number of addresses");
        require(hasSubscribed(msg.sender)) ;

        subscribers.push(msg.sender);

        if(subscribers.length == maxSubscribers) execute();

        return true;
    }


    // Private Functions
        function execute() private returns(bool) {

        uint256 balance = Token(tokenAddress).balanceOf(address(this));
        uint256 amountToTransfer = balance / subscribers.length;
        for (uint i = 0; i < subscribers.length; i++) {
            require(subscribers[i] != address(0));
            require(Token(tokenAddress).transfer(subscribers[i], amountToTransfer));

            emit WinnersAirdrop(subscribers[i], amountToTransfer);
        }

        return true;
    }
    
    function hasSubscribed(address subscriber) private view returns(bool) {
        for(uint256 i = 0; i < subscribers.length; i++) {
            require(subscribers[i] != subscriber, "address already registered");
        }

        return true;
    }

    // Kill
    function kill() public isOwner {
        emit Kill(owner);
        
        selfdestruct(payable(owner));

    }
}



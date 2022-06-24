// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "./Token.sol";

contract Machine {
    
    // Libs
    using Math for uint256;

    // Enums
    enum Status { ACTIVE, PAUSED, CANCELLED }

    // Events
    event Bought(uint256 tokenAmount, uint256 gweiAmount);
    event Sold(uint256 tokenAmount, uint256 gweiAmount);

    // Properties
    address public owner;
    address public tokenAddress;
    uint256 private purchasePrice_;
    uint256 private salePrice_;
    uint256 private tokenBalance;
    Status contractState;

    // Modifiers
    modifier isOwner() {
        require(msg.sender == owner , "Sender is not owner!");
        _;
    }

    modifier isActived() {
        require(contractState == Status.ACTIVE, "The contract is not active!");
        _;
    }

    modifier notCancelled() {
        require(contractState != Status.CANCELLED, "The contract is cancelled!");
        _;
    }

    // Constructor
    constructor(address token) {
        tokenAddress = token;
        owner = msg.sender;
        purchasePrice_ = 1 gwei;
        salePrice_ = 1 gwei;
        contractState = Status.ACTIVE;
    }

    // Log Functions
    function tokensQuantity() public notCancelled view returns(uint256) {
        return tokenBalance;
    }

    function contractBalance() public notCancelled view returns(uint256) {
        return address(this).balance;
    }

    function purchasePrice() public notCancelled view returns(uint256) {
        return purchasePrice_;
    }

    function salePrice() public view notCancelled returns(uint256) {
        return salePrice_;
    }

    // 1- comprar tokens com ether
    function buy() payable public isActived returns(bool) {
        uint256 amountTobuy = msg.value;
        // estava verificando da carteira do contrato, agora ta verificando da reserva da maquina
        uint256 balance = tokenBalance;
        uint256 tokenValue = amountTobuy / purchasePrice_;
        
        require(amountTobuy > 0, "You need to send some Ether");
        require(tokenValue <= balance, "Not enough tokens in the reserve");

        Token(tokenAddress).transfer(msg.sender, tokenValue);
        tokenBalance = tokenBalance.sub(tokenValue);

        emit Bought(tokenValue, amountTobuy);

        return true;
    }

    // 2- vender tokens por ether
    function sell(uint256 amountToSell) public isActived returns(bool) {
        uint256 balance = Token(tokenAddress).balanceOf(msg.sender);
        uint256 gweiValue = amountToSell * salePrice_;

        require(amountToSell <= balance, "Insufficient tokens to sell");
        require(amountToSell != 0, "cannot sell 0 tokens");
        require(gweiValue <= address(this).balance, "Insufficient gwei");

        payable(address(msg.sender)).transfer(gweiValue);
        Token(tokenAddress).transferFrom(msg.sender, address(this), amountToSell);

        emit Sold(amountToSell, gweiValue);
        return true;
    }

    // 3- reabastecer a máquina com tokens
    function restockToken(uint256 amount) public isOwner isActived returns(bool) {
        require(amount != 0, "cannot restock 0 token");
        
        uint256 balance = Token(tokenAddress).balanceOf(address(this));
        require(amount <= balance, "insufficient balance to restock");

        tokenBalance = tokenBalance.add(amount);

        return true;
    }

    // 4- reabastecer a máquina com ethers
    function restockEther() payable public isOwner isActived returns(bool) {
        return true;
    }

    // 5- sacar saldo em ether
    function withdrawEther(uint256 amount) public isOwner isActived returns(bool) {
        require(amount != 0, "cannot withdraw 0 ethers");
        require(amount <= address(this).balance, "insufficient balance to withdraw");

        payable(address(msg.sender)).transfer(amount);

        return true;
    }

    // 6- redefinir valor do token pra compra
    function resetPurchasePrice(uint256 value) public isOwner isActived returns(bool) {
        require(value != 0, "cannot reset purchase price to 0");
        purchasePrice_ = value * 1 wei;

        return true;
    }

    // 7- redefinir valor do token pra venda
    function resetSalePrice(uint256 value) public isOwner isActived returns(bool) {
        require(value != 0, "cannot reset sale price to 0");
        salePrice_ = value * 1 wei;

        return true;
    }

    // 7- mudar o estado do contrato
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

    // Kill
    function kill() public isOwner {
        require(contractState == Status.CANCELLED, "It's necessary to cancel the contract before to kill it!");
        selfdestruct(payable(owner));
    }

}


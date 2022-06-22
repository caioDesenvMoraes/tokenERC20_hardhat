// SPDX-License-Identifier: GPL-3.0
pragma solidity >= 0.7.0 < 0.9.0;

interface IERC20 {

    // Functions
    function totalSupply() external view returns(uint256);
    function balanceOf(address account) external view returns(uint256);
    function transfer(address receiver, uint256 amount) external returns(bool);
    function transferFrom(address sender, address receiver, uint256 quantity) external returns(bool);
    function changeState(uint8 newState) external returns(bool);
    function mint(uint256 amount) external returns(bool);
    function burn( uint256 amount) external returns(bool);

    // Events
    event Transfer(address from, address to, uint256 value);
    event Approval(address owner, address approve, uint toSell);

}

contract Token is IERC20 {

    // Libs
    using Math for uint256;

    // Enums
    enum Status { ACTIVE, PAUSED, CANCELLED }

    //Properties
    string public constant name = "CryptoToken";
    string public constant symbol = "CRY";
    uint8 public constant decimals = 9;
    uint256 private totalSupply_;
    address public owner;
    Status contractState;

    // mapping
    mapping(address => uint256) private balances;

      // modifiers
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

    constructor(uint256 initialSupply) {
        totalSupply_ = initialSupply;
        owner = msg.sender;
        balances[owner] = totalSupply_;
        contractState = Status.ACTIVE;
    }    

    //Public Functions
    function totalSupply() public view override notCancelled returns(uint256) {
        return totalSupply_;
    }

    function balanceOf(address tokenOwner) public view override notCancelled returns(uint256){
		return balances[tokenOwner];
	}

    function state() public view returns(Status) {
        return contractState;
    }

    function transfer(address receiver, uint256 quantity) public override isActived returns(bool) {
        require(balances[msg.sender] >= quantity, 'Not enough balance in the account');
        require(quantity != 0, "cannot transfer 0 tokens");
		balances[receiver] = balances[receiver].add(quantity);
		balances[msg.sender] = balances[msg.sender].sub(quantity);

		emit Transfer(msg.sender, receiver, quantity);
		return true;
	}

    function transferFrom(address sender, address receiver, uint256 quantity) public override isActived returns(bool) {
        require(balances[sender] >= quantity, 'Not enough balance in the account');
        require(quantity != 0, "cannot transfer 0 tokens");
        balances[receiver] = balances[receiver].add(quantity);
        balances[sender] = balances[sender].sub(quantity);

        emit Transfer(sender, receiver, quantity);
        return true;
    }
    
    function changeState(uint8 newState) public override isOwner returns(bool) {

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

     function mint(uint256 amount) public override isOwner isActived returns(bool) {
        require(amount != 0, "Cannot mint 0 token");

        totalSupply_ = totalSupply_.add(amount);
        balances[owner] = balances[owner].add(amount);

        return true;          
    }

    function burn( uint256 amount) public override isOwner isActived returns(bool) {
        require(amount != 0, "Cannot burn 0 token");
        require(balances[owner] >= amount, "burn amount exceeds balance");
        
        balances[owner] = balances[owner].sub(amount);
        totalSupply_ = totalSupply_.sub(amount);

       return true;

    } 

    // Kill
    function kill() public isOwner {
        require(contractState == Status.CANCELLED, "It's necessary to cancel the contract before to kill it!");
        selfdestruct(payable(owner));
    }

}


library Math {
    function add(uint256 a, uint256 b) internal pure returns(uint256) {
        uint256 c = a + b;
        assert(c >= a);
        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns(uint256) {
        assert (b <= a);
        return a - b;
    }
}


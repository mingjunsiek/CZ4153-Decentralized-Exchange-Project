/*
Implements EIP20 token standard: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md
.*/

pragma solidity >=0.4.22 <0.8.0;
import "./EIP20Interface.sol";
import "./SafeMath.sol";

contract WETH is EIP20Interface {
    using SafeMath for uint256;

    uint256 private constant MAX_UINT256 = 2**256 - 1;
    mapping(address => uint256) private balances;
    mapping(address => mapping(address => uint256)) private allowed;

    string public name; //fancy name: eg Simon Bucks
    uint8 public decimals; //How many decimals to show.
    string public symbol; //An identifier: eg SBX

    uint256 private _totalSupply;

    constructor() public // uint256 _initialAmount,
    // string memory _tokenName,
    // uint8 _decimalUnits,
    // string memory _tokenSymbol
    {
        // balances[msg.sender] = _initialAmount;               // Give the creator all initial tokens
        // totalSupply = _initialAmount;                        // Update total supply
        // name = _tokenName;                                   // Set the name for display purposes
        // decimals = _decimalUnits;                            // Amount of decimals for display purposes
        // symbol = _tokenSymbol;                               // Set the symbol for display purposes
        //balances[msg.sender] = 1000000000000000000000000; // Give the creator all initial tokens
        //totalSupply = 1000000000000000000000000; // Update total supply
        // 1,000,000,000,000,000,000 mSCSE = 1 SCSE
        // current total supply = 1,000,000 SCSE
        name = "Wrapped Ethereum"; // Set the name for display purposes
        decimals = 18; // Amount of decimals for display purposes
        symbol = "WETH";
    }

    function transfer(address _to, uint256 _value)
        public
        returns (bool success)
    {
        require(balances[msg.sender] >= _value);
        balances[msg.sender] -= _value;
        balances[_to] += _value;
        emit Transfer(msg.sender, _to, _value); //solhint-disable-line indent, no-unused-vars
        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool success) {
        uint256 allowance = allowed[_from][msg.sender];
        require(balances[_from] >= _value && allowance >= _value);
        balances[_to] += _value;
        balances[_from] -= _value;
        if (allowance < MAX_UINT256) {
            allowed[_from][msg.sender] -= _value;
        }
        emit Transfer(_from, _to, _value); //solhint-disable-line indent, no-unused-vars
        return true;
    }

    function balanceOf(address _owner) public view returns (uint256 balance) {
        return balances[_owner];
    }

    function approve(
        address _owner,
        address _spender,
        uint256 _value
    ) public returns (bool success) {
        allowed[_owner][_spender] = allowed[_owner][_spender].add(_value);
        emit Approval(_owner, _spender, _value, allowed[_owner][_spender]); //solhint-disable-line indent, no-unused-vars
        return true;
    }

    function reduceAllowance(
        address _owner,
        address _spender,
        uint256 _value
    ) public returns (uint256 currentAllowance) {
        allowed[_owner][_spender] = allowed[_owner][_spender].sub(_value);
        emit Approval(_owner, _spender, _value, allowed[_owner][_spender]);
        return allowed[_owner][_spender];
    }

    function allowance(address _owner, address _spender)
        public
        view
        returns (uint256 remaining)
    {
        return allowed[_owner][_spender];
    }

    function mint(address sender) external payable {
        totalSupply = totalSupply.add(msg.value);
        balances[sender] = balances[sender].add(msg.value);
    }

    function burn(address payable sender, uint256 amt) external {
        sender.transfer(amt);

        balances[sender] = balances[sender].sub(
            amt,
            "ERC20: Burn amt exceeds balance"
        );
        totalSupply = totalSupply.sub(amt);
    }
}

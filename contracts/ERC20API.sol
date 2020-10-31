pragma solidity >=0.4.22 <0.8.0;

contract ERC20API {
    function allowance(address tokenOwner, address spender)
        public
        view
        returns (uint256);

    function transfer(address to, uint256 tokens) public returns (bool);

    function transferFrom(
        address _from,
        address to,
        uint256 tokens
    ) public returns (bool);

    function approve(
        address _owner,
        address _spender,
        uint256 _value
    ) public returns (bool success);

    function reduceAllowance(
        address _owner,
        address _spender,
        uint256 _value
    ) public returns (uint256 currentAllowance);

    function balanceOf(address _owner) public view returns (uint256 balance);

    function mint(address sender) external payable;

    function burn(address payable sender, uint256 amt) external;
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "OpenZeppelin/openzeppelin-contracts@5.2.0/contracts/token/ERC20/ERC20.sol";
import "OpenZeppelin/openzeppelin-contracts@5.2.0/contracts/access/Ownable.sol";

contract BettingToken is ERC20, Ownable {
    constructor(address initialOwner) ERC20("Betting Token", "BTT") Ownable(initialOwner) {
        transferOwnership(initialOwner);
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SwanToken is ERC20, Ownable {
    // mapping(address => bool) public hasClaimed;
    mapping(address => uint256) public lastClaimedTime;
    uint256 public constant CLAIM_AMOUNT = 100 * 10 ** 18;
    uint256 public constant CLAIM_INTERVAL = 24 hours;

    event TokensClaimed(address indexed claimer, uint256 amount);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    constructor() ERC20("Swan Token", "SWT") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }

    function claim() external {
        require(
            balanceOf(msg.sender) < CLAIM_AMOUNT,
            "Balance is already 100 or more"
        );
        require(
            block.timestamp >= lastClaimedTime[msg.sender] + CLAIM_INTERVAL,
            "Claim only allowed once every 24 hours"
        );

        uint256 amountToMint = CLAIM_AMOUNT - balanceOf(msg.sender);
        // hasClaimed[msg.sender] = true;
        lastClaimedTime[msg.sender] = block.timestamp;
        _mint(msg.sender, amountToMint);
        emit TokensClaimed(msg.sender, amountToMint);
    }
}

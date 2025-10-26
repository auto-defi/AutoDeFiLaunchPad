// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ILaunchPadToken, ILaunchPadMintable} from "./interfaces/ILaunchPadToken.sol";

/// @title LaunchPadToken - minimal ERC20 with controlled mint/burn for bonding curve pools
contract LaunchPadToken is ILaunchPadToken, ILaunchPadMintable {
    string private _name;
    string private _symbol;
    uint8 private constant _decimals = 18;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    address public owner;
    address public override minter;

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    modifier onlyMinter() {
        require(msg.sender == minter, "ONLY_MINTER");
        _;
    }

    constructor(string memory name_, string memory symbol_, address initialMinter) {
        _name = name_;
        _symbol = symbol_;
        owner = msg.sender;
        minter = initialMinter;
    }

    // --- ERC20 view ---
    function name() external view override returns (string memory) { return _name; }
    function symbol() external view override returns (string memory) { return _symbol; }
    function decimals() external pure override returns (uint8) { return _decimals; }
    function totalSupply() external view override returns (uint256) { return _totalSupply; }
    function balanceOf(address account) external view override returns (uint256) { return _balances[account]; }
    function allowance(address owner_, address spender) external view override returns (uint256) { return _allowances[owner_][spender]; }

    // --- ERC20 write ---
    function transfer(address to, uint256 amount) external override returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        uint256 cur = _allowances[from][msg.sender];
        require(cur >= amount, "INSUFFICIENT_ALLOWANCE");
        unchecked { _approve(from, msg.sender, cur - amount); }
        _transfer(from, to, amount);
        return true;
    }

    // --- admin ---
    function setMinter(address newMinter) external override onlyOwner {
        minter = newMinter;
    }

    // --- mint/burn ---
    function mint(address to, uint256 amount) external override onlyMinter {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external override onlyMinter {
        _burn(from, amount);
    }

    // --- internal helpers ---
    function _transfer(address from, address to, uint256 amount) internal {
        require(to != address(0), "ZERO_TO");
        uint256 bal = _balances[from];
        require(bal >= amount, "INSUFFICIENT_BAL");
        unchecked { _balances[from] = bal - amount; }
        _balances[to] += amount;
        emit Transfer(from, to, amount);
    }

    function _approve(address owner_, address spender, uint256 amount) internal {
        require(spender != address(0), "ZERO_SPENDER");
        _allowances[owner_][spender] = amount;
        emit Approval(owner_, spender, amount);
    }

    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "ZERO_TO");
        _totalSupply += amount;
        _balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function _burn(address from, uint256 amount) internal {
        uint256 bal = _balances[from];
        require(bal >= amount, "INSUFFICIENT_BAL");
        unchecked { _balances[from] = bal - amount; }
        _totalSupply -= amount;
        emit Transfer(from, address(0), amount);
    }
}


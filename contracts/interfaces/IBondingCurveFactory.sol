// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBondingCurveFactory {
    event TokenCreated(
        address token,
        address pool,
        string name,
        string symbol,
        string iconURI,
        string projectURI,
        address indexed creator
    );

    function createToken(
        string calldata name,
        string calldata symbol,
        string calldata iconURI,
        string calldata projectURI,
        uint256 initialBuyAmountWei
    ) external payable returns (address token, address pool);

    function getPool(address token) external view returns (address pool);

    function allTokens(uint256 index) external view returns (address token);

    function allTokensLength() external view returns (uint256 length);
}


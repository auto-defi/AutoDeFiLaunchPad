// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBondingCurvePool {
    event Bought(address indexed buyer, uint256 hbarInWei, uint256 tokensOut);
    event Sold(address indexed seller, uint256 tokensIn, uint256 hbarOutWei);

    function token() external view returns (address);

    function buy(address to) external payable returns (uint256 tokensOut);

    function sell(address from, uint256 tokensIn) external returns (uint256 hbarOutWei);

    function getPriceForBuy(uint256 hbarInWei) external view returns (uint256 tokensOut);

    function getPriceForSell(uint256 tokensIn) external view returns (uint256 hbarOutWei);

    function reserves() external view returns (uint256 hbarReserves, uint256 tokenReserves);
}


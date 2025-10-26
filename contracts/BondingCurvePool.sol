// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IBondingCurvePool} from "./interfaces/IBondingCurvePool.sol";
import {ILaunchPadToken, ILaunchPadMintable} from "./interfaces/ILaunchPadToken.sol";

/// @notice Minimal pool with naive 1:1 Wei pricing for scaffolding.
/// This is NOT production economics; replace with real bonding curve logic before deployment.
contract BondingCurvePool is IBondingCurvePool {
    // Token bound to this pool
    address public immutable token;
    ILaunchPadToken private immutable tokenContract;
    ILaunchPadMintable private immutable mintable;

    // Actual reserves accounted by the pool (exclude virtual reserves)
    uint256 private _hbarReserves;   // total HBAR held in the pool
    uint256 private _tokenReserves;  // total tokens minted minus burned

    // Virtual reserves and fee (in basis points). Owner is the factory.
    address public owner;
    uint256 public vHbar;   // virtual HBAR reserves (wei)
    uint256 public vToken;  // virtual token reserves (token wei)
    uint16  public feeBps;  // e.g., 10 = 0.10%

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    constructor(address token_) {
        token = token_;
        tokenContract = ILaunchPadToken(token_);
        mintable = ILaunchPadMintable(token_);
        owner = msg.sender;           // factory will be the owner
        vHbar = 28.24 ether;          // tuned: ~28.24 HBAR virtual reserves
        vToken = 1_000_000 ether;     // tuned: 1,000,000 token wei virtual reserves
        feeBps = 10;                  // 0.10%
    }

    // Optional: allow factory (owner) to tune parameters after deployment
    function setParams(uint256 newVHbar, uint256 newVToken, uint16 newFeeBps) external onlyOwner {
        require(newFeeBps <= 1000, "FEE_TOO_HIGH"); // <= 10%
        vHbar = newVHbar;
        vToken = newVToken;
        feeBps = newFeeBps;
    }

    // --- views ---
    function reserves() external view override returns (uint256 hbarReserves, uint256 tokenReserves) {
        return (_hbarReserves, _tokenReserves);
    }

    function _k(uint256 H, uint256 T) internal view returns (uint256) {
        unchecked {
            return (H + vHbar) * (T + vToken);
        }
    }

    function _applyInFee(uint256 amountIn) internal view returns (uint256) {
        // effective input after fee
        return (amountIn * (10_000 - feeBps)) / 10_000;
    }

    function getPriceForBuy(uint256 hbarInWei) external view override returns (uint256 tokensOut) {
        if (hbarInWei == 0) return 0;
        uint256 H = _hbarReserves;
        uint256 T = _tokenReserves;
        uint256 k = _k(H, T);
        uint256 hInEff = (hbarInWei * (10_000 - feeBps)) / 10_000;
        uint256 newHPlusV = H + hInEff + vHbar;
        uint256 newTPlusV = k / newHPlusV;
        uint256 curTPlusV = T + vToken;
        if (newTPlusV >= curTPlusV) return 0;
        tokensOut = curTPlusV - newTPlusV;
    }

    function getPriceForSell(uint256 tokensIn) external view override returns (uint256 hbarOutWei) {
        if (tokensIn == 0) return 0;
        uint256 H = _hbarReserves;
        uint256 T = _tokenReserves;
        uint256 k = _k(H, T);
        uint256 tInEff = (tokensIn * (10_000 - feeBps)) / 10_000;
        uint256 newTPlusV = T + tInEff + vToken;
        uint256 newHPlusV = k / newTPlusV;
        uint256 curHPlusV = H + vHbar;
        if (newHPlusV >= curHPlusV) return 0;
        hbarOutWei = curHPlusV - newHPlusV;
    }

    // --- trades ---
    function buy(address to) external payable override returns (uint256 tokensOut) {
        require(to != address(0), "BAD_TO");
        uint256 hbarIn = msg.value;
        require(hbarIn > 0, "NO_INPUT");

        uint256 H = _hbarReserves;
        uint256 T = _tokenReserves;
        uint256 k = _k(H, T);
        uint256 hInEff = _applyInFee(hbarIn);

        uint256 newHPlusV = H + hInEff + vHbar;
        uint256 newTPlusV = k / newHPlusV;
        uint256 curTPlusV = T + vToken;
        require(newTPlusV < curTPlusV, "ZERO_OUT");
        tokensOut = curTPlusV - newTPlusV;
        require(tokensOut > 0, "ZERO_OUT");

        // mint to recipient; pool tracks reserves (collect full HBAR incl. fee)
        mintable.mint(to, tokensOut);
        _hbarReserves = H + hbarIn;          // add full input; fee stays in pool
        _tokenReserves = T + tokensOut;

        emit Bought(msg.sender, hbarIn, tokensOut);
    }

    function sell(address from, uint256 tokensIn) external override returns (uint256 hbarOutWei) {
        require(from != address(0), "BAD_FROM");
        require(tokensIn > 0, "NO_INPUT");

        // pull tokens to pool; burn full tokensIn
        bool ok = tokenContract.transferFrom(from, address(this), tokensIn);
        require(ok, "TRANSFER_FAIL");

        uint256 H = _hbarReserves;
        uint256 T = _tokenReserves;
        uint256 k = _k(H, T);
        uint256 tInEff = _applyInFee(tokensIn);

        uint256 newTPlusV = T + tInEff + vToken;
        uint256 newHPlusV = k / newTPlusV;
        uint256 curHPlusV = H + vHbar;
        require(newHPlusV < curHPlusV, "ZERO_OUT");
        hbarOutWei = curHPlusV - newHPlusV;
        require(hbarOutWei > 0, "ZERO_OUT");
        require(address(this).balance >= hbarOutWei && H >= hbarOutWei, "INSUFFICIENT_HBAR");

        // burn seller tokens; update reserves then pay out HBAR
        mintable.burn(address(this), tokensIn);
        _tokenReserves = T - tokensIn;
        _hbarReserves = H - hbarOutWei;

        (bool s, ) = from.call{value: hbarOutWei}("");
        require(s, "HBAR_SEND_FAIL");

        emit Sold(from, tokensIn, hbarOutWei);
    }

    // accept HBAR sent directly (e.g., self-destructs or direct sends)
    receive() external payable {
        _hbarReserves += msg.value;
    }
}


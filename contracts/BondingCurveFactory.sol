// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IBondingCurveFactory} from "./interfaces/IBondingCurveFactory.sol";
import {IBondingCurvePool} from "./interfaces/IBondingCurvePool.sol";
import {ILaunchPadToken, ILaunchPadMintable} from "./interfaces/ILaunchPadToken.sol";
import {BondingCurvePool} from "./BondingCurvePool.sol";
import {LaunchPadToken} from "./LaunchPadToken.sol";

/// @notice Minimal factory for scaffolding. Emits TokenCreated and keeps a registry.
contract BondingCurveFactory is IBondingCurveFactory {
    address[] private _allTokens;
    mapping(address => address) public poolOf; // token => pool

    struct Meta { string iconURI; string projectURI; }
    mapping(address => Meta) public metadataOf;

    function createToken(
        string calldata name,
        string calldata symbol,
        string calldata iconURI,
        string calldata projectURI,
        uint256 initialBuyAmountWei
    ) external payable override returns (address token, address pool) {
        require(bytes(name).length > 0 && bytes(symbol).length > 0, "BAD_META");
        require(msg.value == initialBuyAmountWei, "BAD_VALUE");

        // 1) Deploy token with temporary minter = this factory
        LaunchPadToken t = new LaunchPadToken(name, symbol, address(this));

        // 2) Deploy pool bound to token
        BondingCurvePool p = new BondingCurvePool(address(t));

        // 3) Set pool as minter so it can mint/burn on trades
        ILaunchPadMintable(address(t)).setMinter(address(p));

        // 4) If initial buy provided, forward to pool and buy for creator
        if (initialBuyAmountWei > 0) {
            (bool s, ) = address(p).call{value: initialBuyAmountWei}(abi.encodeWithSelector(
                IBondingCurvePool.buy.selector,
                msg.sender
            ));
            require(s, "INIT_BUY_FAIL");
        }

        // 5) Registry & event
        token = address(t);
        pool = address(p);
        poolOf[token] = pool;
        _allTokens.push(token);
        metadataOf[token] = Meta({iconURI: iconURI, projectURI: projectURI});
        emit TokenCreated(token, pool, name, symbol, iconURI, projectURI, msg.sender);
    }

    function getPool(address token) external view override returns (address pool) {
        return poolOf[token];
    }

    function allTokens(uint256 index) external view override returns (address token) {
        return _allTokens[index];
    }

    function allTokensLength() external view override returns (uint256 length) {
        return _allTokens.length;
    }
}


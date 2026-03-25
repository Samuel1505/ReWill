// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ISomniaEventHandler} from "./interfaces/ISomniaEventHandler.sol";

abstract contract SomniaEventHandler is ISomniaEventHandler {
    function _onEvent(
        address emitter,
        bytes32[] calldata eventTopics,
        bytes calldata data
    ) external virtual override {
        _handleEvent(emitter, eventTopics, data);
    }

    function _handleEvent(
        address emitter,
        bytes32[] calldata eventTopics,
        bytes calldata data
    ) internal virtual;
}

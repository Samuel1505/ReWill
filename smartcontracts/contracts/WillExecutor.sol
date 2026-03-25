// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {CheckInRegistry} from "./CheckInRegistry.sol";
import {SomniaEventHandler} from "./SomniaEventHandler.sol";

contract WillExecutor is SomniaEventHandler {
    error OnlyPrecompile();
    error RegistryAlreadySet();
    error InvalidRegistry();
    error TransferFailed();

    address public constant PRECOMPILE = 0x0000000000000000000000000000000000000100;

    CheckInRegistry public registry;

    event DeadlineReset(address indexed owner, uint256 newDeadline);
    event WillExecuted(address indexed owner, uint256 totalDistributed);

    modifier onlyPrecompile() {
        if (msg.sender != PRECOMPILE) revert OnlyPrecompile();
        _;
    }

    constructor(address _registry) {
        if (_registry != address(0)) {
            registry = CheckInRegistry(_registry);
        }
    }

    function setRegistry(address _registry) external {
        if (address(registry) != address(0)) revert RegistryAlreadySet();
        if (_registry == address(0)) revert InvalidRegistry();
        registry = CheckInRegistry(_registry);
    }

    function onCheckin(bytes calldata eventData) external onlyPrecompile {
        // Expected payload: abi.encode(owner, newDeadline)
        (address owner, uint256 newDeadline) = abi.decode(eventData, (address, uint256));
        emit DeadlineReset(owner, newDeadline);
    }

    function onCron(bytes calldata) external onlyPrecompile {
        address[] memory owners = registry.getActiveOwners();
        for (uint256 i = 0; i < owners.length; i++) {
            CheckInRegistry.Will memory w = registry.getWill(owners[i]);
            if (!w.active || w.balance == 0 || block.timestamp <= w.deadline) {
                continue;
            }
            _distribute(owners[i], w);
        }
    }

    function _distribute(address owner, CheckInRegistry.Will memory w) internal {
        uint256 amount = registry.markExecuted(owner);

        uint256 distributed;
        for (uint256 i = 0; i < w.beneficiaries.length; i++) {
            uint256 part = (amount * w.shares[i]) / 10_000;
            distributed += part;
            (bool ok, ) = payable(w.beneficiaries[i]).call{value: part}("");
            if (!ok) revert TransferFailed();
        }

        uint256 dust = amount - distributed;
        if (dust > 0) {
            (bool ok, ) = payable(w.beneficiaries[w.beneficiaries.length - 1]).call{value: dust}("");
            if (!ok) revert TransferFailed();
        }

        emit WillExecuted(owner, amount);
    }

    function _handleEvent(
        address,
        bytes32[] calldata,
        bytes calldata
    ) internal pure override {
        // No-op generic handler for interface compatibility.
    }

    receive() external payable {}
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CheckInRegistry {
    error AlreadyActiveWill();
    error NoActiveWill();
    error InvalidBeneficiaries();
    error InvalidShares();
    error InvalidInterval();
    error ZeroAmount();
    error NotExecutor();
    error TransferFailed();
    error TooManyActiveWills();

    struct Will {
        address owner;
        address[] beneficiaries;
        uint256[] shares;
        uint256 interval;
        uint256 deadline;
        uint256 balance;
        bool active;
    }

    uint256 public constant SHARES_TOTAL_BPS = 10_000;
    uint256 public immutable minInterval;
    address public willExecutor;

    mapping(address => Will) private wills;
    address[] private activeOwners;
    mapping(address => uint256) private activeOwnerIndexPlusOne;

    event WillCreated(address indexed owner, uint256 interval);
    event CheckedIn(address indexed owner, uint256 newDeadline);
    event Deposited(address indexed owner, uint256 amount);
    event WillCancelled(address indexed owner);
    event WillExecuted(address indexed owner, uint256 totalDistributed);
    event ExecutorUpdated(address indexed executor);

    constructor(address _willExecutor, uint256 _minInterval) {
        if (_minInterval == 0) revert InvalidInterval();
        willExecutor = _willExecutor;
        minInterval = _minInterval;
    }

    modifier onlyExecutor() {
        if (msg.sender != willExecutor) revert NotExecutor();
        _;
    }

    function setExecutor(address _willExecutor) external {
        // One-time setup hook to support deploy ordering in scripts.
        if (willExecutor != address(0)) revert NotExecutor();
        willExecutor = _willExecutor;
        emit ExecutorUpdated(_willExecutor);
    }

    function createWill(
        address[] calldata beneficiaries,
        uint256[] calldata shares,
        uint256 interval
    ) external {
        Will storage existing = wills[msg.sender];
        if (existing.active) revert AlreadyActiveWill();
        if (beneficiaries.length == 0 || beneficiaries.length > 10) revert InvalidBeneficiaries();
        if (beneficiaries.length != shares.length) revert InvalidShares();
        if (interval < minInterval) revert InvalidInterval();
        if (activeOwners.length >= 50) revert TooManyActiveWills();

        uint256 totalBps;
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            if (beneficiaries[i] == address(0)) revert InvalidBeneficiaries();
            totalBps += shares[i];
        }
        if (totalBps != SHARES_TOTAL_BPS) revert InvalidShares();

        uint256 newDeadline = block.timestamp + interval;

        existing.owner = msg.sender;
        existing.interval = interval;
        existing.deadline = newDeadline;
        existing.active = true;
        delete existing.beneficiaries;
        delete existing.shares;
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            existing.beneficiaries.push(beneficiaries[i]);
            existing.shares.push(shares[i]);
        }

        activeOwners.push(msg.sender);
        activeOwnerIndexPlusOne[msg.sender] = activeOwners.length;

        emit WillCreated(msg.sender, interval);
    }

    function imAlive() external {
        Will storage w = wills[msg.sender];
        if (!w.active) revert NoActiveWill();

        uint256 newDeadline = block.timestamp + w.interval;
        w.deadline = newDeadline;
        emit CheckedIn(msg.sender, newDeadline);
    }

    function deposit() external payable {
        if (msg.value == 0) revert ZeroAmount();
        Will storage w = wills[msg.sender];
        if (!w.active) revert NoActiveWill();
        w.balance += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function cancelWill() external {
        Will storage w = wills[msg.sender];
        if (!w.active) revert NoActiveWill();
        uint256 refund = w.balance;

        w.balance = 0;
        w.active = false;
        _removeActiveOwner(msg.sender);

        if (refund > 0) {
            (bool ok, ) = payable(msg.sender).call{value: refund}("");
            if (!ok) revert TransferFailed();
        }

        emit WillCancelled(msg.sender);
    }

    function markExecuted(address owner) external onlyExecutor returns (uint256 distributedAmount) {
        Will storage w = wills[owner];
        if (!w.active) revert NoActiveWill();

        distributedAmount = w.balance;
        w.balance = 0;
        w.active = false;
        _removeActiveOwner(owner);

        if (distributedAmount > 0) {
            (bool ok, ) = payable(msg.sender).call{value: distributedAmount}("");
            if (!ok) revert TransferFailed();
        }

        emit WillExecuted(owner, distributedAmount);
    }

    function getWill(address owner) external view returns (Will memory) {
        return wills[owner];
    }

    function getActiveOwners() external view returns (address[] memory) {
        return activeOwners;
    }

    function _removeActiveOwner(address owner) internal {
        uint256 indexPlusOne = activeOwnerIndexPlusOne[owner];
        if (indexPlusOne == 0) return;

        uint256 index = indexPlusOne - 1;
        uint256 last = activeOwners.length - 1;
        if (index != last) {
            address lastOwner = activeOwners[last];
            activeOwners[index] = lastOwner;
            activeOwnerIndexPlusOne[lastOwner] = index + 1;
        }

        activeOwners.pop();
        activeOwnerIndexPlusOne[owner] = 0;
    }
}

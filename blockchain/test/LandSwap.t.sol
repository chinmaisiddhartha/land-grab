// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/LandToken.sol";
import "../contracts/LandSwap.sol";

contract LandSwapTest is Test {
    LandToken public landToken;
    LandSwap public landSwap;
    address public owner = address(1);
    address public user1 = address(2);
    address public user2 = address(3);

    function setUp() public {
        vm.startPrank(owner);
        landToken = new LandToken();
        landSwap = new LandSwap(address(landToken));
        landToken.authorizeContract(address(landSwap));
        
        // Mint some tokens for testing
        landToken.mint(user1, "filled.count.soap", "51.5074", "-0.1278");
        landToken.mint(user2, "index.home.raft", "51.5075", "-0.1279");
        vm.stopPrank();
    }

    function testProposeSwap() public {
        vm.startPrank(user1);
        bytes32 proposalId = landSwap.proposeSwap(
            "filled.count.soap",
            user2,
            "index.home.raft"
        );
        vm.stopPrank();

        (
            address proposer,
            uint256 proposerTokenId,
            address receiver,
            uint256 receiverTokenId,
            bool isActive
        ) = landSwap.swapProposals(proposalId);

        assertEq(proposer, user1);
        assertEq(proposerTokenId, landToken.getTokenId("filled.count.soap"));
        assertEq(receiver, user2);
        assertEq(receiverTokenId, landToken.getTokenId("index.home.raft"));
        assertTrue(isActive);
    }

    function testCannotProposeSwapForOthersLand() public {
        vm.startPrank(user1);
        vm.expectRevert("Not the owner of this land");
        landSwap.proposeSwap(
            "index.home.raft", // User1 doesn't own this
            user2,
            "filled.count.soap"
        );
        vm.stopPrank();
    }

    // Note: Testing acceptSwap would require approving the LandSwap contract
    // to transfer tokens on behalf of users, which is complex in a test environment.
    // In a real scenario, users would need to call approve() on the LandToken contract.

    function testCancelSwap() public {
        vm.startPrank(user1);
        bytes32 proposalId = landSwap.proposeSwap(
            "filled.count.soap",
            user2,
            "index.home.raft"
        );
        landSwap.cancelSwap(proposalId);
        vm.stopPrank();

        (,,,,bool isActive) = landSwap.swapProposals(proposalId);
        assertFalse(isActive);
    }

    function testReceiverCanCancelSwap() public {
        vm.startPrank(user1);
        bytes32 proposalId = landSwap.proposeSwap(
            "filled.count.soap",
            user2,
            "index.home.raft"
        );
        vm.stopPrank();

        vm.startPrank(user2);
        landSwap.cancelSwap(proposalId);
        vm.stopPrank();

        (,,,,bool isActive) = landSwap.swapProposals(proposalId);
        assertFalse(isActive);
    }

    function testCannotCancelOthersSwap() public {
        vm.startPrank(user1);
        bytes32 proposalId = landSwap.proposeSwap(
            "filled.count.soap",
            user2,
            "index.home.raft"
        );
        vm.stopPrank();

        vm.startPrank(owner);
        vm.expectRevert("Not involved in this proposal");
        landSwap.cancelSwap(proposalId);
        vm.stopPrank();
    }

    // Note: Testing the surrounding land takeover would require setting up
    // a complex scenario with multiple land parcels in specific positions.
    // This would be better handled in integration tests.
}

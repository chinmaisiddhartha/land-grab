// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/LandToken.sol";
import "../contracts/LandMarket.sol";

contract LandMarketTest is Test {
    LandToken public landToken;
    LandMarket public landMarket;
    address public owner = address(1);
    address public verifier = address(2);
    address public user = address(3);

    function setUp() public {
        vm.startPrank(owner);
        landToken = new LandToken();
        landMarket = new LandMarket(address(landToken), verifier);
        landToken.authorizeContract(address(landMarket));
        vm.stopPrank();
    }

    function testRequestVerification() public {
        vm.startPrank(user);
        bytes32 requestId = landMarket.requestVerification("filled.count.soap");
        vm.stopPrank();

        assertTrue(landMarket.verificationRequests(requestId));
    }

    function testClaimLandAfterVerification() public {
        vm.startPrank(user);
        bytes32 requestId = landMarket.requestVerification("filled.count.soap");
        vm.stopPrank();

        vm.startPrank(verifier);
        landMarket.claimLandAfterVerification(
            requestId,
            "filled.count.soap",
            "51.5074",
            "-0.1278",
            user
        );
        vm.stopPrank();

        assertTrue(landToken.isLandClaimed("filled.count.soap"));
        assertEq(landToken.ownerOf(landToken.getTokenId("filled.count.soap")), user);
    }

    function testOnlyVerifierCanClaimLand() public {
        vm.startPrank(user);
        bytes32 requestId = landMarket.requestVerification("filled.count.soap");
        
        vm.expectRevert("Only verifier can call this function");
        landMarket.claimLandAfterVerification(
            requestId,
            "filled.count.soap",
            "51.5074",
            "-0.1278",
            user
        );
        vm.stopPrank();
    }

    function testReleaseLand() public {
        // First claim the land
        vm.startPrank(user);
        bytes32 requestId = landMarket.requestVerification("filled.count.soap");
        vm.stopPrank();

        vm.startPrank(verifier);
        landMarket.claimLandAfterVerification(
            requestId,
            "filled.count.soap",
            "51.5074",
            "-0.1278",
            user
        );
        vm.stopPrank();

        // Now release it
        vm.startPrank(user);
        landMarket.releaseLand("filled.count.soap");
        vm.stopPrank();

        assertFalse(landToken.isLandClaimed("filled.count.soap"));
    }

    function testCannotReleaseOthersLand() public {
        // First claim the land for user
        vm.startPrank(user);
        bytes32 requestId = landMarket.requestVerification("filled.count.soap");
        vm.stopPrank();

        vm.startPrank(verifier);
        landMarket.claimLandAfterVerification(
            requestId,
            "filled.count.soap",
            "51.5074",
            "-0.1278",
            user
        );
        vm.stopPrank();

        // Try to release as owner (not the land owner)
        vm.startPrank(owner);
        vm.expectRevert("Not the owner of this land");
        landMarket.releaseLand("filled.count.soap");
        vm.stopPrank();
    }

    // Note: Testing deleteUser would require implementing ERC721Enumerable
    // or modifying the contract to track owned tokens differently
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/LandToken.sol";

contract LandTokenTest is Test {
    LandToken public landToken;
    address public owner = address(1);
    address public authorized = address(2);
    address public user = address(3);

    function setUp() public {
        vm.startPrank(owner);
        landToken = new LandToken();
        landToken.authorizeContract(authorized);
        vm.stopPrank();
    }

    function testMint() public {
        vm.startPrank(authorized);
        uint256 tokenId = landToken.mint(user, "filled.count.soap", "51.5074", "-0.1278");
        vm.stopPrank();

        assertEq(landToken.ownerOf(tokenId), user);
        assertTrue(landToken.isLandClaimed("filled.count.soap"));
        assertEq(landToken.getTokenId("filled.count.soap"), tokenId);
        assertEq(landToken.getWhat3Words(tokenId), "filled.count.soap");
    }

    function testCannotMintDuplicate() public {
        vm.startPrank(authorized);
        landToken.mint(user, "filled.count.soap", "51.5074", "-0.1278");
        
        vm.expectRevert("Land already claimed");
        landToken.mint(user, "filled.count.soap", "51.5074", "-0.1278");
        vm.stopPrank();
    }

    function testBurn() public {
        vm.startPrank(authorized);
        uint256 tokenId = landToken.mint(user, "filled.count.soap", "51.5074", "-0.1278");
        landToken.burn(tokenId);
        vm.stopPrank();

        assertFalse(landToken.isLandClaimed("filled.count.soap"));
        vm.expectRevert("Land not claimed");
        landToken.getTokenId("filled.count.soap");
    }

    function testOnlyAuthorizedCanMint() public {
        vm.startPrank(user);
        vm.expectRevert("Not authorized");
        landToken.mint(user, "filled.count.soap", "51.5074", "-0.1278");
        vm.stopPrank();
    }

    function testOnlyAuthorizedCanBurn() public {
        vm.startPrank(authorized);
        uint256 tokenId = landToken.mint(user, "filled.count.soap", "51.5074", "-0.1278");
        vm.stopPrank();

        vm.startPrank(user);
        vm.expectRevert("Not authorized");
        landToken.burn(tokenId);
        vm.stopPrank();
    }

    function testOnlyOwnerCanAuthorize() public {
        vm.startPrank(user);
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                user
            )
        );
        landToken.authorizeContract(user);
        vm.stopPrank();
    }
}

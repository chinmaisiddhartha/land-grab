// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./LandToken.sol";

// Checks - Effects - Interactions
/**
 * @title LandMarket
 * @dev Contract for claiming and releasing land
 */
contract LandMarket is Ownable, ReentrancyGuard {
    // Reference to the LandToken contract
    LandToken public immutable landToken;
    
    // Backend server address that verifies user location
    address public verifierAddress;
    
    // Mapping to verification requests
    mapping(bytes32 => bool) public verificationRequests;
    
    // Events
    event VerificationRequested(
        bytes32 indexed requestId,
        address indexed user,
        string what3words
    );
    event LandClaimed(
        address indexed owner,
        uint256 indexed tokenId,
        string what3words
    );
    event LandReleased(
        address indexed owner,
        uint256 indexed tokenId,
        string what3words
    );
    event UserDeleted(address indexed user);
    
    /**
     * @dev Constructor
     * @param _landToken Address of the LandToken contract
     * @param _verifierAddress Address of the backend verifier
     */
    constructor(address _landToken, address _verifierAddress) Ownable(msg.sender) {
        require(_landToken != address(0), "Land token address cannot be zero");
        require(_verifierAddress != address(0), "Verifier address cannot be zero");
        landToken = LandToken(_landToken);
        verifierAddress = _verifierAddress;
    }
    
    /**
     * @dev Set the verifier address
     * @param verifierAddress_ New verifier address
     */
    function setVerifierAddress(address verifierAddress_) external onlyOwner {
        require(verifierAddress_ != address(0), "Verifier address cannot be zero");
        verifierAddress = verifierAddress_;
    }
    
    /**
     * @dev Request verification for claiming land
     * @param what3words The what3words address of the land
     * @return bytes32 The ID of the verification request
     */
    function requestVerification(string memory what3words) external returns (bytes32) {
        // Check if land is already claimed
        require(!landToken.isLandClaimed(what3words), "Land already claimed");
        
        // Generate request ID
        bytes32 requestId = keccak256(
            abi.encodePacked(
                msg.sender,
                what3words,
                block.timestamp
            )
        );
        
        // Store request
        verificationRequests[requestId] = true;
        
        emit VerificationRequested(requestId, msg.sender, what3words);
        
        return requestId;
    }
    
    /**
     * @dev Claim land after verification
     * @param requestId The ID of the verification request
     * @param what3words The what3words address of the land
     * @param lat Latitude of the land
     * @param lng Longitude of the land
     * @param user Address of the user claiming the land
     */
    function claimLandAfterVerification(
        bytes32 requestId,
        string memory what3words,
        string memory lat,
        string memory lng,
        address user
    ) external nonReentrant {
        // Only the verifier can call this function
        require(msg.sender == verifierAddress, "Only verifier can call this function");
        
        // Check if request exists
        require(verificationRequests[requestId], "Verification request not found");
        
        // Check if land is already claimed
        require(!landToken.isLandClaimed(what3words), "Land already claimed");
        
        // Clear request
        delete verificationRequests[requestId];
        
        // Mint token to user
        uint256 tokenId = landToken.mint(user, what3words, lat, lng);
        
        emit LandClaimed(user, tokenId, what3words);
    }
    
    /**
     * @dev Release land
     * @param what3words The what3words address of the land
     */
    function releaseLand(string memory what3words) external nonReentrant {
        // Get token ID
        uint256 tokenId = landToken.getTokenId(what3words);
        
        // Verify ownership
        require(landToken.ownerOf(tokenId) == msg.sender, "Not the owner of this land");
        
        emit LandReleased(msg.sender, tokenId, what3words);
       
        // Burn token
        landToken.burn(tokenId);
        
    }
    
    /**
     * @dev Delete user and release all their lands
     */
    function deleteUser() external {
        // Get all tokens owned by the user
        uint256 balance = IERC721(address(landToken)).balanceOf(msg.sender);
        
        // We need token IDs first because burning changes the balance
        uint256[] memory tokenIds = new uint256[](balance);
        
        // First collect all token IDs in a single loop
        for (uint256 i = 0; i < balance; i++) {
            // This assumes the ERC721Enumerable extension
            tokenIds[i] = IERC721Enumerable(address(landToken)).tokenOfOwnerByIndex(msg.sender, 0);
        }
        
        // Then burn all tokens in a separate loop
        for (uint256 i = 0; i < tokenIds.length; i++) {
            landToken.burn(tokenIds[i]);
        }
        
        emit UserDeleted(msg.sender);
    }
    
}

// Interface for ERC721Enumerable
interface IERC721Enumerable is IERC721 {
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256);
}

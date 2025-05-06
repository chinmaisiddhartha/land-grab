// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./LandToken.sol";

// Checks - Effects - Interactions
/**
 * @title LandSwap
 * @dev Contract for swapping land between users and implementing surrounding land takeover
 */
contract LandSwap is Ownable, ReentrancyGuard {
    // Reference to the LandToken contract
    LandToken public immutable landToken;
    
    // Structure for a swap proposal
    struct SwapProposal {
        address proposer;
        uint256 proposerTokenId;
        address receiver;
        uint256 receiverTokenId;
        bool isActive;
    }
    
    // Mapping from proposal ID to swap proposal
    mapping(bytes32 => SwapProposal) public swapProposals;
    
    // Events
    event SwapProposed(
        bytes32 indexed proposalId,
        address indexed proposer,
        uint256 proposerTokenId,
        address indexed receiver,
        uint256 receiverTokenId
    );
    event SwapAccepted(bytes32 indexed proposalId);
    event SwapCancelled(bytes32 indexed proposalId);
    event SurroundingTakeover(
        address indexed taker,
        address indexed victim,
        uint256 takenTokenId
    );
    
    /**
     * @dev Constructor
     * @param _landToken Address of the LandToken contract
     */
    constructor(address _landToken) Ownable(msg.sender) {
        require(_landToken != address(0), "Land token address cannot be zero");
        landToken = LandToken(_landToken);
    }
    
    /**
     * @dev Propose a swap of land between users
     * @param myWhat3Words The what3words address of the proposer's land
     * @param receiver The address of the receiver
     * @param receiverWhat3Words The what3words address of the receiver's land
     * @return bytes32 The ID of the swap proposal
     */
    function proposeSwap(
        string memory myWhat3Words,
        address receiver,
        string memory receiverWhat3Words
    ) external returns (bytes32) {
        // Get token IDs
        uint256 myTokenId = landToken.getTokenId(myWhat3Words);
        uint256 receiverTokenId = landToken.getTokenId(receiverWhat3Words);
        
        // Verify ownership
        require(landToken.ownerOf(myTokenId) == msg.sender, "Not the owner of this land");
        require(landToken.ownerOf(receiverTokenId) == receiver, "Receiver is not the owner of that land");
        
        // Create proposal ID
        bytes32 proposalId = keccak256(
            abi.encodePacked(
                msg.sender,
                myTokenId,
                receiver,
                receiverTokenId,
                block.timestamp
            )
        );
        
        // Store proposal
        swapProposals[proposalId] = SwapProposal({
            proposer: msg.sender,
            proposerTokenId: myTokenId,
            receiver: receiver,
            receiverTokenId: receiverTokenId,
            isActive: true
        });
        
        emit SwapProposed(proposalId, msg.sender, myTokenId, receiver, receiverTokenId);
        
        return proposalId;
    }
    
    /**
     * @dev Accept a swap proposal
     * @param proposalId The ID of the swap proposal
     */
    function acceptSwap(bytes32 proposalId) external nonReentrant {
        SwapProposal storage proposal = swapProposals[proposalId];
        
        // Verify proposal exists and is active
        require(proposal.isActive, "Proposal is not active");
        require(proposal.receiver == msg.sender, "Not the receiver of this proposal");
        
        // Verify current ownership
        require(
            landToken.ownerOf(proposal.proposerTokenId) == proposal.proposer,
            "Proposer no longer owns the land"
        );
        require(
            landToken.ownerOf(proposal.receiverTokenId) == msg.sender,
            "You no longer own the land"
        );
 
        // Mark proposal as inactive
        proposal.isActive = false;
       
        // Execute the swap
        address proposer = proposal.proposer;
        uint256 proposerTokenId = proposal.proposerTokenId;
        uint256 receiverTokenId = proposal.receiverTokenId;
        
        // emit before exteranal calls
        emit SwapAccepted(proposalId);
      
        // Transfer tokens
        // The LandToken contract must approve this contract to transfer tokens
        IERC721(address(landToken)).safeTransferFrom(proposer, msg.sender, proposerTokenId);
        IERC721(address(landToken)).safeTransferFrom(msg.sender, proposer, receiverTokenId);
        
    }
    
    /**
     * @dev Cancel a swap proposal
     * @param proposalId The ID of the swap proposal
     */
    function cancelSwap(bytes32 proposalId) external {
        SwapProposal storage proposal = swapProposals[proposalId];
        
        // Verify proposal exists and is active
        require(proposal.isActive, "Proposal is not active");
        require(
            proposal.proposer == msg.sender || proposal.receiver == msg.sender,
            "Not involved in this proposal"
        );
        
        // Mark proposal as inactive
        proposal.isActive = false;
        
        emit SwapCancelled(proposalId);
    }
    
    /**
     * @dev Check if a land is surrounded by lands owned by a single user
     * @param centralWhat3Words The what3words address of the central land
     * @param surroundingWhat3Words Array of what3words addresses of the surrounding lands
     * @return bool True if the land is surrounded, false otherwise
     */
    function isLandSurrounded(
        string memory centralWhat3Words,
        string[] memory surroundingWhat3Words
    ) public view returns (bool) {
        // Check if the central land exists and is owned by someone else
        uint256 centralTokenId = landToken.getTokenId(centralWhat3Words);
        address centralOwner = landToken.ownerOf(centralTokenId);
        
        // If there are not exactly 8 surrounding lands, it's not fully surrounded
        if (surroundingWhat3Words.length != 8) {
            return false;
        }
        
        // Check if all surrounding lands are owned by the same person
        address firstSurroundingOwner = address(0);
        
        for (uint i = 0; i < surroundingWhat3Words.length; i++) {
            // Skip if the land is not claimed
            if (!landToken.isLandClaimed(surroundingWhat3Words[i])) {
                return false;
            }
            
            uint256 surroundingTokenId = landToken.getTokenId(surroundingWhat3Words[i]);
            address surroundingOwner = landToken.ownerOf(surroundingTokenId);
            
            // If this is the first surrounding land, store its owner
            if (i == 0) {
                firstSurroundingOwner = surroundingOwner;
                
                // If the central owner is the same as the surrounding owner, it's not a takeover scenario
                if (centralOwner == firstSurroundingOwner) {
                    return false;
                }
            } 
            // For subsequent lands, check if they have the same owner as the first one
            else if (surroundingOwner != firstSurroundingOwner) {
                return false;
            }
        }
        
        // If we got here, all surrounding lands are owned by the same person (not the central owner)
        return true;
    }
    
    
    /**
     * @dev Take over a surrounded land
     * @param centralWhat3Words The what3words address of the central land
     * @param surroundingWhat3Words Array of what3words addresses of the surrounding lands
     */
    function takeoverSurroundedLand(
        string memory centralWhat3Words,
        string[] memory surroundingWhat3Words
    ) external nonReentrant {
        // Check if the land is surrounded
        require(
            isLandSurrounded(centralWhat3Words, surroundingWhat3Words),
            "Land is not surrounded"
        );
        
        // Verify if the caller owns all surrounding lands
        for (uint i = 0; i < surroundingWhat3Words.length; i++) {
            uint256 surroundingTokenId = landToken.getTokenId(surroundingWhat3Words[i]);
            require(
                landToken.ownerOf(surroundingTokenId) == msg.sender,
                "You don't own all surrounding lands"
            );
        }
        
        // Get the central token
        uint256 centralTokenId = landToken.getTokenId(centralWhat3Words);
        address originalOwner = landToken.ownerOf(centralTokenId);
        
        emit SurroundingTakeover(msg.sender, originalOwner, centralTokenId);
       
        // Transfer the central token to the caller
        IERC721(address(landToken)).safeTransferFrom(originalOwner, msg.sender, centralTokenId);
        
    }
}

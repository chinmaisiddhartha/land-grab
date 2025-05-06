// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title LandToken
 * @dev ERC721 token representing ownership of what3words land squares
 */
contract LandToken is ERC721URIStorage, Ownable {
    using Strings for uint256;

    // Mapping from what3words address to token ID
    mapping(string => uint256) private _what3wordsToTokenId;
    
    // Mapping from token ID to what3words address
    mapping(uint256 => string) private _tokenIdToWhat3words;
    
    // Counter for token IDs
    uint256 private _tokenIdCounter;
    
    // Addresses authorized to mint/burn tokens (LandMarket and LandSwap contracts)
    mapping(address => bool) private _authorizedContracts;
    
    // Events
    event LandClaimed(address indexed owner, uint256 indexed tokenId, string what3words);
    event LandReleased(uint256 indexed tokenId, string what3words);
    
   
    constructor() ERC721("LandGrab", "LAND") Ownable(msg.sender) {
        _tokenIdCounter = 1; // Start from 1, as 0 is often used to represent non-existence
    }
    
    /**
     * @dev Authorize a contract to mint/burn tokens
     * @param contractAddress Address of the contract to authorize
     */
    function authorizeContract(address contractAddress) external onlyOwner {
        _authorizedContracts[contractAddress] = true;
    }
    
    /**
     * @dev Revoke authorization from a contract
     * @param contractAddress Address of the contract to deauthorize
     */
    function deauthorizeContract(address contractAddress) external onlyOwner {
        _authorizedContracts[contractAddress] = false;
    }
    
    /**
     * @dev Check if a contract is authorized
     * @param contractAddress Address to check
     * @return bool True if authorized, false otherwise
     */
    function isAuthorized(address contractAddress) public view returns (bool) {
        return _authorizedContracts[contractAddress];
    }
    
    /**
     * @dev Modifier to restrict access to authorized contracts
     */
    modifier onlyAuthorized() {
        require(_authorizedContracts[msg.sender] || owner() == msg.sender, "Not authorized");
        _;
    }
    
    /**
     * @dev Mint a new token representing a land square
     * @param to Address to mint the token to
     * @param what3words The what3words address of the land
     * @param lat Latitude of the land
     * @param lng Longitude of the land
     * @return uint256 The ID of the minted token
     */
    function mint(address to, string memory what3words, string memory lat, string memory lng) 
        external 
        onlyAuthorized 
        returns (uint256) 
    {
        require(_what3wordsToTokenId[what3words] == 0, "Land already claimed");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        
        // Store the what3words address
        _what3wordsToTokenId[what3words] = tokenId;
        _tokenIdToWhat3words[tokenId] = what3words;
        
        // Generate and set token URI with metadata
        string memory tokenURI = generateTokenURI(tokenId, what3words, lat, lng);
        _setTokenURI(tokenId, tokenURI);
        
        emit LandClaimed(to, tokenId, what3words);
        
        return tokenId;
    }
    
    /**
     * @dev Burn a token representing a land square
     * @param tokenId The ID of the token to burn
     */
    function burn(uint256 tokenId) external onlyAuthorized {
        require(_exists(tokenId), "Token does not exist");
        
        string memory what3words = _tokenIdToWhat3words[tokenId];
        
        // Clear mappings
        delete _what3wordsToTokenId[what3words];
        delete _tokenIdToWhat3words[tokenId];
        
        // Burn the token
        _burn(tokenId);
        
        emit LandReleased(tokenId, what3words);
    }
    
    /**
     * @dev Check if a land is claimed
     * @param what3words The what3words address to check
     * @return bool True if claimed, false otherwise
     */
    function isLandClaimed(string memory what3words) public view returns (bool) {
        return _what3wordsToTokenId[what3words] != 0;
    }
    
    /**
     * @dev Get the token ID for a what3words address
     * @param what3words The what3words address
     * @return uint256 The token ID
     */
    function getTokenId(string memory what3words) public view returns (uint256) {
        uint256 tokenId = _what3wordsToTokenId[what3words];
        require(tokenId != 0, "Land not claimed");
        return tokenId;
    }
    
    /**
     * @dev Get the what3words address for a token ID
     * @param tokenId The token ID
     * @return string The what3words address
     */
    function getWhat3Words(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenIdToWhat3words[tokenId];
    }
    
    /**
     * @dev Generate token URI with metadata
     * @param tokenId The token ID
     * @param what3words The what3words address
     * @param lat Latitude of the land
     * @param lng Longitude of the land
     * @return string The token URI
     */
    function generateTokenURI(uint256 tokenId, string memory what3words, string memory lat, string memory lng) 
        internal 
        pure 
        returns (string memory) 
    {
        bytes memory metadata = abi.encodePacked(
            '{',
            '"name": "Land Parcel #', tokenId.toString(), '",',
            '"description": "A 3m x 3m land parcel at ', what3words, '",',
            '"attributes": [',
            '{"trait_type": "what3words", "value": "', what3words, '"},',
            '{"trait_type": "latitude", "value": "', lat, '"},',
            '{"trait_type": "longitude", "value": "', lng, '"}',
            ']',
            '}'
        );
        
        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(metadata)
            )
        );
    }
    
    /**
     * @dev Check if a token exists
     * @param tokenId The token ID to check
     * @return bool True if the token exists, false otherwise
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}

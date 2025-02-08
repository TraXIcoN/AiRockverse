// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MusicNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Track sale history
    struct SaleRecord {
        address seller;
        address buyer;
        uint256 price;
        uint256 timestamp;
    }

    // Mapping from tokenId to its sale history
    mapping(uint256 => SaleRecord[]) public saleHistory;
    
    // Current price for each token
    mapping(uint256 => uint256) public tokenPrices;

    event TokenListed(uint256 indexed tokenId, uint256 price);
    event TokenSold(uint256 indexed tokenId, address seller, address buyer, uint256 price);

    constructor() ERC721("AI Rockverse Music", "AIRM") {}

    function mintNFT(string memory tokenURI) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        return tokenId;
    }

    // Override required functions
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // List token for sale
    function listForSale(uint256 tokenId, uint256 price) public {
        require(ownerOf(tokenId) == msg.sender, "Not the token owner");
        tokenPrices[tokenId] = price;
        emit TokenListed(tokenId, price);
    }

    // Buy token
    function buyToken(uint256 tokenId) public payable {
        require(tokenPrices[tokenId] > 0, "Token not for sale");
        require(msg.value >= tokenPrices[tokenId], "Insufficient payment");
        
        address seller = ownerOf(tokenId);
        
        // Record the sale
        saleHistory[tokenId].push(SaleRecord({
            seller: seller,
            buyer: msg.sender,
            price: msg.value,
            timestamp: block.timestamp
        }));

        // Transfer token and payment
        _transfer(seller, msg.sender, tokenId);
        payable(seller).transfer(msg.value);
        
        emit TokenSold(tokenId, seller, msg.sender, msg.value);
    }

    // Get sale history for a token
    function getTokenSaleHistory(uint256 tokenId) public view returns (SaleRecord[] memory) {
        return saleHistory[tokenId];
    }
}
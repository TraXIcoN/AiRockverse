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
    
    // Track if token is listed for sale
    mapping(uint256 => bool) public isTokenListed;

    // Events
    event TokenListed(uint256 indexed tokenId, uint256 price);
    event TokenSold(uint256 indexed tokenId, address seller, address buyer, uint256 price);
    event TokenMinted(uint256 indexed tokenId, address owner, string tokenURI);
    event ListingCancelled(uint256 indexed tokenId);

    constructor() ERC721("AI Rockverse Music", "AIRM") {}

    // Mint new NFT
    function mintNFT(string memory uri) public returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, uri);

        emit TokenMinted(newTokenId, msg.sender, uri);
        return newTokenId;
    }

    // Get total supply of tokens
    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }

    // Get all tokens owned by an address
    function tokensOfOwner(address owner) public view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokens = new uint256[](tokenCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= _tokenIds.current(); i++) {
            if (_exists(i) && ownerOf(i) == owner) {
                tokens[index] = i;
                index++;
            }
        }
        
        return tokens;
    }

    // List token for sale
    function listToken(uint256 tokenId, uint256 price) public {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the token owner");
        require(price > 0, "Price must be greater than 0");
        
        tokenPrices[tokenId] = price;
        isTokenListed[tokenId] = true;
        
        emit TokenListed(tokenId, price);
    }

    // Cancel listing
    function cancelListing(uint256 tokenId) public {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the token owner");
        require(isTokenListed[tokenId], "Token not listed");
        
        delete tokenPrices[tokenId];
        isTokenListed[tokenId] = false;
        
        emit ListingCancelled(tokenId);
    }

    // Buy token
    function buyToken(uint256 tokenId) public payable {
        require(_exists(tokenId), "Token does not exist");
        require(isTokenListed[tokenId], "Token not listed for sale");
        require(msg.value >= tokenPrices[tokenId], "Insufficient payment");
        
        address seller = ownerOf(tokenId);
        require(msg.sender != seller, "Cannot buy your own token");
        
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
        
        // Clear listing
        delete tokenPrices[tokenId];
        isTokenListed[tokenId] = false;
        
        emit TokenSold(tokenId, seller, msg.sender, msg.value);
    }

    // Get token price
    function getTokenPrice(uint256 tokenId) public view returns (uint256) {
        require(_exists(tokenId), "Token does not exist");
        return tokenPrices[tokenId];
    }

    // Check if token is listed
    function isListed(uint256 tokenId) public view returns (bool) {
        require(_exists(tokenId), "Token does not exist");
        return isTokenListed[tokenId];
    }

    // Get sale history for a token
    function getTokenSaleHistory(uint256 tokenId) public view returns (SaleRecord[] memory) {
        require(_exists(tokenId), "Token does not exist");
        return saleHistory[tokenId];
    }

    // Override required functions
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) 
        returns (string memory) 
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
}
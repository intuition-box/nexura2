
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Nexons is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    address private authorizedAddress;

    mapping(string => bool) private allowedToMint;
    mapping(string => bool) private alreadyMinted;

    mapping(string => uint256) public mintedUsers;

    error AlreadyAllowedToMint();
    error CannotMintToZeroAddress();
    error NexonAlreadyMinted();
    error NoTokenURIProvided();
    error NotTokenOwnerOrApproved();
    error OnlyTheAuthorizedAddressCanCallThis();
    error TokenDoesNotExist(uint256 tokenId);
    error TokenUriIsRequired();
    error TransfersNotAllowed();
    error NotAllowedToMint(string userId);

    event MetadataUpdated(uint256 indexed tokenId, string tokenURI);
    event NexonsBurned(address indexed from, uint256 indexed tokenId);
    event NexonsMinted(address indexed to, uint256 indexed tokenId, uint256 tokenId);
    event UserAllowedToMint(string message);

    constructor(string memory _name, string memory _symbol, address _authorizedAddress) ERC721(_name, _symbol) {
        authorizedAddress = _authorizedAddress;
    }

    function mint(
        string calldata tokenURI_,
        string memory userId
    ) external {
        if (msg.sender == address(0)) revert CannotMintToZeroAddress();
        if (!allowedToMint[userId]) revert NotAllowedToMint(userId);
        if (alreadyMinted[userId]) revert NexonAlreadyMinted();
        if (bytes(tokenURI_).length == 0) revert TokenUriIsRequired();

        _tokenIdCounter.increment();
        uint256 newId = _tokenIdCounter.current();

        _safeMint(msg.sender, newId);

        _setTokenURI(newId, tokenURI_);

        alreadyMinted[userId] = true;

        emit NexonsMinted(msg.sender, newId, newId);
    }

    function allowUserToMint(string memory userId) onlyAuthorizer external {
        if (alreadyMinted[useId]) revert NexonAlreadyMinted();
        if (allowedToMint[userId]) revert AlreadyAllowedToMint();

        allowedToMint[userId] = true;

        emit UserAllowedToMint("user has been allowed to mint");
    }

    function burn(uint256 tokenId) external onlyOwner {
        address owner_ = ownerOf(tokenId);

        _burn(tokenId);

        if (externalIdForToken[tokenId] != bytes32(0)) {
            delete externalIdForToken[tokenId];
        }

        emit NexonsBurned(owner_, tokenId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId, 1);

        if (from != address(0) && to != address(0)) {
            revert TransfersNotAllowed();
        }
    }

    function _burn(uint256 tokenId) internal virtual override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view virtual override(ERC721, ERC721URIStorage) returns (string memory) {
        if (!_exists(tokenId)) revert TokenDoesNotExist(tokenId);
        return super.tokenURI(tokenId);
    }

    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }

    function updateTokenURI(uint256 tokenId, string calldata newURI) external onlyMinter {
        if (!_exists(tokenId)) revert TokenDoesNotExist(tokenId);
        _setTokenURI(tokenId, newURI);
        emit MetadataUpdated(tokenId, newURI);
    }

    modifier onlyAuthorizer {
        if (msg.sender != authorizedAddress) revert OnlyTheAuthorizedAddressCanCallThis();
        _;
    }
}

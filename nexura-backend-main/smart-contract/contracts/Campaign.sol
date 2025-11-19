// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Campaign is ReentrancyGuard {
  address private authorizedAddress;
  address payable public campaignCreator;
  bool internal created;
  string public nameOfCampaign;
  uint public rewardsClaimed;
  uint public rewardTokens;
  uint public totalReward;

  enum Status {
    Closed, 
    Ended,
    Started
  }

  Status currentStatus = Status.Closed;

  mapping (string => bool) public canClaim;
  mapping (string => bool) public claimed;
  mapping (string => bool) public joined;

  error AlreadyClaimedCampaignReward();
  error AlreadyJoinedCampaign();
  error CampaignCanOnlyBeCreatedOnce();
  error CampaignHasEnded();
  error CampaignHasNotBeenStarted();
  error CampaignIsAlreadyClosed();
  error CannotCloseAnEndedCampaign();
  error CompleteCampaignToClaimReward();
  error FailedToRefundReward();
  error OnlyTheAuthorizedAddressCanCallThis();
  error OnlyTheCampaignCreatorCanCallThis();
  error RewardClaimFailed();
  error RewardHasBeenExhausted();
  error SendTheRequiredAmount();
  error TokensToAddCannotBeZero();
  error TotalRewardOrRewardTokenCannotBeZero();
  error UserCanAlreadyClaimReward();

  event CampaignClosed(string message);
  event CampaignCreated(string message);
  event CampaignJoined(string message);
  event RewardsClaimed(string message);
  event UpdatedTokenRewards(string message);

  constructor (string memory _nameOfCampaign, address _authorizedAddress) {
    authorizedAddress = _authorizedAddress;
    campaignCreator = payable(msg.sender);
    nameOfCampaign = _nameOfCampaign;
  }

  function AllowCampaignRewardClaim(string memory userId) onlyAuthorizer external {
    if (canClaim[userId]) revert UserCanAlreadyClaimReward();
    if (claimed[userId]) revert AlreadyClaimedCampaignReward();

    canClaim[userId] = true;
  }

  function claimReward (string memory userId) external nonReentrant {
    if (currentStatus == Status.Closed) {
      revert CampaignHasNotBeenStarted();
    } else if (currentStatus == Status.Ended) {
      revert CampaignHasEnded();
    }

    if (address(this).balance <= 0) revert RewardHasBeenExhausted();
    if (!canClaim[userId]) revert CompleteCampaignToClaimReward();
    if (claimed[userId]) revert AlreadyClaimedCampaignReward();

    address reciever = payable(msg.sender);

   (bool sent, ) = reciever.call{value: rewardTokens}("");

    if (!sent) revert RewardClaimFailed();

    claimed[userId] = true;

    rewardsClaimed += rewardTokens;

    emit RewardsClaimed("rewards claimed successfully");
  }

  function closeCampaign() onlyCampaignCreator external {
    if (currentStatus == Status.Ended) {
      revert CannotCloseAnEndedCampaign();
    } else if (currentStatus == Status.Closed) {
      revert CampaignIsAlreadyClosed();
    }

    uint balance = address(this).balance;

    if (balance != 0) {
      (bool refundedReward, ) = campaignCreator.call{value: balance}("");
      if (!refundedReward) revert FailedToRefundReward();
    }

    currentStatus = Status.Closed;

    emit CampaignClosed("campaign has been closed");
  }

  function createCampaign(uint _totalReward, uint _rewardTokens) payable external {
    if (created) revert CampaignCanOnlyBeCreatedOnce();
    if (_totalReward == 0 || _rewardTokens == 0) revert TotalRewardOrRewardTokenCannotBeZero();
    if (msg.value < _totalReward) revert SendTheRequiredAmount();

    rewardTokens = _rewardTokens;
    totalReward = _totalReward;

    currentStatus = Status.Started;
    created = true;

    emit CampaignCreated("campaign created successfully");
  }

  function addReward(uint tokensToAdd) payable external {
    if (tokensToAdd == 0) revert TokensToAddCannotBeZero();
    if (msg.value < tokensToAdd) revert SendTheRequiredAmount();

    totalReward += tokensToAdd;

    emit UpdatedTokenRewards("token reward updated successfully!");
  }

  function joinCampaign(string memory userId) onlyAuthorizer external {
    if (currentStatus == Status.Closed) revert CampaignHasNotBeenStarted();
    if (joined[userId]) revert AlreadyJoinedCampaign();

    joined[userId] = true;

    emit CampaignJoined("campaign joined");
  }

  receive() external payable {}

  modifier onlyAuthorizer {
    if (msg.sender != authorizedAddress) revert OnlyTheAuthorizedAddressCanCallThis();
    _;
  }

  modifier onlyCampaignCreator {
    if (msg.sender != campaignCreator) revert OnlyTheCampaignCreatorCanCallThis();
    _;
  }
}

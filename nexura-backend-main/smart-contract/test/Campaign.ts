import { expect } from "chai";
import { parseEther } from "viem";
import { network } from "hardhat";
import { describe, it } from "node:test";

describe("Campaign", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

	async function deployContract() {
		const [deployer, authorized, creator, user1] = await viem.getWalletClients();

		const campaign = await viem.deployContract("Campaign", [
			"Test Campaign",
			authorized.account.address,
		]);

		const campaignInstance = await viem.getContractAt("Test Campaign", campaign.address);

		return { campaignInstance, deployer, authorized, creator, user1 };
	}

	it("should create a campaign", async function () {
		const { campaignInstance, creator } = await deployContract();

		const totalReward = parseEther("1");
		const rewardTokens = parseEther("0.1");

		const hash = await campaignInstance.write.createCampaign(
			[totalReward, rewardTokens],
			{
				account: creator.account.address,
				value: totalReward,
			}
		);

		const receipt = await publicClient.getTransactionReceipt({ hash });
		expect(receipt.status).to.equal("success");

		const status = await campaignInstance.read.currentStatus();
		expect(Number(status)).to.equal(2); // Status.Started = 2
  });

  it("campaign can only be created once", async () => {
		const { campaignInstance, creator } = await deployContract();

		const totalReward = parseEther("1");
		const rewardTokens = parseEther("0.1");

		const hash = await campaignInstance.write.createCampaign(
			[totalReward, rewardTokens],
			{
				account: creator.account.address,
				value: totalReward,
			}
		);

		const receipt = await publicClient.getTransactionReceipt({ hash });
		expect(receipt.status).to.equal("success");

		const status = await campaignInstance.read.currentStatus();
    expect(Number(status)).to.equal(2); // Status.Started = 2

    await campaignInstance.write.createCampaign(
			[totalReward, rewardTokens],
			{
				account: creator.account.address,
				value: totalReward,
			}
		);

		expect(await campaignInstance.write.createCampaign(
			[totalReward, rewardTokens],
			{
				account: creator.account.address,
				value: totalReward,
			}
		)).to.throws("campaign can only be created once");
	});
  
  it("should revert if non authorized address tries to join campaign", async () => {
    const { campaignInstance, user1, creator } = await deployContract();

		const totalReward = parseEther("1");
		const rewardTokens = parseEther("0.1");

		await campaignInstance.write.createCampaign([totalReward, rewardTokens], {
			account: creator.account.address,
			value: totalReward,
		});

		const userId = "user1Id";

    expect(await campaignInstance.write.joinCampaign([userId], {
      account: user1.account.address,
    })).to.throw("only authorized address can call this");
  });

	it("should allow a user to join the campaign", async function () {
		const { campaignInstance, authorized, creator } = await deployContract();

		const totalReward = parseEther("1");
		const rewardTokens = parseEther("0.1");

		await campaignInstance.write.createCampaign([totalReward, rewardTokens], {
			account: creator.account.address,
			value: totalReward,
		});

		const userId = "user1Id";

		const hash = await campaignInstance.write.joinCampaign([userId], {
			account: authorized.account.address,
		});

		const receipt = await publicClient.getTransactionReceipt({ hash });
		expect(receipt.status).to.equal("success");
  });
  
  it("should revert if non authorized address tried to enable claim", async () => {
    const { campaignInstance, authorized, creator } = await deployContract();

		const totalReward = parseEther("1");
		const rewardTokens = parseEther("0.1");

		await campaignInstance.write.createCampaign([totalReward, rewardTokens], {
			account: creator.account.address,
			value: totalReward,
		});

		const userId = "user1Id";

		await campaignInstance.write.joinCampaign([userId], {
			account: authorized.account.address,
		});

		expect(await campaignInstance.write.AllowCampaignRewardClaim(
			[userId],
			{
				account: creator.account.address,
			}
		)).to.throw("only authorized address can call this");
  });

	it("should allow authorized address to enable claim for a user", async function () {
		const { campaignInstance, authorized, creator } = await deployContract();

		const totalReward = parseEther("1");
		const rewardTokens = parseEther("0.1");

		await campaignInstance.write.createCampaign([totalReward, rewardTokens], {
			account: creator.account.address,
			value: totalReward,
		});

		const userId = "user1Id";

		await campaignInstance.write.joinCampaign([userId], {
			account: authorized.account.address,
		});

		const hash = await campaignInstance.write.AllowCampaignRewardClaim([userId], {
			account: authorized.account.address,
		});

		const receipt = await publicClient.getTransactionReceipt({ hash });
		expect(receipt.status).to.equal("success");

		const canClaim = await campaignInstance.read.canClaim([userId]);
		expect(canClaim).to.be.true;
	});

  it("should revert if user hasn't been allowed to claim rewards", async () => {});

	it("should allow user to claim rewards", async function () {
		const { campaignInstance, authorized, creator, user1 } = await deployContract();

		const totalReward = parseEther("1");
		const rewardTokens = parseEther("0.1");

		await campaignInstance.write.createCampaign([totalReward, rewardTokens], {
			account: creator.account.address,
			value: totalReward,
		});

		const userId = "user1Id";

		await campaignInstance.write.joinCampaign([userId], {
			account: authorized.account.address,
		});

		await campaignInstance.write.AllowCampaignRewardClaim([userId], {
			account: authorized.account.address,
		});

		const beforeBalance = await publicClient.getBalance({ address: user1.account.address});

		await campaignInstance.write.claimReward([userId], {
			account: user1.account.address,
		});

		const afterBalance = await publicClient.getBalance({ address: user1.account.address});
		expect(afterBalance > beforeBalance).to.be.true;
  });

	it("should allow campaign creator to add more reward tokens", async function () {
		const { campaignInstance, creator } = await deployContract();

		const totalReward = parseEther("1");
		const rewardTokens = parseEther("0.1");

		await campaignInstance.write.createCampaign([totalReward, rewardTokens], {
			account: creator.account.address,
			value: totalReward,
		});

		const additionalTokens = parseEther("0.5");

		const hash = await campaignInstance.write.addReward([additionalTokens], {
			account: creator.account.address,
			value: additionalTokens,
		});

		const receipt = await publicClient.getTransactionReceipt({ hash });
		expect(receipt.status).to.equal("success");
	});

	it("should close campaign and refund remaining balance", async function () {
		const { campaignInstance, creator } = await deployContract();

		const totalReward = parseEther("1");
		const rewardTokens = parseEther("0.1");

		await campaignInstance.write.createCampaign([totalReward, rewardTokens], {
			account: creator.account.address,
			value: totalReward,
		});

		const hash = await campaignInstance.write.closeCampaign([], {
			account: creator.account.address,
		});

		const receipt = await publicClient.getTransactionReceipt({ hash });
		expect(receipt.status).to.equal("success");

		const status = await campaignInstance.read.currentStatus();
		expect(Number(status)).to.equal(0); // Status.Closed
	});

  it("should not allow non camoaign creator close campaign", async () => {

  });
});

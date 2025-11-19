import { expect } from "chai";
import { parseEther } from "viem";
import { network } from "hardhat";
import { describe, it } from "node:test";

describe("Nexon SBT", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  async function deployContract() {
    const [deployer, authorized, creator, user1] = await viem.getWalletClients();

    const nexon = await viem.deployContract("Nexon", [
      "Test Nexons", "TNS",
      authorized.account.address,
    ]);

    const nexonInstance = await viem.getContractAt("Test Nexons", nexon.address);

    return { nexonInstance, deployer, authorized, creator, user1 };
  }

  it("should mint an NFT", async function () {
    
  });

  it("should not allow for NFT transfer", async () => {
    
  });
  
  it("Should revert if unallowed accounts try to mint", async () => {
    
  });

  it("should allow only the authroized account to access \"allowUserToMint\" fn", async function () {
    
  });
  
  it("should revert if user has already minted", async () => {
    
  });

  it("should revert if tokenURI is empty", async function () {
    
  });
});

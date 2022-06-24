const { expect } = require("chai");
const { ethers } = require("hardhat");
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace");

describe("airdrop tests", () => {

    let Token, token, Airdrop, airdrop;

    beforeEach(async () => {
        [owner, address1, address2, address3, address4, address5] = await ethers.getSigners()
        
        // deploy do token
        Token = await ethers.getContractFactory("Token")
        token = await Token.deploy(100000000000)
        await token.deployed()

        // deploy do airdrop
        Airdrop = await ethers.getContractFactory("Airdrop")
        airdrop = await Airdrop.deploy(token.address)
        await airdrop.deployed()

        // Passando a quantidade de tokens que vai ser distribuido no airdrop
        await token.transfer(airdrop.address, 1000000)
        
    })

    // describe("functions log", () => {

    //     it("checking if it is showing the current state", async () => {
    //         const expectedValue = 0

    //         expect(await airdrop.getState()).to.equal(expectedValue)
    //     })

    //     it("checking if it is showing the subscribers array", async () => {
    //         const expectedValue = "object"
            
    //         expect(typeof await airdrop.getSubscribes()).to.equal(expectedValue)
    //     })

    //     it("checking if it is showing the number of subscribers", async () => {
    //         const expectedValue = 0

    //         expect(await airdrop.getLengthSubscribes()).to.equal(0)
    //     })
    // })

    // describe("changeState function", () => {
        
    //     it("checking if the state is changing", async () => {
    //         const currentState = await token.state()
            
    //         const changeState = await token.changeState(1)
    //         await changeState.wait()
            
    //         const modifiedState = await token.state()
            
    //         expect(currentState != modifiedState).to.equal(true)
    //     })
            
    //     it("checking exceptions when changing state", async () => {
    //         await expect(airdrop.changeState(3)).to.be.revertedWith("Invalid status option!")
            
    //         await expect(airdrop.changeState(0)).to.be.revertedWith("The status is already ACTIVE")
            
    //         await airdrop.changeState(1)
    //         await expect(airdrop.changeState(1)).to.be.revertedWith("The status is already PAUSED")
            
    //         await airdrop.changeState(2)
    //         await expect(airdrop.changeState(2)).to.be.revertedWith("The status is already CANCELLED")
    //     })
    // })

    // describe("subscribe function", () => {

    //     it("checking if address is subscribing", async function() {
    //         const currentSubscribes = await airdrop.getLengthSubscribes()
        
    //         const setSubscribe = await airdrop.subscribe()
    //         await setSubscribe.wait()
        
    //         const addedSubscribe = await airdrop.getLengthSubscribes()
        
    //         expect(parseInt(currentSubscribes) + 1).to.equal(addedSubscribe)
    //     })
        
        
    //     it("checking multiple subscriptions", async function() {
    //         let cont = 0

    //         const currentSubscribes = await airdrop.getLengthSubscribes()

    //         const subscribes = [
    //             await airdrop.subscribe(),
    //             await airdrop.connect(address1).subscribe(),
    //             await airdrop.connect(address2).subscribe(),
    //             await airdrop.connect(address3).subscribe()
    //         ]

    //         for(let i = 0; i < subscribes.length; i++) {
    //             let subscribe = subscribes[i]
    //             subscribe.wait()
    //             cont++ 
    //         }

    //         const addedSubscribes = await airdrop.getLengthSubscribes()

    //         expect(parseInt(currentSubscribes) + cont).to.equal(addedSubscribes)
    //     })

    //     it("verification is called the execute function()", async function() {
    //         const amountAirdrop = await token.balanceOf(airdrop.address)
        
    //         const subscribes = [
    //           await airdrop.connect(address1).subscribe(),
    //           await airdrop.connect(address2).subscribe(),
    //           await airdrop.connect(address3).subscribe(),
    //           await airdrop.connect(address4).subscribe(),
    //           await airdrop.connect(address5).subscribe(),
    //         ]
        
    //         for(let i = 0; i < subscribes.length; i++) {
    //           let subscribe = subscribes[i]
    //           subscribe.wait()
    //         }
            
    //         const balances = [
    //           await token.balanceOf(address1.address), 
    //           await token.balanceOf(address2.address),
    //           await token.balanceOf(address3.address),
    //           await token.balanceOf(address4.address),
    //           await token.balanceOf(address5.address)
    //         ]
            
    //         const amountBalances = balances.reduce((soma, i) => parseInt(soma) + parseInt(i))
        
    //         expect(amountBalances).to.equal(amountAirdrop)
    //       })

    //     it("checking if you are trying to subscribe with the airdrop already finished", async () => {
    //         await airdrop.connect(address1).subscribe()
    //         await airdrop.connect(address2).subscribe()
    //         await airdrop.connect(address3).subscribe()
    //         await airdrop.connect(address4).subscribe()
    //         await airdrop.connect(address5).subscribe()

    //         await expect(airdrop.subscribe()).to.be.revertedWith("maximum number of addresses")
    //     })

    //     it("checking if you are trying to subscribe to an already subscribed wallet.", async () => {
    //         await airdrop.subscribe()

    //         await expect(airdrop.subscribe()).to.be.revertedWith("address already registered")
    //     })
    // })

    // describe("Kill Function", () => {
    //     it("checking if it's killing the contract", async () => {
    //         const changeState = await token.changeState(2)
    //         await changeState.wait()
            
    //         const kill = await token.kill()
    //         await kill.wait()
            
    //         const confirmation = kill.confirmations
            
    //         expect(confirmation == 1).to.equal(true)
    //     })
    // })

    describe("IsOwner Modifier", () => {
        it("checking owner permissions", async () => {
            expect(airdrop.connect(address1).changeState(2)).to.be.revertedWith("Sender is not owner!")
            expect(airdrop.connect(address1).kill()).to.be.revertedWith("Sender is not owner!")
        })
    })

    describe("IsActive Modifier", () => {
        
        it("checking if status is active", async () => {
            await airdrop.changeState(1)
            
            await expect(airdrop.connect(address1).subscribe()).to.be.revertedWith("the contract is not active")
            
            await airdrop.changeState(2)
            
            await expect(airdrop.connect(address2).subscribe()).to.be.revertedWith("the contract is not active")
        })
    })

    describe("NotCancelled", () => {
        
        it("checking that the status is not canceled", async () => {
            await airdrop.changeState(2)
            
            await expect(airdrop.getState()).to.be.revertedWith("The contract is cancelled!")
            await expect(airdrop.getSubscribes()).to.be.revertedWith("The contract is cancelled!")
            await expect(airdrop.getLengthSubscribes()).to.be.revertedWith("The contract is cancelled!")
            
        }) 
    })
})


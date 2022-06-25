const { expect } = require("chai");
const { ethers } = require("hardhat");
const convert = require('ethereum-unit-converter')

describe("vending machine tests", () => {
    
    let Token, token, Machine, machine;

    beforeEach(async () => {
        [owner, address1, address2, address3] = await ethers.getSigners()
    
        Token = await ethers.getContractFactory("Token")
        token = await Token.deploy(10000000000)
        await token.deployed()

        Machine = await ethers.getContractFactory("Machine")
        machine = await Machine.deploy(token.address)
        await machine.deployed()

        const transferToMachine = await token.transfer(machine.address, 1000000000)
        await transferToMachine.wait()
    })

    describe("RestockToken Function", () => {
        
        it("checking if you are restocking the tokens", async () => {
            const expectedValue = 10000
            
            const restockToken = await machine.restockToken(expectedValue)
            await restockToken.wait()
            
            expect(await machine.tokensQuantity()).to.equal(expectedValue)
        })
        
        it("checking if the restock is equal to 0", async () => {
            await expect(machine.restockToken(0)).to.be.revertedWith("cannot restock 0 token")
        })
        
        it("checking insufficient value for restock", async () => {
            await expect(machine.restockToken(1000000001)).to.be.revertedWith("insufficient balance to restock")
        })
    })

    describe("Buy Function", () => {
        
        it("verifying token purchase if it is leaving tokens from the machine address and adding to the buyer", async () => {
            const restockToken = await machine.restockToken(100000)
            await restockToken.wait()
            
            const purchasePrice = await machine.purchasePrice()
            
            const gweiAmount = convert(30, 'gwei', 'wei')
            const tokenAmount = gweiAmount / purchasePrice
            const etherAmount = convert(30, "gwei", "ether")
        
            const currentTokenBalanceMachine = await machine.tokensQuantity()
            const currentTokenBalanceBuyer = await token.balanceOf(address1.address)

            const buyTokens = await machine.connect(address1).buy({ value: ethers.utils.parseEther(etherAmount) })
            await buyTokens.wait()
            
            const modifiedTokenBalanceMachine = await machine.tokensQuantity()
            const modifiedTokenBalanceBuyer = await token.balanceOf(address1.address)
            
            expect(parseInt(currentTokenBalanceMachine) - tokenAmount).to.equal(modifiedTokenBalanceMachine)
            expect(parseInt(currentTokenBalanceBuyer) + tokenAmount).to.equal(modifiedTokenBalanceBuyer)
        })
    
        it("verifying token purchase if it is adding gwei from the machine address", async () => {
            const restockToken = await machine.restockToken(100000)
            await restockToken.wait()
            
            const gweiAmount = convert(30, 'gwei', 'wei')
            const etherAmount = convert(30, "gwei", "ether")
            
            const currentGweiBalanceMachine = await machine.contractBalance()
            
            const buyTokens = await machine.connect(address1).buy({ value: ethers.utils.parseEther(etherAmount)})
            await buyTokens.wait()
            
            const modifiedGweiBalanceMachine = await machine.contractBalance()
            
            expect(parseInt(currentGweiBalanceMachine + gweiAmount)).to.equal(modifiedGweiBalanceMachine)
        })
        
        it("checking multiple purchases leaving token from address of the machine", async () => {
            const restockToken = await machine.restockToken(100000)
            await restockToken.wait()

            const purchasePrice = await machine.purchasePrice()
            
            const currentTokenBalanceMachine = await machine.tokensQuantity()
            
            const gweiAmount = convert(30, 'gwei', 'wei')
            const tokenAmount = gweiAmount / purchasePrice
            
            const etherAmount = convert(30, "gwei", "ether")
            
            const buyes = [
                await machine.connect(address1).buy({ value: ethers.utils.parseEther(etherAmount)}),
                await machine.connect(address2).buy({ value: ethers.utils.parseEther(etherAmount)}),
                await machine.connect(address3).buy({ value: ethers.utils.parseEther(etherAmount)})
            ] 
            
            for(let i = 0; i < 3; i++) {
                const buy = buyes[i]
                await buy.wait()
            }
            
            const modifiedTokenBalanceMachine = await machine.tokensQuantity()
            
            expect(currentTokenBalanceMachine - (tokenAmount * 3)).to.equal(modifiedTokenBalanceMachine)
        })
    
        it("verifying multiple purchases by adding gwei at the address of the machine", async () => {
            const restockToken = await machine.restockToken(100000)
            await restockToken.wait()
            
            const currentGweiBalanceMachine = await machine.contractBalance()
            
            const gweiAmount = convert(30, 'gwei', 'wei')
            const etherAmount = convert(30, "gwei", "ether")

            const buyes = [
                await machine.connect(address1).buy({ value: ethers.utils.parseEther(etherAmount)}),
                await machine.connect(address2).buy({ value: ethers.utils.parseEther(etherAmount)}),
                await machine.connect(address3).buy({ value: ethers.utils.parseEther(etherAmount)})
            ] 
            
            for(let i = 0; i < 3; i++) {
                const buy = buyes[i]
                await buy.wait()
            }
            
            const modifiedGweiBalanceMachine = await machine.contractBalance()
            
            expect(parseInt(currentGweiBalanceMachine) + (gweiAmount * 3)).to.equal(modifiedGweiBalanceMachine)
        })
        
        it("checking purchase with value 0", async () => {
            const restockToken = await machine.restockToken(100000)
            await restockToken.wait()

            await expect(machine.connect(address3).buy({ value: ethers.utils.parseEther("0")})).to.be.revertedWith("You need to send some Ether")
        })
        
        it("verifying purchase of an amount above the reserve", async () => {
            const restockToken = await machine.restockToken(100000)
            await restockToken.wait()
            
            await expect(machine.connect(address3).buy({ value: ethers.utils.parseEther("10")})).to.be.revertedWith("Not enough tokens in the reserve")
        })
    })

    describe("Sell Function", () => {

        it("checking the token output if you are adding tokens to the machine's address and withdrawing from the seller", async () => {
            const restockToken = await machine.restockToken(100000)
            await restockToken.wait()
            
            const tokenAmount = 1000
            
            const etherAmount = convert(tokenAmount, "gwei", "ether")
            
            const buy = await machine.connect(address1).buy({ value: ethers.utils.parseEther(etherAmount)})
            await buy.wait()
            
            const currentTokenBalanceMachine = await token.balanceOf(machine.address)
            const currentTokenBalanceSeller = await token.balanceOf(address1.address)
            
            const tokenSale = await machine.connect(address1).sell(tokenAmount)
            await tokenSale.wait()
            
            const modifiedTokenBalanceMachine = await token.balanceOf(machine.address)
            const modifiedTokenBalanceSeller = await token.balanceOf(address1.address)
            
            expect(parseInt(currentTokenBalanceMachine) + tokenAmount).to.equal(modifiedTokenBalanceMachine)
            expect(parseInt(currentTokenBalanceSeller) - tokenAmount).to.equal(modifiedTokenBalanceSeller)
        })

        it("verifying multiple sales by adding tokens at the address of the machine", async () => {
            const restockToken = await machine.restockToken(100000)
            await restockToken.wait()
            const etherAmount = convert(30, "gwei", "ether")

            const buyes = [
                await machine.connect(address1).buy({ value: ethers.utils.parseEther(etherAmount)}),
                await machine.connect(address2).buy({ value: ethers.utils.parseEther(etherAmount)}),
                await machine.connect(address3).buy({ value: ethers.utils.parseEther(etherAmount)})
            ] 
            
            for(let i = 0; i < 3; i++) {
                const buy = buyes[i]
                await buy.wait()
            }
            
            const currentTokenBalanceMachine = await token.balanceOf(machine.address)

            const sales = [
                await machine.connect(address1).sell(15),
                await machine.connect(address2).sell(15),
                await machine.connect(address3).sell(15)
            ] 
            
            for(let i = 0; i < 3; i++) {
                const sell = sales[i]
                await sell.wait()
            }
            
            const modifiedTokenBalanceMachine = await token.balanceOf(machine.address)
            expect(parseInt(currentTokenBalanceMachine) + (15 * 3)).to.equal(modifiedTokenBalanceMachine)
        })
        
        it("checking if you are selling insufficient tokens", async () => {
            const restockToken = await machine.restockToken(100000)
            await restockToken.wait()
            
            await expect(machine.connect(address1).sell(1000)).to.be.revertedWith("Insufficient tokens to sell")
        })
        
        it("checking if it is selling 0 tokens", async () => {
            const restockToken = await machine.restockToken(100000)
            await restockToken.wait()
            
            await expect(machine.connect(address1).sell(0)).to.be.revertedWith("cannot sell 0 tokens")
        })
        
        it("checking if the machine is without gwei", async () => {
            const restockToken = await machine.restockToken(100000)
            await restockToken.wait()
            
            const etherAmount = convert(1000, "gwei", "ether")
            
            const buy = await machine.connect(address1).buy({ value: ethers.utils.parseEther(etherAmount)})
            await buy.wait()
            
            const currentGweiBalanceMachine = await machine.contractBalance()
            
            const withdraw = await machine.withdrawEther(currentGweiBalanceMachine)
            await withdraw.wait()
            
            await expect(machine.connect(address1).sell(100)).to.be.revertedWith("Insufficient gwei")
            
        })
    })

    describe("WithdrawEther Function", () => {
        it("checking if it's withdrawing the ether from the machine", async () => {
            const restockToken = await machine.restockToken(100000)
            await restockToken.wait()
            
            const etherAmount = convert(1000, "gwei", "ether")
            
            const buy = await machine.connect(address1).buy({ value: ethers.utils.parseEther(etherAmount)})
            await buy.wait()
            
            const currentGweiBalanceMachine = await machine.contractBalance()
            
            const withdraw = await machine.withdrawEther(currentGweiBalanceMachine)
            await withdraw.wait()
            
            const expectedValue = 0
            
            expect(await machine.contractBalance()).to.equal(expectedValue)
        })
        
        it("checking if it is drawing 0 gwei", async () => {
            await expect(machine.withdrawEther(0)).to.be.revertedWith("cannot withdraw 0 ethers")
        })
        
        it("checking if you are withdrawing an insufficient amount", async () => {
            const restockToken = await machine.restockToken(100000)
            await restockToken.wait()
            
            await expect(machine.withdrawEther(1)).to.be.revertedWith("insufficient balance to withdraw")
        })
    })

    describe("restockEther functions", () => {
        it("checking if you are restocking the machine with ether", async () => {
            
            const currentGweiBalanceMachine = await machine.contractBalance() 

            const restockEther = await machine.restockEther({ value: ethers.utils.parseEther("1")})
            await restockEther.wait()

            const etherAmount = convert(1, "ether", "wei")

            const modifiedGweiBalanceMachine = await machine.contractBalance() 
            
            expect(currentGweiBalanceMachine + etherAmount).to.equal(modifiedGweiBalanceMachine)
            
        })
    })

    describe("ResetPurchasePrice Function", () => {
        it("checking if you are changing the value of the token for purchase", async () => {
            const expectedPrice = 10000000000
            
            const resetPrice = await machine.resetPurchasePrice(10000000000)
            await resetPrice.wait()
            
            expect(await machine.purchasePrice()).to.equal(expectedPrice)
        })
        
        it("checking if the value of the token for purchase is changing to 0", async () => {
            await expect(machine.resetPurchasePrice(0)).to.be.revertedWith("cannot reset purchase price to 0")
        })
    })
    
    describe("ResetSalePrice", () => {
        it("checking if you are changing the value of the token for sale", async () => {
            const expectedPrice = 10000000000
            
            const resetPrice = await machine.resetSalePrice(10000000000)
            await resetPrice.wait()
            
            expect(await machine.salePrice()).to.equal(expectedPrice)
        })
        
        it("checking if the value of the token for sale is changing to 0", async () => {
            await expect(machine.resetSalePrice(0)).to.be.revertedWith("cannot reset sale price to 0")
        })

    })

})



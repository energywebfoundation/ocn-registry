const ethers = require('ethers')
const BigNumber = require('bignumber.js')
const sign = require('./sign')

var Registry = artifacts.require('Registry')

contract('Registry', function (accounts) {

    let registry
    const privateKey = '0x49b2e2b48cfc25fda1d1cbdb2197b83902142c6da502dcf1871c628ea524f11b'
    const wallet = new ethers.Wallet(privateKey)

    const getGasCost = async (res) => {
      console.log("gas used:", res.receipt.gasUsed)
    }

    const toHex = (str) => {
      return "0x" + Buffer.from(str).toString("hex")
    }
  
    beforeEach(async () => {
      registry = await Registry.new()
    })


    /**
     * Node Operator Listings
     */

    it("setNode allows operator to add their node", async () => {
      const domain = "https://node.ocn.org"
      await registry.setNode(domain, {from: accounts[1]})
      assert.equal(await registry.getNode(accounts[1]), domain)
      assert.deepEqual(await registry.getNodeOperators(), [ethers.utils.getAddress(accounts[1])])
    })

    it("setNodeRaw allows operator to add their node", async () => {
      const operator = ethers.Wallet.createRandom()
      const domain = "https://node2.ocn.org"
      const sig = await sign.setNodeRaw(domain, operator)
      await registry.setNodeRaw(operator.address, domain, sig.v, sig.r, sig.s, {from: accounts[2]})
      assert.equal(await registry.getNode(operator.address), domain)
      assert.deepEqual(await registry.getNodeOperators(), [ethers.utils.getAddress(operator.address)])
    })

    it("setNode allows operator to update their node", async () => {
      const domain = "https://node.ocn.org"
      await registry.setNode(domain, {from: accounts[3]})
      assert.equal(await registry.getNode(accounts[3]), domain)
      assert.deepEqual(await registry.getNodeOperators(), [ethers.utils.getAddress(accounts[3])])
      const domain2 = "https://node2.ocn.org"
      await registry.setNode(domain2, {from: accounts[3]})
      assert.equal(await registry.getNode(accounts[3]), domain2)
      assert.deepEqual(await registry.getNodeOperators(), [ethers.utils.getAddress(accounts[3])])
    })

    it("setNode does not allow non-unique domain name", async () => {
      const domain = "https://node.ocn.org"
      await registry.setNode(domain, {from: accounts[3]})
      assert.equal(await registry.getNode(accounts[3]), domain)
      assert.deepEqual(await registry.getNodeOperators(), [ethers.utils.getAddress(accounts[3])])
      try {
        await registry.setNode(domain, {from: accounts[4]})
        assert.fail()
      } catch (err) {
        assert.equal(err.reason, "Domain name already registered.")
        assert.equal(await registry.getNode(accounts[4]), "")
        assert.deepEqual(await registry.getNodeOperators(), [ethers.utils.getAddress(accounts[3])])
      }
    })

    it("deleteNode allows operator to delete their node", async () => {
      const domain = "https://node.ocn.org"
      await registry.setNode(domain, {from: accounts[3]})
      assert.equal(await registry.getNode(accounts[3]), domain)
      assert.deepEqual(await registry.getNodeOperators(), [ethers.utils.getAddress(accounts[3])])
      await registry.deleteNode({from: accounts[3]})
      assert.equal(await registry.getNode(accounts[3]), "")
    })

    it("deleteNodeRaw allows operator to delete their node", async () => {
      const operator = ethers.Wallet.createRandom()
      const domain = "https://node.ocn.org"
      const sig = await sign.setNodeRaw(domain, operator)
      await registry.setNodeRaw(operator.address, domain, sig.v, sig.r, sig.s, {from: accounts[2]})
      assert.equal(await registry.getNode(operator.address), domain)
      assert.deepEqual(await registry.getNodeOperators(), [ethers.utils.getAddress(operator.address)])
      const sig2 = await sign.deleteNodeRaw(operator)
      await registry.deleteNodeRaw(operator.address, sig2.v, sig2.r, sig2.s, {from: accounts[2]})
      assert.equal(await registry.getNode(operator.address), "")
    })

    it("deleteNode frees domain name after deletion", async () => {
      const domain = "https://node.ocn.org"
      await registry.setNode(domain, {from: accounts[3]})
      assert.equal(await registry.getNode(accounts[3]), domain)
      assert.deepEqual(await registry.getNodeOperators(), [ethers.utils.getAddress(accounts[3])])
      await registry.deleteNode({from: accounts[3]})
      assert.equal(await registry.getNode(accounts[3]), "")
      await registry.setNode(domain, {from: accounts[4]})
      assert.equal(await registry.getNode(accounts[4]), domain)
    })

    it("adminDeleteOperator allows admin deletion of node", async () => {
      const domain = "https://node.ocn.org"
      await registry.setNode(domain, {from: accounts[1]})
      assert.equal(await registry.getNode(accounts[1]), domain)
      assert.deepEqual(await registry.getNodeOperators(), [ethers.utils.getAddress(accounts[1])])
      await registry.adminDeleteOperator(accounts[1])
      assert.equal(await registry.getNode(accounts[1]), "")
    })

    it("getNodeOperators", async () => {
      const domains = ["https://node.ocn.org", "https://node2.ocn.org", "https://node3.ocn.org"]
      for (const [index, domain] of domains.entries()) {
        await registry.setNode(domain, {from: accounts[index + 1]})
      }
      const operators = await registry.getNodeOperators()
      const got = []
      for (const operator of operators) {
        got.push(await registry.getNode(operator))
      }
      assert.deepEqual(got, domains)
    })

    /**
     * OCPI Party Listings
     */

    it("setParty allows listing ocpi party", async () => {
      const domain = "https://node.ocn.org"
      await registry.setNode(domain, {from: accounts[1]})

      const country = toHex("DE")
      const id = toHex("ABC")
      await registry.setParty(country, id, [1, 2], accounts[1], {from: accounts[2]})
      
      const got = await registry.getPartyDetailsByAddress(accounts[2])

      assert.equal(got.countryCode, country)
      assert.equal(got.partyId, id)
      assert.equal(got.roles.length, 2)
      assert.equal(got.modulesSender.length, 0)
      assert.equal(got.modulesReceiver.length, 0)
      assert.equal(got.operatorAddress, accounts[1])
      assert.equal(got.operatorDomain, domain)

      const parties = await registry.getParties()
      assert.deepEqual(parties, [accounts[2]])

      const operator = await registry.getOperatorByAddress(accounts[2])
      assert.equal(operator.operator, accounts[1])
      assert.equal(operator.domain, domain)
    })

    it("setParty allows updating ocpi party", async () => {
      const domain = "https://node.provider.net"
      await registry.setNode("https://node.ocn.org", {from: accounts[1]})
      await registry.setNode(domain, {from: accounts[3]})

      const country = toHex("DE")
      const id = toHex("ABC")
      await registry.setParty(country, id, [0, 6], accounts[1], {from: accounts[2]})

      await registry.setParty(country, id, [0, 6], accounts[3], {from: accounts[2]})

      const got = await registry.getPartyDetailsByAddress(accounts[2])

      assert.equal(got.countryCode, country)
      assert.equal(got.partyId, id)
      assert.equal(got.roles.length, 2)
      assert.equal(got.operatorAddress, accounts[3])
      assert.equal(got.operatorDomain, domain)

      const parties = await registry.getParties()
      assert.deepEqual(parties, [accounts[2]])
    })

    it("setParty does not allow non-unique country_code/party_id/address combinations", async () => {
      const domain = "https://node.ocn.org"
      await registry.setNode(domain, {from: accounts[1]})
      await registry.setNode("https://node.provider.net", {from: accounts[3]})

      const country = toHex("DE")
      const id = toHex("ABC")
      await registry.setParty(country, id, [0, 6], accounts[1], {from: accounts[2]})

      try {
        await registry.setParty(country, id, [0, 6], accounts[3], {from: accounts[4]})
        assert.fail()
      } catch (err) {
        assert.equal(err.reason, "Party with country_code/party_id already registered under different address.")
      }

      const got = await registry.getPartyDetailsByAddress(accounts[2])
      assert.equal(got.countryCode, country)
      assert.equal(got.partyId, id)
      assert.equal(got.roles.length, 2)
      assert.equal(got.operatorAddress, accounts[1])
      assert.equal(got.operatorDomain, domain)

      const parties = await registry.getParties()
      assert.deepEqual(parties, [accounts[2]])
    })

    it("setPartyRaw allows different wallet to register party", async () => {
      const domain = "https://node.ocn.org"
      await registry.setNode(domain, {from: accounts[1]})

      const party = ethers.Wallet.createRandom()

      const country = toHex("DE")
      const id = toHex("ABC")
      const sig = await sign.setPartyRaw(country, id, [1, 2], accounts[1], party)
      await registry.setPartyRaw(party.address, country, id, [1, 2], accounts[1], sig.v, sig.r, sig.s)

      const got = await registry.getPartyDetailsByAddress(party.address)

      assert.equal(got.countryCode, country)
      assert.equal(got.partyId, id)
      assert.equal(got.roles.length, 2)
      assert.equal(got.operatorAddress, accounts[1])
      assert.equal(got.operatorDomain, domain)

      const parties = await registry.getParties()
      assert.deepEqual(parties, [party.address])
    })

    it("deleteParty allows de-listing of party", async () => {
      const domain = "https://node.ocn.org"
      await registry.setNode(domain, {from: accounts[1]})

      const country = toHex("DE")
      const id = toHex("ABC")
      await registry.setParty(country, id, [0, 6], accounts[1], {from: accounts[2]})
      
      await registry.deleteParty({from: accounts[2]})

      const got = await registry.getPartyDetailsByAddress(accounts[2])
      
      assert.equal(got.countryCode, "0x0000")
      assert.equal(got.partyId, "0x000000")
      assert.equal(got.roles.length, 0)
      assert.equal(got.operatorAddress, "0x0000000000000000000000000000000000000000")
      assert.equal(got.operatorDomain, "")
    })

    it("deletePartyRaw allows different wallet to delete party", async () => {
      const domain = "https://node.ocn.org"
      await registry.setNode(domain, {from: accounts[1]})

      const party = ethers.Wallet.createRandom()

      const country = toHex("DE")
      const id = toHex("ABC")
      const sig1 = await sign.setPartyRaw(country, id, [1, 2], accounts[1], party)
      await registry.setPartyRaw(party.address, country, id, [1, 2], accounts[1], sig1.v, sig1.r, sig1.s)
      
      const sig2 = await sign.deletePartyRaw(party)
      await registry.deletePartyRaw(party.address, sig2.v, sig2.r, sig2.s)

      const got = await registry.getPartyDetailsByAddress(party.address)
      
      assert.equal(got.countryCode, "0x0000")
      assert.equal(got.partyId, "0x000000")
      assert.equal(got.roles.length, 0)
      assert.equal(got.operatorAddress, "0x0000000000000000000000000000000000000000")
      assert.equal(got.operatorDomain, "")
    })
  
    it("adminDeleteParty allows admin deletion of party", async () => {
      const domain = "https://node.ocn.org"
      await registry.setNode(domain, {from: accounts[1]})

      const country = toHex("DE")
      const id = toHex("ABC")
      await registry.setParty(country, id, [0, 6], accounts[1], {from: accounts[2]})

      await registry.adminDeleteParty(country, id)

      const got = await registry.getPartyDetailsByAddress(accounts[2])
      
      assert.equal(got.countryCode, "0x0000")
      assert.equal(got.partyId, "0x000000")
      assert.equal(got.roles.length, 0)
      assert.equal(got.operatorAddress, "0x0000000000000000000000000000000000000000")
      assert.equal(got.operatorDomain, "")
    })

    it("setPartyModules allows setting of ocpi module implementations", async () => {
      const domain = "https://node.ocn.org"
      await registry.setNode(domain, {from: accounts[1]})

      const country = toHex("DE")
      const id = toHex("ABC")
      await registry.setParty(country, id, [0, 6], accounts[1], {from: accounts[2]})

      await registry.setPartyModules([1], [2, 3], {from: accounts[2]})

      const got = await registry.getPartyDetailsByAddress(accounts[2])

      assert.equal(got.modulesSender.length, 1)
      assert.equal(got.modulesReceiver.length, 2)
    })

    it("setPartyModules allows deletion of modules", async () => {
      const domain = "https://node.ocn.org"
      await registry.setNode(domain, {from: accounts[1]})

      const country = toHex("DE")
      const id = toHex("ABC")
      await registry.setParty(country, id, [0, 6], accounts[1], {from: accounts[2]})

      await registry.setPartyModules([1], [2, 3], {from: accounts[2]})
      await registry.setPartyModules([], [], {from: accounts[2]})

      const got = await registry.getPartyDetailsByAddress(accounts[2])

      assert.equal(got.modulesSender.length, 0)
      assert.equal(got.modulesReceiver.length, 0)
    })

    it("setPartyModulesRaw allows setting of modules by different wallet", async () => {
      const domain = "https://node.ocn.org"
      await registry.setNode(domain, {from: accounts[1]})

      const party = ethers.Wallet.createRandom()

      const country = toHex("DE")
      const id = toHex("ABC")
      const sig1 = await sign.setPartyRaw(country, id, [1, 2], accounts[1], party)
      await registry.setPartyRaw(party.address, country, id, [1, 2], accounts[1], sig1.v, sig1.r, sig1.s)

      const sender = [1, 2]
      const receiver = []
      const sig2 = await sign.setPartyModulesRaw(sender, receiver, party)
      await registry.setPartyModulesRaw(party.address, sender, receiver, sig2.v, sig2.r, sig2.s)

      const got = await registry.getPartyDetailsByAddress(party.address)
      assert.equal(got.modulesSender.length, 2)
      assert.equal(got.modulesReceiver.length, 0)
    })

})

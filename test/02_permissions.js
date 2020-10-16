const ethers = require('ethers')
const BigNumber = require('bignumber.js')
const sign = require('./sign')

let Registry = artifacts.require('Registry')
let Permissions = artifacts.require("Permissions")

contract('Permissions', function (accounts) {

  let registry
  let permissions
  const privateKey = '0x49b2e2b48cfc25fda1d1cbdb2197b83902142c6da502dcf1871c628ea524f11b'
  const wallet = new ethers.Wallet(privateKey)

  const toHex = (str) => {
    return "0x" + Buffer.from(str).toString("hex")
  }

  const allToBN = (arrayLike) => {
    return arrayLike.map(entry => new BigNumber(entry))
  }

  beforeEach(async () => {
    registry = await Registry.new()
    permissions = await Permissions.new(registry.address)
    await registry.setNode("http://localhost:8080", { from: accounts[1] })

    // add the wallet above to the registry
    const parties = [{
      country: toHex("DE"), id: toHex("ACB"),
      country: toHex("CH"), id: toHex("DEF")
    }]
    for (const party of parties) {
      const sig = await sign.setPartyRaw(party.country, party.id, [5], accounts[1], wallet)
      await registry.setPartyRaw(wallet.address, party.country, party.id, [5], accounts[1], sig.v, sig.r, sig.s)
    }
  })
  
  const serviceInfo = [
    {name: "ezPAY", url: "http://ez.pay.io"},
    {name: "", url: "http://ez.pay.io"},
    {name: "ezPAY", url: ""},
    {name: "", url: ""}
  ]

  serviceInfo.forEach((service) => {
    it(`should add service with name: ${service.name}, url: ${service.url}`, async () => {
      const needs = [0, 1]
      await registry.setParty(toHex("DE"), toHex("MSP"), [5], accounts[1], { from: accounts[2] })
      await permissions.setService(service.name, service.url, needs, { from: accounts[2] })
      const actual = await permissions.getService(accounts[2])
      assert.equal(actual.name, service.name)
      assert.equal(actual.url, service.url)
      assert.deepEqual(allToBN(actual.permissions), allToBN(needs))
    })
  })


  it("should update service", async () => {
    const name = "ezPAY"
    const url = "https://ez.pay.io/info"
    const needs = [0, 1, 3]
    await registry.setParty(toHex("DE"), toHex("MSP"), [1], accounts[1], { from: accounts[2] })
    await permissions.setService(name, "http://ez.pay.io", [0, 1], { from: accounts[2] })
    await permissions.setService(name, url, needs, { from: accounts[2] })
    const actual = await permissions.getService(accounts[2])
    assert.equal(actual.countryCode, toHex("DE"))
    assert.equal(actual.partyId, toHex("MSP"))
    assert.equal(actual.name, name)
    assert.equal(actual.url, url)
    assert.deepEqual(allToBN(actual.permissions), allToBN(needs))
  })

  serviceInfo.forEach((service) => {
    it(`should set service with name: ${service.name}, url: ${service.url} using raw transaction`, async () => {
      const needs = [0, 1]
      const signature = await sign.setServiceRaw(service.name, service.url, needs, wallet)
      await permissions.setServiceRaw(service.name, service.url, needs, signature.v, signature.r, signature.s)
      const actual = await permissions.getService(wallet.address)
      assert.equal(actual.name, service.name)
      assert.equal(actual.url, service.url)
      assert.deepEqual(allToBN(actual.permissions), allToBN(needs))
    })
  })

  it("should delete service", async () => {
    const name = "ezPAY"
    const url = "http://ez.pay.io"
    const needs = [0, 1]
    await registry.setParty(toHex("DE"), toHex("MSP"), [5], accounts[1], { from: accounts[2] })
    await permissions.setService(name, url, needs, { from: accounts[2] })

    await permissions.deleteService({ from: accounts[2] })

    const actual = await permissions.getService(accounts[2])
    assert.equal(actual.name, "")
    assert.equal(actual.url, "")
    assert.deepEqual(allToBN(actual.permissions), allToBN([]))
  })

  it("should delete service using raw transaction", async () => {
    const provider = ethers.Wallet.createRandom()
    const name = "ezPAY"
    const url = "http://ez.pay.io"
    const needs = [0, 1]
    const country = toHex("DE")
    const id = toHex("MSP")
    const sig1 = await sign.setPartyRaw(country, id, [1, 2], accounts[1], provider)
    await registry.setPartyRaw(provider.address, country, id, [1, 2], accounts[1], sig1.v, sig1.r, sig1.s)
    
    const sig2 = await sign.setServiceRaw(name, url, needs, provider)
    await permissions.setServiceRaw(name, url, needs, sig2.v, sig2.r, sig2.s)

    const sig3 = await sign.deleteServiceRaw(provider)
    await permissions.deleteServiceRaw(provider.address, sig3.v, sig3.r, sig3.s)

    const actual = await permissions.getService(provider.address)
    assert.equal(actual.name, "")
    assert.equal(actual.url, "")
    assert.deepEqual(allToBN(actual.permissions), allToBN([]))
  })

  it("should create agreement", async () => {
    await registry.setParty(toHex("DE"), toHex("MSP"), [5], accounts[1], {from: accounts[2]})
    await registry.setParty(toHex("CH"), toHex("CPO"), [0], accounts[1], {from: accounts[3]})
    await permissions.setService("voiceIn", "https://in.voice.ni", [1], {from: accounts[2]})
    await permissions.createAgreement(accounts[2], {from: accounts[3]})
    const actual = await permissions.getUserAgreementsByAddress(accounts[3])
    assert.deepEqual(actual, [accounts[2]])
    const actual2 = await permissions.getUserAgreementsByOcpi(toHex("CH"), toHex("CPO"))
    assert.deepEqual(actual2, [accounts[2]])
  })

  it("should create agreement via raw transaction", async () => {
    await registry.setParty(toHex("DE"), toHex("MSP"), [5], accounts[1], {from: accounts[2]})
    await permissions.setService("voiceIn", "https://in.voice.ni", [1], {from: accounts[2]})

    const sig = await sign.createAgreementRaw(accounts[2], wallet)
    await permissions.createAgreementRaw(accounts[2], sig.v, sig.r, sig.s)

    const actual = await permissions.getUserAgreementsByAddress(wallet.address)
    assert.deepEqual(actual, [accounts[2]])
  })

  it("should revoke agreement", async () => {
    await registry.setParty(toHex("DE"), toHex("MSP"), [5], accounts[1], {from: accounts[2]})
    await registry.setParty(toHex("CH"), toHex("CPO"), [0], accounts[1], {from: accounts[3]})
    await permissions.setService("voiceIn", "https://in.voice.ni", [1], {from: accounts[2]})
    await permissions.createAgreement(accounts[2], {from: accounts[3]})
    await permissions.revokeAgreement(accounts[2], {from: accounts[3]})
    const actual = await permissions.getUserAgreementsByAddress(accounts[2])
    assert.deepEqual(actual, [])
  })  

  it("should revoke agreement via raw transaction", async () => {
    await registry.setParty(toHex("DE"), toHex("MSP"), [5], accounts[1], {from: accounts[2]})
    await permissions.setService("voiceIn", "https://in.voice.ni", [1], {from: accounts[2]})

    const sig = await sign.createAgreementRaw(accounts[2], wallet)
    await permissions.createAgreementRaw(accounts[2], sig.v, sig.r, sig.s)

    const sig1 = await sign.revokeAgreementRaw(accounts[2], wallet)
    await permissions.revokeAgreementRaw(accounts[2], sig1.v, sig1.r, sig1.s)

    const actual = await permissions.getUserAgreementsByAddress(accounts[2])
    assert.deepEqual(actual, [])
  })
})
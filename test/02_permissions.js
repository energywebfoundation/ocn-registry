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
    const country = toHex("DE")
    const id = toHex("ACB")
    const sig = await sign.setPartyRaw(country, id, [5], accounts[1], wallet)
    await registry.setPartyRaw(wallet.address, country, id, [5], accounts[1], sig.v, sig.r, sig.s)
  })

  it("should add app", async () => {
    const name = "ezPAY"
    const url = "http://ez.pay.io"
    const needs = [0, 1]
    await registry.setParty(toHex("DE"), toHex("MSP"), [5], accounts[1], { from: accounts[2] })
    await permissions.setApp(name, url, needs, { from: accounts[2] })
    const actual = await permissions.getApp(accounts[2])
    assert.equal(actual.name, name)
    assert.equal(actual.url, url)
    assert.deepEqual(allToBN(actual.permissions), allToBN(needs))
  })

  it("should update app", async () => {
    const name = "ezPAY"
    const url = "https://ez.pay.io/info"
    const needs = [0, 1, 3]
    await registry.setParty(toHex("DE"), toHex("MSP"), [1], accounts[1], { from: accounts[2] })
    await permissions.setApp(name, "http://ez.pay.io", [0, 1], { from: accounts[2] })
    await permissions.setApp(name, url, needs, { from: accounts[2] })
    const actual = await permissions.getApp(accounts[2])
    assert.equal(actual.name, name)
    assert.equal(actual.url, url)
    assert.deepEqual(allToBN(actual.permissions), allToBN(needs))
  })

  it("should set app using raw transaction", async () => {
    const name = "ezPAY"
    const url = "http://ez.pay.io"
    const needs = [0, 1]
    const signature = await sign.setAppRaw(name, url, needs, wallet)
    await permissions.setAppRaw(name, url, needs, signature.v, signature.r, signature.s)
    const actual = await permissions.getApp(wallet.address)
    assert.equal(actual.name, name)
    assert.equal(actual.url, url)
    assert.deepEqual(allToBN(actual.permissions), allToBN(needs))
  })

})
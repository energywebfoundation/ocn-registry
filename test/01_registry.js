const ethers = require('ethers')
const BigNumber = require('bignumber.js')
const sign = require('../lib/sign')

var Registry = artifacts.require('Registry')

contract('Registry', function (accounts) {

    let registry
    const privateKey = '0x49b2e2b48cfc25fda1d1cbdb2197b83902142c6da502dcf1871c628ea524f11b'
    const wallet = new ethers.Wallet(privateKey)
  
    beforeEach(async () => {
      registry = await Registry.new()
    })
  
    it('accepts a signed registration', async () => {
        const countryCode = '0x' + Buffer.from('DE').toString('hex')
        const partyID = '0x' + Buffer.from('SNC').toString('hex')
        const serverAddr = 'https://app.server.com/api/v2'
        const sig = await sign.registerOrUpdate(countryCode, partyID, serverAddr, wallet)
        await registry.register(countryCode, partyID, serverAddr, sig.v, sig.r, sig.s)
        assert.equal(await registry.addressOf(countryCode, partyID), wallet.address)
        assert.equal(await registry.brokerOf(wallet.address), serverAddr)
    })

    it('does not allow registration of same party twice', async () => {
      const countryCode = '0x' + Buffer.from('DE').toString('hex')
      const partyID = '0x' + Buffer.from('SNC').toString('hex')
      const serverAddr = 'https://app.server.com/api/v2'
      const sig = await sign.registerOrUpdate(countryCode, partyID, serverAddr, wallet)
      await registry.register(countryCode, partyID, serverAddr, sig.v, sig.r, sig.s)
      assert.equal(await registry.addressOf(countryCode, partyID), wallet.address)
      assert.equal(await registry.brokerOf(wallet.address), serverAddr)
      
      const serverAddr2 = 'https://broker.company.net/'
      const sig2 = await sign.registerOrUpdate(countryCode, partyID, serverAddr2, wallet)
      try {
        await registry.register(countryCode, partyID, serverAddr, sig2.v, sig2.r, sig2.s)
      } catch (err) {
        assert.isTrue(err.message.endsWith('Party ID already exists in registry.'))
        assert.equal(await registry.addressOf(countryCode, partyID), wallet.address)
        assert.equal(await registry.brokerOf(wallet.address), serverAddr)
      }
    })

    it('allows update of broker url from registered signer', async () => {
      const countryCode = '0x' + Buffer.from('DE').toString('hex')
      const partyID = '0x' + Buffer.from('SNC').toString('hex')
      const serverAddr = 'https://app.server.com/api/v2'
      const sig = await sign.registerOrUpdate(countryCode, partyID, serverAddr, wallet)
      await registry.register(countryCode, partyID, serverAddr, sig.v, sig.r, sig.s)
      assert.equal(await registry.addressOf(countryCode, partyID), wallet.address)
      assert.equal(await registry.brokerOf(wallet.address), serverAddr)

      const serverAddr2 = 'https://broker.company.net/'
      const sig2 = await sign.registerOrUpdate(countryCode, partyID, serverAddr2, wallet)
      await registry.updateBrokerURL(countryCode, partyID, serverAddr2, sig2.v, sig2.r, sig2.s)
      assert.equal(await registry.addressOf(countryCode, partyID), wallet.address)
      assert.equal(await registry.brokerOf(wallet.address), serverAddr2)
    })

    it('does not allow update of broker url by different wallet', async () => {
      const countryCode = '0x' + Buffer.from('DE').toString('hex')
      const partyID = '0x' + Buffer.from('SNC').toString('hex')
      const serverAddr = 'https://app.server.com/api/v2'
      const sig = await sign.registerOrUpdate(countryCode, partyID, serverAddr, wallet)
      await registry.register(countryCode, partyID, serverAddr, sig.v, sig.r, sig.s)
      assert.equal(await registry.addressOf(countryCode, partyID), wallet.address)
      assert.equal(await registry.brokerOf(wallet.address), serverAddr)

      const serverAddr2 = 'https://broker.company.net/'
      try {
        const sig2 = await sign.registerOrUpdate(countryCode, partyID, serverAddr2, ethers.Wallet.createRandom())
        await registry.updateBrokerURL(countryCode, partyID, serverAddr2, sig2.v, sig2.r, sig2.s)
      } catch (err) {
        assert.isTrue((err.message.endsWith('Unauthorized to update this entry in the registry.')))
        assert.equal(await registry.addressOf(countryCode, partyID), wallet.address)
        assert.equal(await registry.brokerOf(wallet.address), serverAddr)
      }
    })

    it('allows deletion of registration data', async () => {
      const countryCode = '0x' + Buffer.from('DE').toString('hex')
      const partyID = '0x' + Buffer.from('SNC').toString('hex')
      const serverAddr = 'https://app.server.com/api/v2'
      const sig = await sign.registerOrUpdate(countryCode, partyID, serverAddr, wallet)
      await registry.register(countryCode, partyID, serverAddr, sig.v, sig.r, sig.s)
      assert.equal(await registry.addressOf(countryCode, partyID), wallet.address)
      assert.equal(await registry.brokerOf(wallet.address), serverAddr)
      const sig2 = await sign.deregister(countryCode, partyID, wallet)
      await registry.deregister(countryCode, partyID, sig2.v, sig2.r, sig2.s)
      assert.equal(await registry.addressOf(countryCode, partyID), '0x0000000000000000000000000000000000000000')
      assert.equal(await registry.brokerOf(wallet.address), '')
    })

    it('does not allow deletion of registration data by different wallet', async () => {
      const countryCode = '0x' + Buffer.from('DE').toString('hex')
      const partyID = '0x' + Buffer.from('SNC').toString('hex')
      const serverAddr = 'https://app.server.com/api/v2'
      const sig = await sign.registerOrUpdate(countryCode, partyID, serverAddr, wallet)
      await registry.register(countryCode, partyID, serverAddr, sig.v, sig.r, sig.s)
      assert.equal(await registry.addressOf(countryCode, partyID), wallet.address)
      assert.equal(await registry.brokerOf(wallet.address), serverAddr)
      const sig2 = await sign.deregister(countryCode, partyID, ethers.Wallet.createRandom())
      try {
        await registry.deregister(countryCode, partyID, sig2.v, sig2.r, sig2.s)
      } catch (err) {
        assert.isTrue(err.message.endsWith('Unauthorized to remove this entry from the registry.'))
        assert.equal(await registry.addressOf(countryCode, partyID), wallet.address)
        assert.equal(await registry.brokerOf(wallet.address), serverAddr)
      }
    })

    it('allows admin to overwrite an entry in the registry', async () => {
      const countryCode = '0x' + Buffer.from('DE').toString('hex')
      const partyID = '0x' + Buffer.from('SNC').toString('hex')
      const serverAddr = 'https://app.server.com/api/v2'
      const sig = await sign.registerOrUpdate(countryCode, partyID, serverAddr, wallet)
      await registry.register(countryCode, partyID, serverAddr, sig.v, sig.r, sig.s)
      assert.equal(await registry.addressOf(countryCode, partyID), wallet.address)
      assert.equal(await registry.brokerOf(wallet.address), serverAddr)
      
      await registry.adminOverwrite(countryCode, partyID, '0x0000000000000000000000000000000000000000', '')
      assert.equal(await registry.addressOf(countryCode, partyID), '0x0000000000000000000000000000000000000000')
      assert.equal(await registry.brokerOf(wallet.address), '')
    })

})

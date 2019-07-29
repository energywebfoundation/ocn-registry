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
        const clientURL = 'https://app.server.com/api/v2'
        const clientAddress = ethers.Wallet.createRandom().address
        const sig = await sign.registerOrUpdate(countryCode, partyID, clientURL, clientAddress, wallet)
        await registry.register(countryCode, partyID, clientURL, clientAddress, sig.v, sig.r, sig.s)
        assert.equal(await registry.clientURLOf(countryCode, partyID), clientURL)
        assert.equal(await registry.clientAddressOf(countryCode, partyID), clientAddress)
    })

    it('does not allow registration of same party twice', async () => {
      const countryCode = '0x' + Buffer.from('DE').toString('hex')
      const partyID = '0x' + Buffer.from('SNC').toString('hex')
      const clientURL = 'https://app.server.com/api/v2'
      const clientAddress = ethers.Wallet.createRandom().address
      const sig = await sign.registerOrUpdate(countryCode, partyID, clientURL, clientAddress, wallet)
      await registry.register(countryCode, partyID, clientURL, clientAddress, sig.v, sig.r, sig.s)
      assert.equal(await registry.clientURLOf(countryCode, partyID), clientURL)
      assert.equal(await registry.clientAddressOf(countryCode, partyID), clientAddress)
      
      const clientURL2 = 'https://broker.company.net/'
      const sig2 = await sign.registerOrUpdate(countryCode, partyID, clientURL2, clientAddress, wallet)
      try {
        await registry.register(countryCode, partyID, clientURL2, clientAddress, sig2.v, sig2.r, sig2.s)
      } catch (err) {
        assert.isTrue(err.message.endsWith('Party ID already exists in registry.'))
        assert.equal(await registry.clientURLOf(countryCode, partyID), clientURL)
        assert.equal(await registry.clientAddressOf(countryCode, partyID), clientAddress)
      }
    })

    it('allows update of client url from registered signer', async () => {
      const countryCode = '0x' + Buffer.from('DE').toString('hex')
      const partyID = '0x' + Buffer.from('SNC').toString('hex')
      const clientURL = 'https://app.server.com/api/v2'
      const clientAddress = ethers.Wallet.createRandom().address
      const sig = await sign.registerOrUpdate(countryCode, partyID, clientURL, clientAddress, wallet)
      await registry.register(countryCode, partyID, clientURL, clientAddress, sig.v, sig.r, sig.s)
      assert.equal(await registry.clientURLOf(countryCode, partyID), clientURL)
      assert.equal(await registry.clientAddressOf(countryCode, partyID), clientAddress)

      const clientURL2 = 'https://broker.company.net/'
      const clientAddress2 = ethers.Wallet.createRandom().address
      const sig2 = await sign.registerOrUpdate(countryCode, partyID, clientURL2, clientAddress2, wallet)
      await registry.updateClientInfo(countryCode, partyID, clientURL2, clientAddress2, sig2.v, sig2.r, sig2.s)
      assert.equal(await registry.clientURLOf(countryCode, partyID), clientURL2)
      assert.equal(await registry.clientAddressOf(countryCode, partyID), clientAddress2)
    })

    it('does not allow update of client url by different wallet', async () => {
      const countryCode = '0x' + Buffer.from('DE').toString('hex')
      const partyID = '0x' + Buffer.from('SNC').toString('hex')
      const clientURL = 'https://app.server.com/api/v2'
      const clientAddress = ethers.Wallet.createRandom().address
      const sig = await sign.registerOrUpdate(countryCode, partyID, clientURL, clientAddress, wallet)
      await registry.register(countryCode, partyID, clientURL, clientAddress, sig.v, sig.r, sig.s)
      assert.equal(await registry.clientURLOf(countryCode, partyID), clientURL)
      assert.equal(await registry.clientAddressOf(countryCode, partyID), clientAddress)

      const clientURL2 = 'https://broker.company.net/'
      try {
        const sig2 = await sign.registerOrUpdate(countryCode, partyID, clientURL2, clientAddress, ethers.Wallet.createRandom())
        await registry.updateClientInfo(countryCode, partyID, clientURL2, clientAddress, sig2.v, sig2.r, sig2.s)
      } catch (err) {
        assert.isTrue((err.message.endsWith('Unauthorized to update this entry in the registry.')))
        assert.equal(await registry.clientURLOf(countryCode, partyID), clientURL)
        assert.equal(await registry.clientAddressOf(countryCode, partyID), clientAddress)
      }
    })

    it('allows deletion of registration data', async () => {
      const countryCode = '0x' + Buffer.from('DE').toString('hex')
      const partyID = '0x' + Buffer.from('SNC').toString('hex')
      const clientURL = 'https://app.server.com/api/v2'
      const clientAddress = ethers.Wallet.createRandom().address
      const sig = await sign.registerOrUpdate(countryCode, partyID, clientURL, clientAddress, wallet)
      await registry.register(countryCode, partyID, clientURL, clientAddress, sig.v, sig.r, sig.s)
      assert.equal(await registry.clientURLOf(countryCode, partyID), clientURL)
      assert.equal(await registry.clientAddressOf(countryCode, partyID), clientAddress)
      const sig2 = await sign.deregister(countryCode, partyID, wallet)
      await registry.deregister(countryCode, partyID, sig2.v, sig2.r, sig2.s)
      assert.equal(await registry.clientURLOf(countryCode, partyID), '')
      assert.equal(await registry.clientAddressOf(countryCode, partyID), '0x0000000000000000000000000000000000000000')
    })

    it('does not allow deletion of registration data by different wallet', async () => {
      const countryCode = '0x' + Buffer.from('DE').toString('hex')
      const partyID = '0x' + Buffer.from('SNC').toString('hex')
      const clientURL = 'https://app.server.com/api/v2'
      const clientAddress = ethers.Wallet.createRandom().address
      const sig = await sign.registerOrUpdate(countryCode, partyID, clientURL, clientAddress, wallet)
      await registry.register(countryCode, partyID, clientURL, clientAddress, sig.v, sig.r, sig.s)
      assert.equal(await registry.clientURLOf(countryCode, partyID), clientURL)
      assert.equal(await registry.clientAddressOf(countryCode, partyID), clientAddress)
      const sig2 = await sign.deregister(countryCode, partyID, ethers.Wallet.createRandom())
      try {
        await registry.deregister(countryCode, partyID, sig2.v, sig2.r, sig2.s)
      } catch (err) {
        assert.isTrue(err.message.endsWith('Unauthorized to remove this entry from the registry.'))
        assert.equal(await registry.clientURLOf(countryCode, partyID), clientURL)
      assert.equal(await registry.clientAddressOf(countryCode, partyID), clientAddress)
      }
    })

    it('allows admin to overwrite an entry in the registry', async () => {
      const countryCode = '0x' + Buffer.from('DE').toString('hex')
      const partyID = '0x' + Buffer.from('SNC').toString('hex')
      const clientURL = 'https://app.server.com/api/v2'
      const clientAddress = ethers.Wallet.createRandom().address
      const sig = await sign.registerOrUpdate(countryCode, partyID, clientURL, clientAddress, wallet)
      await registry.register(countryCode, partyID, clientURL, clientAddress, sig.v, sig.r, sig.s)
      assert.equal(await registry.clientURLOf(countryCode, partyID), clientURL)
      assert.equal(await registry.clientAddressOf(countryCode, partyID), clientAddress)
      
      await registry.adminOverwrite(countryCode, partyID, '0x0000000000000000000000000000000000000000', '', '0x0000000000000000000000000000000000000000')
      assert.equal(await registry.clientURLOf(countryCode, partyID), '')
      assert.equal(await registry.clientAddressOf(countryCode, partyID), '0x0000000000000000000000000000000000000000')
    })

})

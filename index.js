import express from 'express'
import cors from 'cors'
import axios from 'axios'
import { NFTStorage, File } from 'nft.storage'
import Blob from 'cross-blob'
import { ethers } from 'ethers'
import dotenv from 'dotenv'

dotenv.config()
const app = express()

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://minting-rafts-frontend.vercel.app',
    ],
    credentials: true,
  }),
)
app.use(express.json())

const {
  ALCHEMY_GOERLI,
  ALCHEMY_OPTIMISM,
  ALCHEMY_OPTIMISM_GOERLI,
  RAFT_GOERLI,
  RAFT_OPTIMISM_GOERLI,
  RAFT_OPTIMISM,
  DEPLOYER_PRIVATE_KEY,
  NFT_STORAGE_KEY,
} = process.env
console.log('🚀 ~ NFT_STORAGE_KEY:', NFT_STORAGE_KEY)
console.log('🚀 ~ DEPLOYER_PRIVATE_KEY:', DEPLOYER_PRIVATE_KEY)
console.log('🚀 ~ RAFT_OPTIMISM:', RAFT_OPTIMISM)
console.log('🚀 ~ RAFT_OPTIMISM_GOERLI:', RAFT_OPTIMISM_GOERLI)
console.log('🚀 ~ RAFT_GOERLI:', RAFT_GOERLI)
console.log('🚀 ~ ALCHEMY_OPTIMISM_GOERLI:', ALCHEMY_OPTIMISM_GOERLI)
console.log('🚀 ~ ALCHEMY_OPTIMISM:', ALCHEMY_OPTIMISM)
console.log('🚀 ~ ALCHEMY_GOERLI:', ALCHEMY_GOERLI)

app.post('/create-raft', async (req, res) => {
  try {
    const { name, recipient, network } = req.body
    console.log('🚀 ~ app.post ~ recipient:', recipient)
    console.log('🚀 ~ app.post ~ name:', name)
    console.log('🚀 ~ app.post ~ network:', network)
    const metadata = {
      name,
      description: 'Otterspace Raft',
      properties: {
        parentRaftTokenId: null,
        generation: 0,
      },
      image:
        'ipfs://bafybeif5lmqxi42r4ymlaqkbqxn6xroeh63tbhhmee2lyxxrz7k7mbxtjq',
    }

    const myDataBlob = new Blob([JSON.stringify(metadata)], {
      type: 'application/json',
    })
    console.log('uploading metadata to nft.storage...')
    const client = new NFTStorage({ token: NFT_STORAGE_KEY })
    const cid = await client.storeBlob(myDataBlob)
    const uri = `ipfs://${cid}`
    console.log('uploaded metadata to nft.storage... ', uri)

    let providerUrl = ''
    let raftContractAddress = ''
    switch (network) {
      case 'goerli':
        providerUrl = ALCHEMY_GOERLI
        raftContractAddress = RAFT_GOERLI
        break
      case 'optimism':
        providerUrl = ALCHEMY_OPTIMISM
        raftContractAddress = RAFT_OPTIMISM
        break
      case 'optimism-goerli':
        providerUrl = ALCHEMY_OPTIMISM_GOERLI
        raftContractAddress = RAFT_OPTIMISM_GOERLI
        break
      default:
        providerUrl = ALCHEMY_GOERLI
        raftContractAddress = RAFT_GOERLI
    }

    console.log('🚀 ~ app.post ~ providerUrl:', providerUrl)
    console.log('🚀 ~ app.post ~ raftContractAddress:', raftContractAddress)
    const provider = ethers.getDefaultProvider(providerUrl)
    const signer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider)

    // Initialize the raft contract interface
    const raftContract = new ethers.Contract(
      raftContractAddress,
      ['function mint(address recipient, string specUri) public'],
      signer,
    )

    const gasLimit = 1000000 // Specify the gas limit you want to use

    const tx = await raftContract.mint(recipient, uri, { gasLimit })
    console.log('🚀 ~ tx submited, waiting...')
    const txRes = await tx.wait()
    console.log('🚀 ~ app.post ~ txRes:', txRes)

    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})

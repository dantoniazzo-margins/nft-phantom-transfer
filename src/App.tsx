import React, { useState, useEffect } from 'react';
import axios from 'axios'
import { Transaction, PublicKey, Connection, clusterApiUrl } from '@solana/web3.js'
import './App.css';

function App() {

  const [walletAddress, setWalletAddress] = useState(null)
  const [transactions, setTransactions] = useState([])


  let connection = new Connection(clusterApiUrl('devnet'))

  const connectWalletEagerly = async () => {
    const { solana } = window
    if(solana.isPhantom){
      const response = await solana.connect({ onlyIfTrusted: true})
      setWalletAddress(response.publicKey.toString())
    }
  }

  const connectWallet = async () => {
    const { solana } = window
    if(solana.isPhantom){
      const response = await solana.connect()
      setWalletAddress(response.publicKey.toString())
    }
  }

  const sendTransactionToken = () => {
    axios.get('http://localhost:3003/transfer-token-wallet-wallet')
    .then(res => {
      console.log("Token transaction: ", res)
      setTransactions(res.data.transaction)
    })
    .catch(err => console.log("Error: ", err))
  }

  useEffect(() => {
    connectWalletEagerly()
  }, [])

  const sendTransactionNft = () => {
    axios.get('http://localhost:3003/transfer-nft-wallet-wallet')
    .then(res => {
      console.log("Nft transaction: ", res)
      setTransactions(res.data.transactions)
    })
  }

 
  const signAndFinalizeTransaction = async (transaction: any) => {

    const fixedkeys0 = transaction[0].instructions[0].keys.map((key: any) => {
      return {...key, pubkey: new PublicKey(key.pubkey)}
    })

    const fixedkeys1 = transaction[1].instructions[0].keys.map((key: any) => {
      return {...key, pubkey: new PublicKey(key.pubkey)}
    })

    transaction[0].instructions[0].keys = fixedkeys0
    transaction[1].instructions[0].keys = fixedkeys1
  
    transaction[0].feePayer = new PublicKey(transaction[0].feePayer)
    transaction[1].feePayer = new PublicKey(transaction[1].feePayer)

    let newTransaction0 = new Transaction()
    let newTransaction1 = new Transaction()
    
    newTransaction0.recentBlockhash = transaction[0].recentBlockhash;
    newTransaction0.instructions = transaction[0].instructions;
    newTransaction0.feePayer = transaction[0].feePayer

    newTransaction1.recentBlockhash = transaction[1].recentBlockhash;
    newTransaction1.instructions = transaction[1].instructions;
    newTransaction1.feePayer = transaction[1].feePayer

    console.log("New transaction 0: ", newTransaction0)
    console.log("New transaction 1: ", newTransaction1)
    let signature = await window.solana.signAllTransactions([newTransaction0, newTransaction1]);

    connection.sendRawTransaction(signature[0].serialize()).then(res => {
      console.log("Finalized transaction 1: ", res)
      connection.sendRawTransaction(signature[1].serialize())
      .then(res => {
        console.log("Finalized transaction 2: ", res)
      })
      .catch(err => console.log("Error: ", err))
      })
      .catch(err => console.log("Error: ", err))
  }


 

  return (
    <div className="App">
     <h1>NFT Phantom Wallet Transfer App</h1>
      <div className="buttons">
        {
          !walletAddress && 
          <button onClick={connectWallet} className="btn-hover color-1">CONNECT WALLET</button>
        }
        {
          walletAddress && !transactions.length && 
          <button className="btn-hover color-2" onClick={sendTransactionToken}>Send Transaction</button>
        }
        {
          walletAddress && !transactions.length &&
          <button className="btn-hover color-3" onClick={sendTransactionNft}>Send NFT Transaction</button>
        }
        {
          transactions && transactions.length !== 0 &&
          <button className="btn-hover color-4" onClick={() => {
            signAndFinalizeTransaction(transactions)
          }}>Sign Transaction</button>
        }
       <p><b>Public key:</b> {walletAddress}</p>
      </div>
    </div>
  );
}

export default App;

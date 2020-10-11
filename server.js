/*
MIT License

Copyright (c) 2020 David Barton

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

'use strict'

const express = require('express')
const cors = require('cors')
const githubStreakScraper = require('github-streak-scraper')
const request = require('request')
const oneyPlays = require('oneyplays-api')
const getMyRank = require('get-my-rank-on-commits-top')
const { recommend, getId, search } = require('twin-peaks-api')

let parsedResult

async function apiCall(options) {
  // (I.) promise to return the parsedResult for processing
  function rawgRequest() {
    return new Promise(function (resolve, reject) {
      request(options, function (error, response, body) {
        try {
          resolve(JSON.parse(body))
        } catch (e) {
          reject(e)
        }
      })
    })
  }

  // (II.)
  try {
    parsedResult = await rawgRequest()
  } catch (e) {
    console.error(e)
  }
  return parsedResult
}

async function endpointCreation() {
  try {
    const app = express()
    app.use(cors())
    const port = process.env.PORT || 5000

    /******************************************/
    /******************************************/
    /****                                  ****/
    /****   GITHUB STREAK SCRAPER - api    ****/
    /****                                  ****/
    /******************************************/
    /******************************************/

    const getStreakData = async user => {
      try {
        const githubStreak = await githubStreakScraper(user)
        return githubStreak
      } catch (e) {
        console.error(e)
      }
    }

    app.get('/api/1/github-streak/:user', async (req, res) => {
      try {
        const user = req.params.user
        const githubStreakData = await getStreakData(user)

        githubStreakData.user ? res.json(githubStreakData) : res.status(404).json({ error: 'no such user available!' })
        console.log(`/api/1/github-streak/${user} endpoint has been called!`)
      } catch (e) {
        console.error(e)
        res.status(404).json({ error: 'no such user available!' })
      }
    })

    /******************************************/
    /******************************************/
    /****                                  ****/
    /****         ONEYPLAYS - api          ****/
    /****                                  ****/
    /******************************************/
    /******************************************/

    app.get('/api/1/oneyplays', (req, res) => {
      const query = req.query.q
      const searchResult = oneyPlays(query)
      res.json(searchResult)
      console.log(`/api/1/oneyplays?q=${query} endpoint has been called!`)
    })

    /******************************************/
    /******************************************/
    /****                                  ****/
    /****       GET MY RANK - api          ****/
    /****                                  ****/
    /******************************************/
    /******************************************/

    app.get('/api/1/get-my-rank', async (req, res) => {
      const userName = req.query.userName
      const country = req.query.country
      const rank = await getMyRank(userName, country)
      res.json(rank)
      console.log(`/api/1/get-my-rank?userName=${userName}&country=${country} endpoint has been called!`)
    })

    /******************************************/
    /******************************************/
    /****                                  ****/
    /****        TWIN PEAKS - api          ****/
    /****                                  ****/
    /******************************************/
    /******************************************/

    // providing endpoint for **random** quotes
    app.get('/api/1/quotes/recommend', (req, res) => {
      const recommendedResult = recommend(req.query.profanity, req.query.relevance)
      recommendedResult[0] ? res.json(recommendedResult) : res.status(404).json({ error: 'no such id!' }) // this condition won't be applied, error handling happens in randomizer()
      console.log(
        `/api/1/quotes/recommend?profanity=${req.query.profanity ? req.query.profanity : 'true,false'}&relevance=${
          req.query.relevance ? req.query.relevance : '1,2,3'
        } endpoint has been called!`
      )
    })

    // providing a dynamic endpoint for quotes by ID
    app.get('/api/1/quotes/:id', (req, res) => {
      const id = req.params.id
      const idResult = getId(id)
      idResult[0] ? res.json(idResult) : res.status(404).json({ error: 'no such id!' })
      console.log(`/api/1/quotes/${id} endpoint has been called!`)
    })

    // providing a dynamic endpoint for searches
    app.get('/api/1/quotes', (req, res) => {
      const query = req.query.q
      const personResult = search(query)
      res.json(personResult)
      console.log(`/api/1/quotes?q=${query} endpoint has been called!`)
    })

    /******************************************/
    /******************************************/
    /****                                  ****/
    /****             COMMON               ****/
    /****                                  ****/
    /******************************************/
    /******************************************/

    app.listen(port)

    console.log(
      `API is listening on ${port}
      \nAvailable endpoints:
      - /api/1/github-streak/:user
      - /api/1/get-my-rank
      - /api/1/oneyplays
      \nAvailable twin-peaks endpoints:
      - /api/1/quotes/recommend,
      - /api/1/quotes/:id,
      - /api/1/quotes
      `
    )
  } catch (e) {
    console.error(e)
  }
}
endpointCreation()

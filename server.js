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
const oneyPlays = require('oneyplays-api')

async function endpointCreation() {
  const getStreakData = async user => {
    try {
      const githubStreak = await githubStreakScraper(user)
      return githubStreak
    } catch (e) {
      console.error(e)
    }
  }

  // server
  try {
    const app = express()
    app.use(cors())
    const port = process.env.PORT || 5000

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

    app.get('/api/1/oneyplays', (req, res) => {
      const query = req.query.q
      const searchResult = oneyPlays(query)
      res.json(searchResult)
      console.log(`/api/1/oneyplays?q=${query} endpoint has been called!`)
    })

    app.listen(port)

    console.log(`API is listening on ${port}`)
  } catch (e) {
    console.error(e)
  }
}
endpointCreation()

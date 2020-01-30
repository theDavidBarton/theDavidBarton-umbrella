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
const compression = require('compression')
const oneyPlays = require('oneyplays-api')
const userAgent = { 'User-Agent': 'video-games-on-RAWG-react-app (GitHub)' }
const twinpeaks = require('./twinpeaksQuotes.json')

let parsedResult

async function apiCall(options) {
  // (I.) promise to return the parsedResult for processing
  function rawgRequest() {
    return new Promise(function(resolve, reject) {
      request(options, function(error, response, body) {
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
    /****     VIDEOGAMES ON RAWG - api     ****/
    /****                                  ****/
    /******************************************/
    /******************************************/

    const optionsTrending = {
      method: 'GET',
      headers: userAgent,
      url: 'https://api.rawg.io/api/games/lists/main',
      qs: {
        ordering: '-relevance',
        discover: true,
        page_size: 10
      }
    }

    const optionsTopRatedRecommended = {
      method: 'GET',
      headers: userAgent,
      url: 'https://api.rawg.io/api/games',
      qs: {
        ordering: '-added',
        page_size: 10
      }
    }

    const optionsVideogame = {
      method: 'GET',
      headers: userAgent,
      url: undefined
    }

    const optionsVideogameAutocomplete = {
      method: 'GET',
      headers: userAgent,
      url: 'https://api.rawg.io/api/games',
      qs: {
        search: undefined
      }
    }

    const optionsSearchArchive = {
      method: 'GET',
      headers: userAgent,
      url: 'https://archive.org/advancedsearch.php',
      qs: {
        q: undefined,
        rows: '5',
        page: '1',
        output: 'json',
        'fl[]': 'identifier',
        'sort[]': 'downloads desc'
      }
    }

    app.use(compression())
    /*
    app.use(express.static(path.join(__dirname, 'client/build')))
    // required to serve SPA on heroku production without routing problems; it will skip only 'api' calls
    if (process.env.NODE_ENV === 'production') {
      app.get(/^((?!(api)).)*$/, function(req, res) {
        res.set('Cache-Control', 'public, max-age=31536001')
        res.sendFile(path.join(__dirname, 'client/build', 'index.html'))
      })
    }
*/
    // providing a constant endpoint for trending videogames
    app.get('/api/trending', async (req, res) => {
      res.set('Cache-Control', 'no-cache')
      res.json(await apiCall(optionsTrending))
      console.log('/api/trending endpoint has been called!')
    })

    // providing a constant endpoint for a random top rated videogame
    app.get('/api/topRatedRecommended', async (req, res) => {
      const topRatedResponse = await apiCall(optionsTopRatedRecommended)
      const randomIndex = Math.floor(Math.random() * Math.floor(10)) // one page contains exactly 10 results
      const topRatedRandomVideogame = topRatedResponse.results[randomIndex]
      res.set('Cache-Control', 'no-cache')
      res.json(topRatedRandomVideogame)
      console.log('/api/topRatedRecommended endpoint has been called!')
    })

    // providing a dynamic endpoint to videogame detail pages
    app.get('/api/videogame/:rawgId', async (req, res) => {
      const id = req.params.rawgId.match(/\d+/)
      const getPrimaryDetails = async () => {
        optionsVideogame.url = `https://api.rawg.io/api/games/${id}`
        return await apiCall(optionsVideogame)
      }
      const getScreenshots = async () => {
        optionsVideogame.url = `https://api.rawg.io/api/games/${id}/screenshots`
        return await apiCall(optionsVideogame)
      }
      const getSuggested = async () => {
        optionsVideogame.url = `https://api.rawg.io/api/games/${id}/suggested`
        return await apiCall(optionsVideogame)
      }
      const getReviews = async () => {
        optionsVideogame.url = `https://api.rawg.io/api/games/${id}/reviews`
        return await apiCall(optionsVideogame)
      }
      const getYoutube = async () => {
        optionsVideogame.url = `https://api.rawg.io/api/games/${id}/youtube`
        return await apiCall(optionsVideogame)
      }
      const getDevTeam = async () => {
        optionsVideogame.url = `https://api.rawg.io/api/games/${id}/development-team`
        return await apiCall(optionsVideogame)
      }
      const getOneyplays = () => {
        let compatibilityOneyObj = []
        const oneyObj = oneyPlays(id)
        if (oneyObj.length > 0) {
          compatibilityOneyObj = [
            {
              ...oneyObj[0],
              external_id: oneyObj[0].yt_id,
              thumbnails: { medium: { url: oneyObj[0].yt_thumbnail } }
            }
          ]
        }
        return compatibilityOneyObj
      }

      const primary = await getPrimaryDetails()
      const secondary = await Promise.all([
        getScreenshots(),
        getSuggested(),
        getReviews(),
        getYoutube(),
        getDevTeam(),
        getOneyplays()
      ])
      const detailsCollected = {
        ...primary,
        screenshots: parseInt(primary.screenshots_count) > 0 ? secondary[0].results : [],
        suggested: parseInt(primary.suggestions_count) > 0 ? secondary[1].results : [],
        reviews: parseInt(primary.reviews_count) > 0 ? secondary[2].results : [],
        youtube: parseInt(primary.youtube_count) > 0 ? secondary[3].results : [],
        devteam: parseInt(primary.creators_count) > 0 ? secondary[4].results : [],
        oneyplays: secondary[5]
      }

      res.set('Cache-Control', 'no-cache')
      res.json(detailsCollected)
      console.log(`/api/videogame/${id} endpoint has been called!`)
    })

    // _Archive.org link to older titles
    // e.g.: https://archive.org/advancedsearch.php?q=title:(prehistorik) AND collection:(softwarelibrary^10) AND year:(1993) AND mediatype:(software)&fl[]=identifier&fl[]=title&fl[]=year&sort[]=downloads desc&rows=5&page=1&output=json
    app.get('/api/searchArchive', async (req, res) => {
      try {
        const queryTitle = req.query.title
        const queryYear = req.query.year
        optionsSearchArchive.qs.q = `title:(${queryTitle}) AND collection:(softwarelibrary^10) AND year:(${queryYear}) AND mediatype:(software)`
        res.set('Cache-Control', 'no-cache')
        res.json(await apiCall(optionsSearchArchive))
        console.log(`/api/searchArchive?title=${queryTitle}&year=${queryYear} endpoint has been called!`)
      } catch (e) {
        console.error(e)
      }
    })

    // providing a dynamic endpoint to videogame autocomplete
    app.get('/api/videogameAutocomplete', async (req, res) => {
      const query = req.query.q
      optionsVideogameAutocomplete.qs.search = query
      res.set('Cache-Control', 'no-cache')
      res.json(await apiCall(optionsVideogameAutocomplete))
      console.log(`/api/videogameAutocomplete?q=${query} endpoint has been called!`)
    })

    /******************************************/
    /******************************************/
    /****                                  ****/
    /****        TWIN PEAKS - api          ****/
    /****                                  ****/
    /******************************************/
    /******************************************/

    // random number from the available IDs
    const randomizer = quotesArray => {
      const quotesLength = twinpeaks.quotes.length
      const randomizeNumberBetweenZeroAnd = max => {
        return Math.floor(Math.random() * Math.floor(max))
      }
      const availableIdChecker = quotesArray => {
        const availableIds = quotesArray.map(el => el.id)
        return availableIds
      }
      const availableIds = availableIdChecker(quotesArray)
      let randomInteger = randomizeNumberBetweenZeroAnd(quotesLength)
      while (!availableIds.includes(randomInteger)) {
        // console.log(`${randomInteger} is not among ${availableIds}`)
        randomInteger = randomizeNumberBetweenZeroAnd(quotesLength)
      }
      return randomInteger
    }

    // providing endpoint for **random** quotes
    app.get('/api/1/quotes/recommend', (req, res) => {
      const twinpeaksQuotesArray = twinpeaks.quotes
      const profValue =
        req.query.profanity && req.query.profanity.match(/^(true|false)$/) ? req.query.profanity : 'true,false'
      const relValue =
        req.query.relevance && req.query.relevance.match(/^(1|2|3|1,2|2,3|1,3|1,2,3)$/) ? req.query.relevance : '1,2,3'

      const queriedArray = twinpeaksQuotesArray.filter(quote => {
        const profanityRegex = RegExp(quote.profanity, 'g')
        const relevanceRegex = RegExp(quote.relevance, 'g')
        if (profValue.match(profanityRegex) && relValue.match(relevanceRegex)) return quote
      })

      const randomId = randomizer(queriedArray)
      const recommendedResult = queriedArray.filter(quote => {
        if (quote.id == randomId) return quote
      })
      recommendedResult[0] ? res.json(recommendedResult) : res.status(404).json({ error: 'no such id!' }) // this condition won't be applied, error handling happens in randomizer()
      console.log(
        `/api/1/quotes/recommend?profanity=${profValue}&relevance=${relValue} endpoint has been called! => ${randomId}`
      )
    })

    // providing a dynamic endpoint for quotes by ID
    app.get('/api/1/quotes/:id', (req, res) => {
      const id = req.params.id
      const idResult = twinpeaks.quotes.filter(quote => {
        if (quote.id == id) return quote
      })
      idResult[0] ? res.json(idResult) : res.status(404).json({ error: 'no such id!' })
      console.log(`/api/1/quotes/${id} endpoint has been called!`)
    })

    // providing a dynamic endpoint for searches
    app.get('/api/1/quotes', (req, res) => {
      const query = req.query.q
      const queryRegex = RegExp(query, 'gi')
      const personResult = twinpeaks.quotes.filter(quote => {
        if (queryRegex.test(quote.quoteText)) return quote
      })
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
      - /api/1/oneyplays
      \nAvailable videogame endpoints:
      - /api/trending,
      - /api/topRatedRecommended,
      - /api/videogame/:rawgId,
      - /api/searchArchive,
      - /api/videogameAutocomplete
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

import { Router } from 'express'
import fetch from 'node-fetch'

const CLIENT_ID = process.env.DECAP_CLIENT_ID || 'Ov23liDkRqW3sDHHuoJJ'
const CLIENT_SECRET = process.env.DECAP_CLIENT_SECRET || '539dc1b3602616478ca7ac83ed2fe4ced77b9a65'
const OAUTH_URL = 'https://github.com/login/oauth/authorize'
const TOKEN_URL = 'https://github.com/login/oauth/access_token'

export function oauthRouter() {
  const router = Router()

  router.get('/auth', (req, res) => {
    const state = req.query.state || ''
    const redirectUri = `https://admin.ortopednn.ru/callback`
    const url = `${OAUTH_URL}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user&state=${encodeURIComponent(state)}`
    res.redirect(url)
  })

  router.get('/callback', async (req, res) => {
    const { code } = req.query
    if (!code) return res.status(400).send('Missing code')

    try {
      const resp = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
        }),
      })
      const data = await resp.json()
      const token = data.access_token
      if (!token) return res.status(400).send('Failed to get token: ' + (data.error_description || data.error))

      res.send(`<!doctype html>
<html><body><script>
(function() {
  var h = window.opener ? window.opener : window.parent
  h.postMessage({ type: 'OAUTH', token: '${token}', provider: 'github' }, '*')
  window.close()
})()
<\/script></body></html>`)
    } catch (err) {
      console.error('[oauth]', err)
      res.status(500).send('OAuth error')
    }
  })

  return router
}

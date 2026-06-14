import express from 'express'
import cookieParser from 'cookie-parser'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { getDb, migrate, seedAdmin } from './db.js'
import { checkAuth, loginHandler } from './auth.js'
import { router as projectsRouter, api as projectsApi } from './routes/projects.js'
import { router as statsRouter, api as statsApi } from './routes/stats.js'
import { router as draftsRouter, api as draftsApi } from './routes/drafts.js'
import { router as socialRouter, api as socialApi } from './routes/social.js'
import { router as pipelineRouter, api as pipelineApi } from './routes/pipeline.js'
import { router as settingsRouter, api as settingsApi } from './routes/settings.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.ADMIN_PORT || 3001

migrate()
seedAdmin()

const app = express()
app.set('view engine', 'ejs')
app.set('views', join(__dirname, 'views'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use('/admin', express.static(join(__dirname, 'public')))

// Auth routes (no middleware)
app.get('/admin/login', (req, res) => { res.render('login') })
app.post('/admin/login', loginHandler)
app.get('/admin/logout', (req, res) => { res.clearCookie('admin_token').redirect('/admin/login') })

// Admin page routes (cookie auth)
app.use('/admin/projects', checkAuth, projectsRouter)
app.use('/admin/stats', checkAuth, statsRouter)
app.use('/admin/content', checkAuth, draftsRouter)
app.use('/admin/social', checkAuth, socialRouter)
app.use('/admin/pipeline', checkAuth, pipelineRouter)
app.use('/admin/settings', checkAuth, settingsRouter)

// Admin API routes (header auth)
app.use('/api/admin/projects', checkAuth, projectsApi)
app.use('/api/admin/stats', checkAuth, statsApi)
app.use('/api/admin/content', checkAuth, draftsApi)
app.use('/api/admin/social', checkAuth, socialApi)
app.use('/api/admin/pipeline', checkAuth, pipelineApi)
app.use('/api/admin/settings', checkAuth, settingsApi)

// Default redirect
app.get('/admin', (req, res) => { res.redirect('/admin/projects') })

app.listen(PORT, () => console.log(`[admin] Content Factory on :${PORT}`))

export default app
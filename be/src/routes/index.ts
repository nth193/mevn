import useHealthCheck from "./health-check.route";
import useApiMetricPlugin from "./metrics.route";
import usePrometheusPlugin from "./prometheus.route";
import useDevServer from "./dev-server.route";
import useLog from './log.route';
import useUser from "./user.route";
import useKv from "./kv.route";
import useFile from "./file.route";
import useFolder from "./folder.route";
import useHmmApp from './hmm.app'
import Routerex from '@tvux/routerex';
import generateApiDocument from '@tvux/exdogen';
import express from "express";
import mongoSanitize from "express-mongo-sanitize"
import helmet from "helmet"
import xss from "xss-clean"
import rateLimit from "express-rate-limit"
import hpp from "hpp"

export default async function useRoutes(app) {
   await useHmmApp(app)

   const router = Routerex()
   await useDevServer(router)
   await useApiMetricPlugin(router)
   await useHealthCheck(router)
   await usePrometheusPlugin(router)
   await useLog(router)
   await useUser(router)
   await useKv(router)
   await useFile(router)
   await useFolder(router)
   const limiter = rateLimit({
      windowMs: 10 * 60 * 1000, // 10 minutes
      max: 200
   })
   app.use(limiter)
   app.use(express.json({limit: process.env.REQUEST_BODY_MAX_SIZE || '50mb'}))
   app.use(express.urlencoded({limit: process.env.REQUEST_BODY_MAX_SIZE || '50mb'}))
   app.use(mongoSanitize())
   app.use(helmet())
   app.use(xss())
   app.use(hpp())
   const apiPath = '/api'
   app.use(apiPath, router)
   console.log('[useDocumentGenerator] generate document')
   const document = await generateApiDocument(apiPath, router)
   app.get('/docs', (req, res) => res.send(document.html))
   app.get('/docs/index.html', (req, res) => res.send(document.html))
   app.get('/docs/postman.json', (req, res) => res.send(document.postman))
   console.log('[useDocumentGenerator] document generated!')
}

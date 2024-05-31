import 'reflect-metadata'
import express, {Express} from 'express'
import cors from 'cors'
import { DBConnection } from './db/dbConfig'
import container from './inversify.config'
import { InversifyExpressServer } from 'inversify-express-utils'


const server = new InversifyExpressServer(container)
server.setConfig(app=>{
    app.use(cors())
    app.use(express.json())
})
DBConnection()

server.build().listen(4000, () => {
    console.log("DAMN !!");
})
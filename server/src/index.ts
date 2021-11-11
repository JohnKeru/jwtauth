import 'dotenv/config'
import 'reflect-metadata'
import express from 'express'
import {ApolloServer} from 'apollo-server-express'
import { buildSchema } from 'type-graphql'
import { UserResolvers } from './UserResolvers'
import { createConnection } from 'typeorm'
import { MyContext } from './Context'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import {createAccessToken, createRefreshToken} from './auth'
import { sendRefreshToken } from './sendRefreshToken'
import { Users } from './entity/Users'
import cors from 'cors'

(async ()=>{
    const app = express()
    app.use(cookieParser())
    app.use(cors({
        origin: "http://localhost:3000",
        credentials: true
        }))

    const appoloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [UserResolvers]
        }),
        context: ({req, res}:MyContext) => ({req, res})
    })
    await createConnection()
    await appoloServer.start()
    appoloServer.applyMiddleware({app, cors: false})

    app.post('/refresh_token', async(req, res) => {
        const token = req.cookies.keru
        if(!token) return res.status(405).send({ok: false, No_Access_Token: "Can't Access this without token."})
        let payload: any = null;        
        try{
            payload = jwt.verify(token, 'refresh')
        }catch(err){
            return res.status(405).send({ok: false, Invalid_Access_Token: 'Your token has expired.'})
        }
        const user = await Users.findOne({id: payload.userId})
        
        if(!user) return res.status(405).send({ok: false, No_User: 'No user have been found.'})
        if(user.tokenVersion !== payload.tokenVersion) return res.status(404).send({ok: false, Token_Version: 'Invalid Version of Token!'})
        sendRefreshToken(res, createRefreshToken(user));
        return res.send({ok: true, accessToken: createAccessToken(user)})
    })
    
    app.listen(5000, () => console.log('🚀🚀🚀 server on 🚀🚀🚀'))

}) ()








/*import "reflect-metadata";
import {createConnection} from "typeorm";
import {User} from "./entity/User";

createConnection().then(async connection => {

    console.log("Inserting a new user into the database...");
    const user = new User();
    user.firstName = "Timber";
    user.lastName = "Saw";
    user.age = 25;
    await connection.manager.save(user);
    console.log("Saved a new user with id: " + user.id);

    console.log("Loading users from the database...");
    const users = await connection.manager.find(User);
    console.log("Loaded users: ", users);

    console.log("Here you can setup and run express/koa/any other framework.");

}).catch(error => console.log(error));
*/
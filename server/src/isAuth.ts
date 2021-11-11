import {MiddlewareFn} from 'type-graphql'
import {MyContext} from './Context'
import jwt from 'jsonwebtoken'

export const isAuth: MiddlewareFn<MyContext> = ({context}, next) => {
    const authorization = context.req.headers.authorization
    if(!authorization) throw new Error('Fuck off!')
    try{
        const token = authorization.split(' ')[1]
        const payload = jwt.verify(token, 'access')
        context.payload = payload as any;
    }catch(err){
        throw new Error('Invalid token.')
    }

    return next()
}
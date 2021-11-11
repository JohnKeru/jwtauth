import jwt from 'jsonwebtoken'
import { Users } from './entity/Users'

export const createAccessToken = (user: Users) => {
    return jwt.sign({userId: user.id}, 'access', {expiresIn: '5s'})
}

export const createRefreshToken = (user: Users) => {
    return jwt.sign({userId: user.id, tokenVersion: user.tokenVersion}, 'refresh', {expiresIn: '7d'})
}
import {Arg, Ctx, Field, Int, Mutation, ObjectType, Query, Resolver, UseMiddleware   } from 'type-graphql'
import { Users } from './entity/Users'
import {hash, compare} from 'bcryptjs'
import { MyContext } from './Context'
import {isAuth} from './isAuth'
import { createRefreshToken } from './auth'
import { sendRefreshToken } from './sendRefreshToken'
import { getConnection } from 'typeorm'
import jwt from 'jsonwebtoken'

@ObjectType()
class Login{
    @Field()
    accessToken: string
    @Field(() => Users)
    user: Users
}

@Resolver()
export class UserResolvers{

    @Query(() => [Users])
    users(){
        return Users.find()
    }

    @Mutation(() => Boolean)
    logout(@Ctx(){res}:MyContext){
        sendRefreshToken(res, "");
        return true;
    }

    @Query(() => Users, {nullable: true})
    me(@Ctx(){req}:MyContext){
        const authorization = req.headers.authorization
        if(!authorization) return null;
        try{
            const token = authorization.split(' ')[1]
            const payload:any = jwt.verify(token, 'access')
            return Users.findOne(payload.userId)
        }catch(err){
            return null;
        }
    }

    @Mutation(() => Boolean)
    async revokeRefreshToken(@Arg('userId', () => Int)userId:number){
        await getConnection().getRepository(Users).increment({id: userId}, 'tokenVersion', 1)
        return true;
    }

    @Query(() => String)
    @UseMiddleware(isAuth)
    bye(@Ctx(){payload}:MyContext){
        return `your user are: ${payload!.userId}`
    }

    @Mutation(() => Login)
    async login(@Arg('email') email:string, @Arg('password') password: string, @Ctx() {res}: MyContext):Promise<Login>{
        const user = await Users.findOne({where: {email}})
        if(!user) throw new Error('User not found!')
        const valid = await compare(password, user.password)
        if(!valid) throw new Error('Wrong password!')   

        sendRefreshToken(res, createRefreshToken(user));

        return {
            accessToken: createRefreshToken(user),
            user
        };
    }

    @Mutation(() => Boolean)
    async register(@Arg('email') email:string, @Arg('password') password: string){
        try{
            const passhash = await hash(password, 13)
            await Users.insert({email, password: passhash})
        }catch(err){
            console.log(err)
            return false;
        }
        return true;
    }

}
import {Router} from 'express'
import { model } from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import mailer from '../../modules/mailer'
import authConfig from '../../config/auth.json'
import '../models/users'

const User = model('User')
const router = Router()

function generateToken(params = {}){
    return jwt.sign(params, authConfig.secret, {
        expiresIn:86400,
    })
}
router.post('/register', async (req,res)=>{
    const {email} = req.body
    try{
        if(await User.findOne({email})) return res.status(400).send({error: 'User already exists'})

        const user = await User.create(req.body)

        user.password = undefined

        return res.send({
            user, 
            token: generateToken({id:user.id})
        })
    }catch(err) {
        return res.send({ error:'Registration failed', err})
    }
})

router.post('/authenticate',async (req,res)=>{
    const { email, password } = req.body
    const user = await User.findOne({ email }).select('+password')

    if(!user) return res.status(400).send({ error: 'User not found' })

    if(! await bcrypt.compare(password, user.password)) return res.status(400).send({ error: 'Invalid Password' })

    user.password = undefined

    return res.send({
        user,
        token: generateToken({ id: user.id })
    })
})
router.post('/forgot_password', async (req,res)=>{
    const {email} = req.body

    try{

        const user = await User.findOne({ email })

        if(!user) return res.status(400).send({ error: 'User not found' })

        const token = crypto.randomBytes(20).toString('hex')
        const now = new Date()
        now.setHours(now.getHours() + 1 )

        await User.findByIdAndUpdate(user.id, {
            '$set': {
                passwordResetToken: token,
                passwordResetExpires: now,
            }
        })
        
        mailer.sendMail({
            to: email,
            from: 'contato@connectgdn.com',
            template: 'auth/forgot_password',
            context: { token },
        }, (err)=>{
            
            if(err) return res.status(400).send({ error: 'Cannot send forgot password email' })

            
            return res.send({ success: `Email enviado com sucesso ${token}` })
        })

    }catch(err){
        
        res.status(400).send({ error: 'Error on forgot password, try again' })
    }
})

router.post('/reset_password', async (req,res)=>{
    const {email, token, password} = req.body

    try{
        const user = await User.findOne({ email }).select(' +passwordResetToken passwordResetExpires ')

        if(!user) return res.status(400).send({ error: ' User not found. ' })

        if(token !== user.passwordResetToken) return res.status(400).send({ error: `Ivalid token`})

        const now = new Date()

        if(now > user.passwordResetExpires) return res.status(400).send({ error: ' Expired Token, generate a new one ' })

        user.password = password

        await user.save()

        res.send({ success: ' Successfully password updated ' })

    }catch(err){
        console.log(err)
        return res.status(400).send({ error: ' Cannot reset password, try again ' })
    }
})

export default  app => app.use('/auth',router)
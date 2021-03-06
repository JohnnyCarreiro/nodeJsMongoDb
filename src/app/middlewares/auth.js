import jwt from 'jsonwebtoken'
import authConfig from '../../config/auth.json'

export default (req,res,next) =>{
    const authHeader = req.headers.authorization

    if(!authHeader) return res.status(401).send({ error:'User not authenticated' })

    const parts = authHeader.split(' ')
    if(!parts.length === 2) return res.status(401).send({ erro: 'token error' })

    const [ scheme, token ] = parts
    if(!/^Bearer$/i.test(scheme))return res.status(401).send({ error: 'malformatted token' })

    jwt.verify(token, authConfig.secret, (err,decoded)=>{
        if(err) return res.status(401).send({ erro: ' invalid token' })

        req.userId = decoded.id
        return next()
    })
}
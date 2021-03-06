import fs from 'fs'
import path from 'path'

export default app =>{
    fs
        .readdirSync(__dirname)
        .filter(file =>((file.indexOf('.')) !== 0 && (file !== 'router.js')))
        .forEach(file => require(path.resolve(__dirname,file))(app))
}
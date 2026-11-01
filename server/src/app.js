import express from "express"
import cors from "cors"
import authRoutes from './routes/auth.route.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/users', authRoutes);

app.get("/health",(req,res)=>{
    res.status(200).json({
        message:"Welcome Aurora Studio",
        status: "Running"
    })
})

export {app}
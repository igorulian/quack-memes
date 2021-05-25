const mongoose = require('mongoose')

const Meme = mongoose.model('Meme')
const User = mongoose.model('User')

module.exports = {

    async list(req,res){
        try{
            const userid = req.tokenUserId
            
            // const memes = await Meme.paginate({}, {page, limit:40}) 
            const memes = await Meme.find().sort({likes: -1}).select('+alreadyRate')
            // const memes = await Meme.find().select('+alreadyRate')

            const memesDidntRateYet = []

            memes.forEach(meme => {

                if(!meme.alreadyRate.includes(userid)){
                    meme.alreadyRate = null
                    memesDidntRateYet.push(meme)
                }
                
            });

            return res.json(memesDidntRateYet)
        }catch(err){
            console.log(err)
            return res.status(400).send({error: 'Error in list memes'})
        }
    },
    async show(req,res){
        try{
            const meme = await Meme.findById(req.params.id)
 
            return res.json(meme) 
        }catch{
            return res.status(400).send({error: 'Error in show memes'})
        }
    },

    async upload(req,res) {
        try{

            const user = await User.findById(req.tokenUserId)

            const meme = {
                publisherName: user.user,
                publisherID: user._id,
                imageUrl: req.body.imageUrl,
                description: req.body.description
            }

            await Meme.create(meme)

            return res.json(meme)
        
        }catch{
            return res.status(400).send({error: 'Error in upload meme'})
        }
    },
    async uploadImage(req,res) {
        try{
            return res.json(req.file)
        }catch{
            return res.status(400).send({error: 'Error in upload image'})
        }
    },
    async rate(req,res) {
        try{
            const memeid = req.params.memeid 
            const rate = req.params.rate 
            const userid = req.tokenUserId

            const meme = await Meme.findById(memeid).select('+alreadyRate')

            if(!meme)
                return res.status(400).send({error: 'Error in find meme'})

            if(meme.alreadyRate.includes(userid))
                return res.status(400).send({error: 'You already rated this meme'})


            const likes = meme.likes
            const dislikes = meme.dislikes

            const newAlreadyRate = meme.alreadyRate
            newAlreadyRate.push(userid)

            var newMeme = {}

            switch (rate) {
                case '1':
                    newMeme = {
                        likes: likes + 1,
                        alreadyRate: newAlreadyRate
                    }
                    break;

                case '0':
                    newMeme = {
                        dislikes: dislikes + 1,
                        alreadyRate: newAlreadyRate
                    }
                    break;
            
                default:
                    return res.status(400).send({error: 'Invalid rate'})
            }

            await Meme.findByIdAndUpdate(memeid, newMeme, {new: true,useFindAndModify: false})
            
            return res.status(200).send({})

        }catch{
            return res.status(400).send({error: 'Error in rate meme'})
        }
    },
}
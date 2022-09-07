const PORT                  = 3000
const express               = require('express')
const session               = require('express-session')
const path                  = require('path')
const bodyParser            = require('body-parser')
const ejs                   = require('ejs')
const mongoose              = require('mongoose')

const app                   = express()

const validator             = require('./validators/voteValidator')
const { validationResult }  = require('express-validator')

mongoose.connect('mongodb+srv://ryandougc:Sportking11@cluster0.zgrny.mongodb.net/?retryWrites=true&w=majority')

const voteSchema            = require('./models/vote.model')
const hairstyleSchema       = require('./models/hairstyle.model')
const suggestionSchema      = require('./models/suggestion.model')

const Vote                  = mongoose.model('Vote', voteSchema)
const Hairstyle             = mongoose.model('Hairstyle', hairstyleSchema)
const Suggestion            = mongoose.model('Suggestion', suggestionSchema)

app.use(bodyParser.urlencoded({ extended: true }))

// Express Session Setup
app.set('trust proxy', 1)
app.use(session({
  secret: '6c39e088-1db0-4748-a684-74d47e39576d',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}))

// EJS setup
app.use(express.static('public'))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, './views'))

app.get('/', (req, res, next) => {
    if(req.session.prevUrl !== "/api/vote") {
        req.session.formError = null
    }

    req.session.prevUrl = "/"

    //Get Hairstyles from DB
    Hairstyle.find()
        .then(result => {

            // Check for form errors
            let errors = []

            if(req.session.formError) {
                errors = req.session.formError
            }

            // Send over the landing page EJS file
            res.render('index.ejs', { hairstyles: result, errors: errors })
        })
})

app.get('/thankyou', (req, res, next) => {
    req.session.prevUrl = "/thankyou"

    res.render('message.ejs', {
        message: "Thank You For Donating",
        description: "I will be revealing the winning hairstyle on my social media on August 29th."
    })
})

app.post('/api/vote', [
    validator.validateVote,
    async (req, res, next) => {
        console.log(req.body.hairstyle)
        console.log(req.body.voterName)

        req.session.prevUrl = "/api/vote"

        const errors = validationResult(req)

        if(!errors.isEmpty()) {
            req.session.formError = null

            req.session.formError = errors.array()

            res.redirect('/')
        } else {
            try {
                if(req.body.hairstyleSuggestion !== "") {
                    const newSuggestion = new Suggestion({
                        voterName: req.body.voterName,
                        suggestion: req.body.hairstyleSuggestion
                    })
    
                    await newSuggestion.save()
                }

                const newVote = new Vote({
                    hairstyle: req.body.hairstyle,
                    voterName: req.body.voterName
                })
                
                await newVote.save()
    
                req.session.formError = null
    
                res.redirect('/thankyou')
            } catch(err){ 
                console.log(err)

                //render 500 error
                res.render('message.ejs', { 
                    errorStatus: 500,
                    message: "Error 500: Oops, something went wrong",
                    description: "The server encountered an error or misconfiguration and was unable to complete your request" 
                })
            }
        }
    }
])

app.listen(PORT, err => {
    if(err) return console.log(err)

    return console.log(`Server is listening on port ${PORT}...`)
})
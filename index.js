const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const dotenv = require('dotenv').config()
const Person = require('./models/person')
const app = express()

app.use(express.static('dist'))
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :data'))
app.use(express.json())
app.use(cors())

morgan.token('data', (request) => {
  return request.method === 'POST' ? JSON.stringify(request.body) : null
})

let persons = []

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

app.get('/info', (request, response) => {
  Person.countDocuments()
    .then(count => {
      response.send(`
    <p>Phonebook has info for ${count} people</p>
    <p>${new Date().toString()}`)
    })
})

app.get('/api/persons', (request, response) => {
  Person.find({}).then(foundPersons => {
    persons = foundPersons
    response.json(foundPersons)
  })
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
  const body = request.body

  if(!body.name && !body.number) {
    return response.status(400).json({
      error: 'Name or number missing'
    })
  }

  const person = new Person({
    name: body.name,
    number: body.number
  })

  person.save()
    .then(savedPerson => {
      response.json(savedPerson)
    })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const { name, number } = request.body

  Person.findByIdAndUpdate(
    request.params.id,
    { name, number },
    { new: true, runValidators: true, context: 'query' })
    .then(updatedPersom => {
      response.json(updatedPersom)
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  const person = persons.find(p => p.id == request.params.id)
  Person.findByIdAndDelete(request.params.id)
    .then(result => {
      response.json(person)
    })
    .catch(error => next(error))
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

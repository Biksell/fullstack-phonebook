const express = require("express")
const morgan = require("morgan")
const cors = require("cors")
const dotenv = require("dotenv").config()
const Person = require("./models/person")
const app = express()

app.use(morgan(":method :url :status :res[content-length] - :response-time ms :data"))
app.use(express.json())
app.use(cors())
app.use(express.static("dist"))

morgan.token("data", (request) => {
  return request.method === "POST" ? JSON.stringify(request.body) : null
})

let persons = []

const generateId = () => {
  let id = -1
  while(persons.find(p => p.id == id) || id == -1) {
    id = Math.floor(Math.random() * 1000000)
  }
  console.log(id)
  return id;
}

app.get("/", (request, response) => {
  response.send("<h1>Hello World!</h1>")
})

app.get("/info", (request, response) => {
  response.send(`
    <p>Phonebook has info for ${persons.length} people</p>
    <p>${new Date().toString()}</p>
  `)
})

app.get("/api/persons", (request, response) => {
  Person.find({}).then(foundPersons => {
    persons = foundPersons
    response.json(foundPersons)
  })
})

app.get("/api/persons/:id", (request, response) => {
  Person.findById(request.params.id).then(person => {
    response.json(person)
  })
})

app.post("/api/persons", (request, response) => {
  const body = request.body

  if (!body.name) {
    return response.status(400).json({
      error: "Name is missing"
    })
  } else if (!body.number) {
    return response.status(400).json({
      error: "Number is missing"
    })
  } else if (persons.find(p => p.name === body.name)) {
    return response.status(400).json({
      error: "Name must be unique"
    })
  }

  const person = new Person({
    name: body.name,
    number: body.number,
  })

  person.save().then(savedPerson => {
    response.json(savedPerson)
  })
})

app.delete("/api/persons/:id", (request, response) => {
  const id = request.params.id
  console.log(persons.length)
  const person = persons.find(p => p.id == id)
  persons = persons.filter(p => p.id != id)
  console.log(persons.length)

  response.json(person)
})

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

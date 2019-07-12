const supertest = require('supertest')
const mongoose = require('mongoose')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')
const User = require('../models/user')
const bcrypt = require('bcrypt')

describe('when there are initially some blogs saved', () => {

  beforeEach(async () => {
    await Blog.deleteMany({})

    const blogObjects = helper.initialBlogs
      .map(blog => new Blog(blog))
    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray)
  })

  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body.length).toBe(helper.initialBlogs.length)
  })

  test('a specific blog is within the returned blogss', async () => {
    const response = await api.get('/api/blogs')

    const authors = response.body.map(r => r.author)

    expect(authors).toContain(
      'Edsger W. Dijkstra'
    )
  })

  test('identification field has name as id ', async () => {
    const blogs = await Blog.find({})
    const firstBlogId = blogs.map(r => r.toJSON())[0].id

    expect(firstBlogId).toBeDefined()

  })

})


describe('addition of a new blog', () => {
  test('a valid blog can be added ', async () => {

    const newBlog = {
      title: 'Type wars',
      author: 'Robert C. Martin',
      url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
      likes: 2
    }

    const blogsBefore = await helper.blogsInDb()

    const lengthBefore = blogsBefore.length

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    const lengthAtEnd = blogsAtEnd.length
    expect(lengthAtEnd).toBe(lengthBefore + 1)

    const titles = blogsAtEnd.map(n => n.title)
    expect(titles).toContain(
      'Type wars'
    )
  })

  test('a blog with undefined likes can be added with likes set to 0 ', async () => {

    const dummyBlog = {
      title: 'Just for testing',
      author: 'Dmitri',
      url: 'http://dummy.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html'
    }


    const blogsBefore = await helper.blogsInDb()

    const lengthBefore = blogsBefore.length

    await api
      .post('/api/blogs')
      .send(dummyBlog)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const blogsAfter = await helper.blogsInDb()
    const lengthAfter = blogsAfter.length
    expect(lengthAfter).toBe(lengthBefore + 1)

    const likes = blogsAfter.map(n => n.likes)
    expect(likes[lengthAfter - 1]).toBe(0)
  })

  test('blog without title and url is not added', async () => {

    const newBlog = {
      author: 'Tutti',
      likes:1000000
    }

    const blogsBefore = await helper.blogsInDb()
    const lengthBefore = blogsBefore.length

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(400)

    const blogsAfter = await helper.blogsInDb()

    const lengthAfter = blogsAfter.length

    expect(lengthAfter).toBe(lengthBefore)
  })

})

describe('deletion of a blog', () => {
  test('succeeds with status code 200 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd.length).toBe(
      blogsAtStart.length - 1
    )

    const titles = blogsAtEnd.map(r => r.title)

    expect(titles).not.toContain(blogToDelete.title)
  })
})

describe('viewing a specific blog', () => {

  test('succeeds with a valid id', async () => {
    const blogsAtStart = await helper.blogsInDb()

    const blogToView = blogsAtStart[0]

    const resultBlog = await api
      .get(`/api/blogs/${blogToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(resultBlog.body).toEqual(blogToView)
  })

  test('fails with statuscode 404 if note does not exist', async () => {
    const validNonexistingId = await helper.nonExistingId()

    await api
      .get(`/api/blogs/${validNonexistingId}`)
      .expect(404)

  })

  test('fails with statuscode 400 if id is invalid', async () => {
    const invalidId = '5a3d5da59070081a82a3445'

    await api
      .get(`/api/blogs/${invalidId}`)
      .expect(400)

  })
})

describe('update of a blog', () => {
  test('a blog with known id can be updated  ', async () => {

    const newBlog = {
      title: 'Type wars',
      author: 'Robert C. Martin',
      url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
      likes: 100
    }

    const blogsBefore = await helper.blogsInDb()
    const lengthBefore = blogsBefore.length
    const blogToUpdate = blogsBefore[0]


    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(newBlog)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const blogsAfter = await helper.blogsInDb()
    const lengthAfter = blogsAfter.length
    expect(lengthAfter).toBe(lengthBefore)

    expect(blogsAfter[0].likes).toBe(100)
  })

})

describe('when there is initially one user at db', () => {
  beforeEach(async () => {
    await User.deleteMany({})
    const saltRounds = 10
    const passwordHash = await bcrypt.hash('sekret', saltRounds)

    const user = new User ({
      username:'root',
      name:'superuser',
      password:'sekret',
      passwordHash
    })
    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })
  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('`username` to be unique')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length)
  })

  test('creation fails with proper statuscode and message if username is undefined', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: null,
      name: 'Superuser',
      password: 'salainenNull',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('Path `username` is required')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length)
  })

  test('creation fails with proper statuscode and message if username is less than 3', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'ro',
      name: 'SuperuserRo',
      password: 'salainenRo',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('Path `username` (`ro`) is shorter than')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length)
  })

  test('creation fails with proper statuscode and message if password is less than 3', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'rooot',
      name: 'superuserRooo',
      password: 'sa',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('password length is less than 3')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length)
  })

  test('creation fails with proper statuscode and message if password is undefined', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'roooot',
      name: 'superuserRoooo'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('undefined password')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length)
  })




})



afterAll(() => {
  mongoose.connection.close()
})
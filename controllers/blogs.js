const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

mongoose.set('useFindAndModify', false)

const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')




blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user')
  response.json(blogs.map(blog => blog.toJSON()))

})

blogsRouter.post('/', async (request, response, next) => {
  const body = request.body

  /*  const user = await User.findById(body.userId)  */

  /*  const users = await User.find({})
  const user = users[0]       */

  try {
    const decodedToken = jwt.verify(request.token, process.env.SECRET)
    if (!request.token || !decodedToken.id) {
      return response.status(401).json({ error: 'token missing or invalid' })
    }

    const user = await User.findById(decodedToken.id)

    const blog = new Blog({
      title:body.title,
      author:body.author,
      url:body.url,
      likes:body.likes === undefined ? 0 : body.likes,
      user:user._id,
      comments:body.comments === undefined ? [] : body.comments
    })

    if (blog.title === undefined && blog.url === undefined) {
      await response.status(400).end()
    } else {
      const savedBlog = await blog.save()
      user.blogs = user.blogs.concat(savedBlog._id)
      await user.save()
      response.json(savedBlog.toJSON())
    }
  } catch(exception) {
    next(exception)
  }
})

blogsRouter.get('/:id', async (request, response, next) => {
  try {
    const blog = await Blog.findById(request.params.id)
    if(blog) {
      response.json(blog.toJSON())
    } else {
      response.status(404).end()
    }
  } catch(exeption) {
    next(exeption)
  }
})

const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring(7)
  }
  return null
}

blogsRouter.delete('/:id', async (request, response, next) => {

  const token = getTokenFrom(request)

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!token || !decodedToken.id) {
      return response.status(401).json({ error: 'token missing or invalid' })
    }

    const userid = decodedToken.id

    const blog = await Blog.findById(request.params.id)

    if ( blog.user.toString() === userid.toString() ) {

      await Blog.findByIdAndRemove(request.params.id)
      response.status(204).end()
    } else {
      return response.status(400).json({ error: 'token does not correspond to the blog creator' })
    }
  } catch (exception) {
    next(exception)
  }
})

blogsRouter.put('/:id', async (request, response, next) => {
  try {
    const body = request.body

    const blog = {
      title:body.title,
      url:body.url,
      author:body.author,
      likes:body.likes,
      comments:body.comments
    }
    console.log('in Blog Ruter put blog', blog)

    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
    response.json(updatedBlog.toJSON())
    console.log(response.json(updatedBlog.toJSON()))
  } catch(exception) {
    next(exception)
  }
})

blogsRouter.put('/:id/comments', async (request, response, next) => {
  try {
    const body = request.body

    const blog = {
      title:body.title,
      url:body.url,
      author:body.author,
      likes:body.likes,
      comments:body.comments
    }


    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
    response.json(updatedBlog.toJSON())
  } catch(exception) {
    next(exception)
  }
})


module.exports = blogsRouter
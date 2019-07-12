var _ = require('lodash')

const dummy = (blogs) => {
  return 1
}

const totalLikes = blogs => {
  const reducer = (sum, blog) => {
    return sum + blog.likes
  }

  return blogs.length === 0
    ? 0
    : blogs.reduce(reducer, 0)
}

const favoriteBlog = blogs => {
  const reducer = (sum, blog) => {
    if(sum.likes < blog.likes) {
      return blog
    } else {
      return sum
    }
  }

  return blogs.length === 0
    ? {}
    : {
      title:blogs.reduce(reducer, blogs[0]).title,
      author:blogs.reduce(reducer, blogs[0]).author,
      likes:blogs.reduce(reducer, blogs[0]).likes
    }

}


const groupByAuthorCollection = blogs => {
  const collectionA = _.groupBy(blogs, function(o) {return o.author})
  const collectionB = _.map(collectionA, function(value, key){ return [ key, value.length, totalLikes(value) ]  } )
  return collectionB
}

const mostBlogs = blogs => {
  const collection = groupByAuthorCollection(blogs)
  const reducer = (sum, blog) => {
    if(sum[1] < blog[1]) {
      return blog
    } else {
      return sum
    }
  }

  return collection.length === 0
    ? {}
    : {
      author:collection.reduce(reducer, collection[0])[0],
      blogs:collection.reduce(reducer, collection[0])[1]
    }

}

const mostLikes = blogs => {
  const collection = groupByAuthorCollection(blogs)
  const reducer = (sum, blog) => {
    if(sum[2] < blog[2]) {
      return blog
    } else {
      return sum
    }
  }

  return collection.length === 0
    ? {}
    : {
      author:collection.reduce(reducer, collection[0])[0],
      likes:collection.reduce(reducer, collection[0])[2]
    }

}


module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}

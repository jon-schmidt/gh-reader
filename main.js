// gh-reader/main.js

const args = require('args')
const colors = require('colors/safe')
const get = require('axios').get
const hget = require('hget')
const prompt = require('prompt')

// setup prompt
prompt.message = ''
prompt.delimiter = colors.magenta('?')

// add Promise-based ask method to prompt
prompt.ask = function (request) {
  return new Promise((resolve, reject) => {
    prompt.get(request, (err, result) => {
      if (err) reject(err)

      resolve(result)
    })
  })
}

args
.option('user', 'github username')
.option('repo', 'repo to search for')
.option('markdown', 'show result as markdown')
.option('less', 'pipe result to less')

const options = args.parse(process.argv)

main()

async function main () {
  if (options.repo) getReadme(`https://github.com/${options.repo}`)
  else {
    if (options.user) getUser(options.user)
    else {
      const result = await prompt.ask('username')

      getUser(result.username)
    }
  }
}
async function getUser (username) {
  const result = await get(`https://api.github.com/users/${username}/repos`)
  const repos = []

  result.data.forEach((repo) => {
    if (!repo.fork) {
      repos.push({ name: repo.name, url: repo.url, html_url: repo.html_url })
    }
  })
  selectRepo(repos)
}
async function selectRepo (repos) {
  let index = 0

  repos.forEach((repo) => {
    index++
    console.log(`${index}) ${repo.name}`)
  })

  const result = await prompt.ask([{
    name: 'number',
    type: 'integer',
    required: true
  }])

  if (result.number > repos.length || result.number === 0) selectRepo()
  else getReadme(repos[result.number - 1].html_url)
}
async function getReadme (url) {
  const html = await get(url)
  const readme = hget(html.data, {
    root: '#readme',
    markdown: options.markdown
  })

  console.log('\x1Bc', readme)
}

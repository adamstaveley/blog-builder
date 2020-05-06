const fs = require("fs")
const path = require("path")
const remark = require("remark")
const html = require("remark-html")
const highlight = require("remark-highlight.js")
const sass = require("sass")
const Handlebars = require("handlebars")
const matter = require("gray-matter")

// TODO: document lib functions

function preparePublicDirectory(publicPath) {
    const dirs = [
        publicPath, 
        path.join(publicPath, "./img"), 
        path.join(publicPath, "./posts"),
        path.join(publicPath, "./styles")
    ]
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }
    }
}

function getHtmlComponent(path) {
    return fs.readFileSync(path, {encoding: "utf-8"})
}

function getIndexPage(head, index, header, posts) {
    const blogList = posts.map(post => ({
        href: `/posts/${post.filename}`, 
        title: post.title
    })) 
    
    const compiledHead = buildComponent(head, {title: "Adam Staveley"})
    const compiledIndex = buildComponent(index, {blogList, header})
    
    // TODO: basic html document component can be compiled using handlebars
    return `<!DOCTYPE html>
<html>
${compiledHead}
<body>
    ${compiledIndex}
</body>
</html>`
}

async function getPostPage(head, title, content, header, footer) {
    const compiledHead = buildComponent(head, {title})

    // TODO: basic html document component can be compiled using handlebars
    return `<!DOCTYPE html>
<html>
${compiledHead}
<body>
    <div class="container">
        ${header}
        <h1>${title}</h1>
        ${content}
        ${footer}
    </div>
</body>
</html>`
}

async function getPosts(postsDir) {
    const posts = []
    const filenames = fs.readdirSync(postsDir)
    for (const filename of filenames) {
        const contentString = fs.readFileSync(path.join(postsDir, filename))
        posts.push({
            filename: filename.replace(".md", ".html"),
            ...await processMarkdown(contentString)
        })
    }
    return posts
}

function processCss(scssFile) {
    return sass.renderSync({
        file: scssFile
    })
}

function writePage(path, content) {
    fs.writeFileSync(path, content)
}

function buildComponent(source, data) {
    const template = Handlebars.compile(source)
    return template(data)
}

async function processMarkdown(markdownString) {
    const markdown = matter(markdownString)
    const content = await remark()
        .use(highlight)
        .use(html)
        .process(markdown.content)
    return {
        content,
        ...markdown.data
    }
}

module.exports = {
    preparePublicDirectory,
    getHtmlComponent,
    getIndexPage,
    getPostPage,
    getPosts,
    processCss,
    writePage
}
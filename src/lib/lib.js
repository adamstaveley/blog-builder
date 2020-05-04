const fs = require("fs")
const path = require("path")
const remark = require("remark")
const html = require("remark-html")
const highlight = require("remark-highlight.js")
const sass = require("sass")
const Handlebars = require("handlebars")

function getHtmlComponent(path) {
    return fs.readFileSync(path, {encoding: "utf-8"})
}

function getIndexPage({ head, index }) {
    const compiledHead = buildHead(head, { title: "Adam Staveley" })
    return `<!DOCTYPE html>
<html>
${compiledHead}
<body>
    ${index}
</body>
</html>`
}

async function getPostPage({ head, title, content, footer }) {
    const compiledHead = buildHead(head, {title})
    const contentHtml = await markdownToHtml(content)
    return `<!DOCTYPE html>
<html>
${compiledHead}
<body>
    <div class="container">
        ${contentHtml}
        ${footer}
    </div>
</body>
</html>`
} 

function buildHead(source, data) {
    const template = Handlebars.compile(source)
    return template(data)
}

function* readPostsDir(postsDir) {
    const posts = fs.readdirSync(postsDir)
    for (const post of posts) {
        yield {
            title: post.replace(".md", ""), 
            content: fs.readFileSync(path.join(postsDir, post))
        }
    }
}

async function markdownToHtml(markdownString) {
    return remark()
        .use(highlight)
        .use(html)
        .process(markdownString)
}

function processCss(scssFile) {
    console.log("rendering", scssFile)
    return sass.renderSync({
        file: scssFile
    })
}

function writePage(path, content) {
    fs.writeFileSync(path, content)
}

module.exports = {
    getHtmlComponent,
    getIndexPage,
    getPostPage,
    buildHead,
    readPostsDir,
    markdownToHtml,
    processCss,
    writePage
}
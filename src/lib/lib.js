const fs = require("fs")
const path = require("path")
const remark = require("remark")
const html = require("remark-html")
const highlight = require("remark-highlight.js")
const sass = require("sass")
const Handlebars = require("handlebars")
const matter = require("gray-matter")
const prettier = require("prettier")

/**
 * Reads the html component directory and returns a map of filenames to content
 * @param {string} componentsPath the html components directory path (absolute)
 * @returns {object} map of filename string to content string
 */
function loadHtmlComponents(componentsPath) {
    const components = {}
    for (const filename of fs.readdirSync(componentsPath)) {
        const filepath = path.join(componentsPath, filename)
        components[filename] = fs.readFileSync(filepath, {encoding: "utf-8"})
    }
    return components
}

/**
 * Creates public directory and subdirectories (img, posts, styles)
 * @param {string} publicPath the root-level public directory path (absolute)
 */
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

/**
 * Creates a page builder for creating any page type (index and blog post)
 * @param {string} documentTemplate string content for top-level html document component
 * @param {string} htmlHeadTemplate string content for html.head component
 * @param {string} pageHeader string content for page header (same for all pages)
 * @returns {object} closure for creating index or blog post page 
 */
function createPageBuilder({documentTemplate, htmlHeadTemplate, pageHeader}) {
    const format = (finishedHtml) => prettier.format(finishedHtml, {parser: "html"})

    return {
        /**
         * Compiles the index page
         * @param {string} title gives the page a unique title
         * @param {string} indexTemplate string content for the index page's body
         * @param {Array} posts array of post data (each object must include filename and title)
         * @returns {string} compiled and formatted html string
         */
        buildIndexPage: ({title, indexTemplate, posts}) => {
            const blogList = posts.map(post => ({
                href: `/posts/${post.filename}`,
                title: post.title
            }))

            const compiledHtml = buildComponent(documentTemplate, {
                head: buildComponent(htmlHeadTemplate, {title}),
                body: buildComponent(indexTemplate, {blogList, pageHeader})
            })

            return format(compiledHtml)
        },
        /**
         * Compiles a blog post page
         * @param {string} title gives the page a unique title
         * @param {string} postTemplate string content for the blog post page's body
         * @param {content} content string blog post content in html format
         * @param {string} pageFooter string content for the blog post page's footer
         * @returns {string} compiled and formatted html string 
         */
        buildPostPage: ({title, postTemplate, content, pageFooter}) => {
            const compiledHtml = buildComponent(documentTemplate, {
                head: buildComponent(htmlHeadTemplate, {title}),
                body: buildComponent(postTemplate, {content, pageHeader, pageFooter})
            })

            return format(compiledHtml)
        }
    }
}

/**
 * Reads directory of markdown blog posts and converts them to html
 * @param {string} postsDir the directory path of the blog posts
 * @returns {Array} blog post objects containing html filename, content and metadata
 */
async function getBlogPosts(postsDir) {
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

/**
 * Convert a scss file to css
 * @param {string} scssFile path to scss file
 * @returns {string} css content
 */
function processCss(scssFile) {
    return sass.renderSync({
        file: scssFile
    })
}

/**
 * Compiles a html template using handlebars
 * @param {string} source html content as string
 * @param {object} data handlebar data to insert into source
 * @returns {string} compiled html
 */
function buildComponent(source, data) {
    // console.log("compiling", source, "Using", data)
    const template = Handlebars.compile(source)
    return template(data)
}

/**
 * Converts markdown to html, including metadata
 * @param {string} markdownString strint content of markdown file
 * @returns {object} string html content and metadata
 */
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

/**
 * Helper methods to aid in building a static blog site
 */
module.exports = {
    loadHtmlComponents,
    preparePublicDirectory,
    createPageBuilder,
    getBlogPosts,
    processCss
}
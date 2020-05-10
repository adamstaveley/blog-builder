const fs = require("fs")
const path = require("path")
const remark = require("remark")
const html = require("remark-html")
const highlight = require("remark-highlight.js")
const sass = require("sass")
const Handlebars = require("handlebars")
const matter = require("gray-matter")
const prettier = require("prettier")
const format = require("date-fns/format")
const parseISO = require("date-fns/parseISO")

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
        path.join(publicPath, "./styles"),
        path.join(publicPath, "./js")
    ]
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }
    }
}

/**
 * Creates a page builder for creating any page type (index and blog post) via closures
 * @param {string} documentTemplate string content for top-level html document component
 * @param {string} htmlHeadTemplate string content for html.head component
 * @param {string} pageHeader string content for page header (same for all pages)
 * @param {string} rootTitle title of root document
 */
function createPageBuilder({documentTemplate, htmlHeadTemplate, pageHeader, rootTitle}) {
    const format = (finishedHtml) => prettier.format(finishedHtml, {parser: "html"})

    return {
        /**
         * Compiles the index page
         * @param {string} indexTemplate string content for the index page's body
         * @param {Array} posts array of post data (each object must include filename, title and date)
         * @returns {string} compiled and formatted html string
         */
        buildIndexPage: ({indexTemplate, posts}) => {
            const blogList = posts.map(post => ({
                href: `/posts/${post.filename}`,
                title: post.title,
                date: readableDate(post.date)
            }))

            const compiledHtml = buildComponent(documentTemplate, {
                head: buildComponent(htmlHeadTemplate, {title: rootTitle}),
                body: buildComponent(indexTemplate, {blogList, pageHeader})
            })

            return format(compiledHtml)
        },
        /**
         * Compiles a blog post page
         * @param {string} postTemplate string content for the blog post page's body
         * @param {string} title gives the page a unique title
         * @param {Array<string>} styles additional css stylesheets to load
         * @param {Array<string>} scripts addtional js scripts to load
         * @param {string} content string blog post content in html format
         * @returns {string} compiled and formatted html string 
         */
        buildPostPage: ({postTemplate, title, styles, scripts, content, date}) => {
            const documentTitle = `${title} | ${rootTitle}`
            date = readableDate(date)
            const compiledHtml = buildComponent(documentTemplate, {
                head: buildComponent(htmlHeadTemplate, {title: documentTitle, styles, scripts}),
                body: buildComponent(postTemplate, {pageHeader, title, content, date})
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
 * Copies all files from source to destination directory
 * @param {string} sourceDir string path of source directory
 * @param {string} destinationDir string path of destination directory
 */
function copyFiles(sourceDir, destinationDir) {
    for (const filename of fs.readdirSync(sourceDir)) {
        const sourcePath = path.join(sourceDir, filename)
        const destinationPath = path.join(destinationDir, filename)
        fs.copyFileSync(sourcePath, destinationPath)
    }
}

/**
 * Copies all styles from source to destination directory
 * @param {string} sourceDir string path of source directory
 * @param {string} destinationDir string path of destination directory
 */
function copyStyles(sourceDir, destinationDir) {
    for (const filename of fs.readdirSync(sourceDir)) {
        let sourcePath = path.join(sourceDir, filename)
        const destinationPath = path.join(destinationDir, filename.replace(".scss", ".css"))
        
        // read symbolic links
        if (fs.lstatSync(sourcePath).isSymbolicLink()) {
            const link = fs.readlinkSync(sourcePath)
            sourcePath = path.join(path.resolve(), link)
        }

        if (sourcePath.endsWith(".scss")) {
            const result = processCss(sourcePath)
            fs.writeFileSync(destinationPath, result.css)
        } else {
            fs.copyFileSync(sourcePath, destinationPath)
        }
    }
}

/**
 * Compiles a html template using handlebars
 * @param {string} source html content as string
 * @param {object} data handlebar data to insert into source
 * @returns {string} compiled html
 */
function buildComponent(source, data) {
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
 * Convert a scss file to css
 * @param {string} scssFile path to scss file
 */
function processCss(scssFile) {
    return sass.renderSync({
        file: scssFile
    })
}

/**
 * Parses a date into machine and human readable values 
 * @param {string} date
 * @returns {object} object containing datetime (machine readable) and value (human readable) date formats
 */
function readableDate(datetime) {
    return {
        datetime,
        value: format(parseISO(datetime), "do LLLL yyyy")
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
    copyFiles,
    copyStyles
}